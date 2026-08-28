#define _DARWIN_C_SOURCE 1
#include <CommonCrypto/CommonDigest.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef O_NOFOLLOW
#define O_NOFOLLOW 0
#endif

#define MAX_LINE 1048576
#define MAX_PARTS 16

#ifndef V138_CONTROLLER_TOKEN_HEX
#define V138_CONTROLLER_TOKEN_HEX ""
#endif

static char capability_nonce[65];
static char capability_lock_hash[65];

typedef struct {
  int *descriptors;
  int count;
} HeldLocks;

__attribute__((noreturn)) static void die(const char *code) {
  fprintf(stderr, "%s\n", code);
  exit(2);
}

static void crash_if(int boundary, int wanted) {
  if (boundary == wanted) _exit(97);
}

static int safe_atom(const char *value) {
  if (!value || !*value || strstr(value, "..") || strchr(value, '\\') || value[0] == '/') return 0;
  for (const char *cursor = value; *cursor; cursor++) {
    if (*cursor == '\t' || *cursor == '\n' || *cursor == '\r') return 0;
  }
  return 1;
}

static int exact_hex(const char *value, size_t length) {
  if (!value || strlen(value) != length) return 0;
  for (size_t index = 0; index < length; index++) {
    if (!((value[index] >= '0' && value[index] <= '9') || (value[index] >= 'a' && value[index] <= 'f'))) return 0;
  }
  return 1;
}

static void sha256_bytes(const unsigned char *bytes, size_t length, char output[65]) {
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(bytes, (CC_LONG)length, digest);
  for (int index = 0; index < CC_SHA256_DIGEST_LENGTH; index++) sprintf(output + index * 2, "%02x", digest[index]);
  output[64] = '\0';
}

static void sort_and_require_lock_projection(char **targets, int count) {
  for (int left = 0; left < count; left++) {
    if (!safe_atom(targets[left])) die("V138_NATIVE_LOCK_TARGET_INVALID");
    for (int right = left + 1; right < count; right++) {
      if (strcmp(targets[left], targets[right]) > 0) { char *swap = targets[left]; targets[left] = targets[right]; targets[right] = swap; }
    }
  }
  size_t length = 0;
  for (int index = 0; index < count; index++) {
    if (index > 0 && strcmp(targets[index - 1], targets[index]) == 0) die("V138_NATIVE_LOCK_TARGET_DUPLICATE");
    length += strlen(targets[index]) + 1;
  }
  unsigned char *projection = malloc(length + 1);
  if (!projection) die("V138_NATIVE_OOM");
  size_t offset = 0;
  for (int index = 0; index < count; index++) {
    size_t target_length = strlen(targets[index]);
    memcpy(projection + offset, targets[index], target_length); offset += target_length; projection[offset++] = '\n';
  }
  char digest[65]; sha256_bytes(projection, offset, digest); free(projection);
  if (strcmp(digest, capability_lock_hash) != 0) die("V138_NATIVE_CAPABILITY_LOCK_MISMATCH");
}

/*
 * The mutation root is already an authenticated descriptor.  Lock files must
 * therefore be opened relative to that descriptor too: reopening the root by
 * pathname would let a concurrent root rename split locks from mutations.
 * The intent lock also retains the first transaction's intent digest, making
 * reuse of one intent path by incompatible transactions fail closed even
 * after the ephemeral intent file has been cleaned up.
 */
static HeldLocks acquire_descriptor_locks(int root, char **targets, int count,
                                          const char *intent_target,
                                          const unsigned char *intent_bytes,
                                          size_t intent_length) {
  sort_and_require_lock_projection(targets, count);
  HeldLocks held = { .descriptors = calloc((size_t)count, sizeof(int)), .count = count };
  if (!held.descriptors) die("V138_NATIVE_OOM");
  char intent_digest[65];
  sha256_bytes(intent_bytes, intent_length, intent_digest);
  for (int index = 0; index < count; index++) {
    char target_digest[65], name[96];
    sha256_bytes((const unsigned char *)targets[index], strlen(targets[index]), target_digest);
    snprintf(name, sizeof(name), ".v138-successor-%s.lock", target_digest);
    int descriptor = openat(root, name, O_RDWR | O_CREAT | O_NOFOLLOW | O_CLOEXEC, 0600);
    if (descriptor < 0) die("V138_NATIVE_LOCK_OPEN_FAILED");
    struct stat status;
    if (fstat(descriptor, &status) != 0 || !S_ISREG(status.st_mode) ||
        status.st_uid != getuid() || (status.st_mode & 0777) != 0600) die("V138_NATIVE_LOCK_UNTRUSTED");
    struct flock lock = { .l_type = F_WRLCK, .l_whence = SEEK_SET, .l_start = 0, .l_len = 0 };
    if (fcntl(descriptor, F_SETLK, &lock) != 0) die("V138_NATIVE_LOCK_BUSY");
    held.descriptors[index] = descriptor;
    if (strcmp(targets[index], intent_target) == 0) {
      char existing[66] = {0};
      ssize_t length = pread(descriptor, existing, 65, 0);
      if (length < 0) die("V138_NATIVE_INTENT_LOCK_READ_FAILED");
      if (length == 0) {
        if (pwrite(descriptor, intent_digest, 64, 0) != 64 || fsync(descriptor) != 0) die("V138_NATIVE_INTENT_LOCK_WRITE_FAILED");
      } else if (length != 64 || memcmp(existing, intent_digest, 64) != 0) {
        die("V138_NATIVE_INTENT_LOCK_CONFLICT");
      }
    }
  }
  return held;
}

static void release_descriptor_locks(HeldLocks held) {
  for (int index = 0; index < held.count; index++) close(held.descriptors[index]);
  free(held.descriptors);
}

static unsigned char nybble(char value) {
  if (value >= '0' && value <= '9') return (unsigned char)(value - '0');
  if (value >= 'a' && value <= 'f') return (unsigned char)(10 + value - 'a');
  die("V138_NATIVE_HEX_INVALID");
}

static unsigned char *decode_hex(const char *hex, size_t *length) {
  size_t size = strlen(hex);
  if (size % 2 != 0) die("V138_NATIVE_HEX_INVALID");
  unsigned char *bytes = malloc(size / 2 + 1);
  if (!bytes) die("V138_NATIVE_OOM");
  for (size_t index = 0; index < size; index += 2) bytes[index / 2] = (unsigned char)((nybble(hex[index]) << 4) | nybble(hex[index + 1]));
  *length = size / 2;
  return bytes;
}

static int split_tabs(char *line, char **parts, int maximum) {
  int count = 0;
  char *cursor = line;
  while (cursor && count < maximum) {
    parts[count++] = strsep(&cursor, "\t");
  }
  if (cursor != NULL) die("V138_NATIVE_INPUT_OVERFLOW");
  if (count > 0) parts[count - 1][strcspn(parts[count - 1], "\r\n")] = '\0';
  return count;
}

static int dup_cloexec(int descriptor) {
  int result = fcntl(descriptor, F_DUPFD_CLOEXEC, 3);
  if (result < 0) die("V138_NATIVE_DUP_FAILED");
  return result;
}

typedef struct {
  int parent;
  char name[256];
} RelativeFile;

static RelativeFile open_parent(int root, const char *relative) {
  if (!safe_atom(relative)) die("V138_NATIVE_RELATIVE_INVALID");
  char copy[4096];
  if (strlen(relative) >= sizeof(copy)) die("V138_NATIVE_RELATIVE_INVALID");
  strcpy(copy, relative);
  int current = dup_cloexec(root);
  char *save = NULL;
  char *part = strtok_r(copy, "/", &save);
  if (!part) die("V138_NATIVE_RELATIVE_INVALID");
  for (;;) {
    char *next = strtok_r(NULL, "/", &save);
    if (!next) {
      RelativeFile result = { .parent = current };
      if (strlen(part) >= sizeof(result.name)) die("V138_NATIVE_NAME_INVALID");
      strcpy(result.name, part);
      return result;
    }
    int child = openat(current, part, O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
    if (child < 0) die("V138_NATIVE_PARENT_UNSAFE");
    struct stat status;
    if (fstat(child, &status) != 0 || !S_ISDIR(status.st_mode)) die("V138_NATIVE_PARENT_UNSAFE");
    close(current);
    current = child;
    part = next;
  }
}

static int open_internal_dir(int root, const char *name) {
  if (mkdirat(root, name, 0700) != 0 && errno != EEXIST) die("V138_NATIVE_INTERNAL_CREATE_FAILED");
  int descriptor = openat(root, name, O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (descriptor < 0) die("V138_NATIVE_INTERNAL_DIRECTORY_INVALID");
  struct stat status;
  if (fstat(descriptor, &status) != 0 || !S_ISDIR(status.st_mode)) die("V138_NATIVE_INTERNAL_DIRECTORY_INVALID");
  return descriptor;
}

static int regular_state(RelativeFile file) {
  struct stat status;
  if (fstatat(file.parent, file.name, &status, AT_SYMLINK_NOFOLLOW) != 0) {
    if (errno == ENOENT) return 0;
    die("V138_NATIVE_STAT_FAILED");
  }
  if (!S_ISREG(status.st_mode)) die("V138_NATIVE_ENTRY_UNSAFE");
  return 1;
}

static int regular_state_at(int directory, const char *name) {
  RelativeFile file = { .parent = directory };
  if (strlen(name) >= sizeof(file.name)) die("V138_NATIVE_NAME_INVALID");
  strcpy(file.name, name);
  return regular_state(file);
}

static unsigned char *read_regular(RelativeFile file, size_t *length, struct stat *identity) {
  int descriptor = openat(file.parent, file.name, O_RDONLY | O_NOFOLLOW | O_CLOEXEC);
  if (descriptor < 0) die("V138_NATIVE_OPEN_FAILED");
  struct stat status;
  if (fstat(descriptor, &status) != 0 || !S_ISREG(status.st_mode)) die("V138_NATIVE_ENTRY_UNSAFE");
  if (status.st_size < 0 || status.st_size > MAX_LINE * 8) die("V138_NATIVE_FILE_SIZE_INVALID");
  unsigned char *bytes = malloc((size_t)status.st_size + 1);
  if (!bytes) die("V138_NATIVE_OOM");
  size_t offset = 0;
  while (offset < (size_t)status.st_size) {
    ssize_t count = read(descriptor, bytes + offset, (size_t)status.st_size - offset);
    if (count <= 0) die("V138_NATIVE_READ_FAILED");
    offset += (size_t)count;
  }
  close(descriptor);
  *length = offset;
  if (identity) *identity = status;
  return bytes;
}

static int bytes_equal(RelativeFile file, const unsigned char *expected, size_t expected_length) {
  size_t length = 0;
  unsigned char *actual = read_regular(file, &length, NULL);
  int equal = length == expected_length && memcmp(actual, expected, length) == 0;
  free(actual);
  return equal;
}

static void cleanup_uncommitted(int directory, const char *namespace, const char *label) {
  char prefix[180];
  snprintf(prefix, sizeof(prefix), ".v138-u-%s-", namespace);
  int scan = dup_cloexec(directory);
  DIR *entries = fdopendir(scan);
  if (!entries) die("V138_NATIVE_UNCOMMITTED_SCAN_FAILED");
  struct dirent *entry;
  while ((entry = readdir(entries)) != NULL) {
    if (strncmp(entry->d_name, prefix, strlen(prefix)) != 0 || !strstr(entry->d_name, label)) continue;
    struct stat status;
    if (fstatat(directory, entry->d_name, &status, AT_SYMLINK_NOFOLLOW) != 0 || !S_ISREG(status.st_mode) ||
        status.st_uid != getuid() || (status.st_mode & 0777) != 0600 || status.st_nlink < 1 || status.st_nlink > 2) {
      closedir(entries); die("V138_NATIVE_UNCOMMITTED_UNAUTHENTICATED");
    }
    if (unlinkat(directory, entry->d_name, 0) != 0) { closedir(entries); die("V138_NATIVE_UNCOMMITTED_CLEANUP_FAILED"); }
  }
  closedir(entries);
  if (fsync(directory) != 0) die("V138_NATIVE_FSYNC_FAILED");
}

/*
 * Canonical names become visible only after the complete bytes are durable.
 * A process death can leave only a nonce-bound, owner-only, single-link
 * uncommitted file; the next invocation authenticates and removes it.
 */
static void write_committed(RelativeFile file, const unsigned char *bytes, size_t length, const char *namespace, const char *label, int crash_boundary) {
  cleanup_uncommitted(file.parent, namespace, label);
  char temporary[256];
  snprintf(temporary, sizeof(temporary), ".v138-u-%s-%s-%s", namespace, capability_nonce, label);
  int descriptor = openat(file.parent, temporary, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (descriptor < 0) die("V138_NATIVE_UNCOMMITTED_WRITE_FAILED");
  size_t offset = 0;
  while (offset < length) {
    size_t requested = length - offset;
    if (crash_boundary == 100 && offset == 0 && requested > 1) requested = requested / 2;
    ssize_t count = write(descriptor, bytes + offset, requested);
    if (count <= 0) die("V138_NATIVE_WRITE_FAILED");
    offset += (size_t)count;
    if (crash_boundary == 100) _exit(97);
  }
  if (crash_boundary == 101) _exit(97);
  if (fsync(descriptor) != 0) die("V138_NATIVE_FSYNC_FAILED");
  close(descriptor);
  if (linkat(file.parent, temporary, file.parent, file.name, 0) != 0) {
    if (errno != EEXIST) die("V138_NATIVE_COMMIT_LINK_FAILED");
    if (!bytes_equal(file, bytes, length)) die("V138_NATIVE_COMMIT_EXISTING_CONFLICT");
  }
  if (unlinkat(file.parent, temporary, 0) != 0) die("V138_NATIVE_UNCOMMITTED_CLEANUP_FAILED");
  if (fsync(file.parent) != 0) die("V138_NATIVE_FSYNC_FAILED");
}

static void sha256_file(RelativeFile file, char output[65]) {
  size_t length = 0;
  unsigned char *bytes = read_regular(file, &length, NULL);
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(bytes, (CC_LONG)length, digest);
  free(bytes);
  for (int index = 0; index < CC_SHA256_DIGEST_LENGTH; index++) sprintf(output + index * 2, "%02x", digest[index]);
  output[64] = '\0';
}

static void close_file(RelativeFile file) { close(file.parent); }

static void barrier_if_requested(int root) {
  const char *tag = getenv("V138_NATIVE_TEST_BARRIER");
  if (!tag || !*tag) return;
  if (!safe_atom(tag) || strlen(tag) > 64) die("V138_NATIVE_BARRIER_INVALID");
  char ready[96], proceed[96];
  snprintf(ready, sizeof(ready), ".v138-test-ready-%s", tag);
  snprintf(proceed, sizeof(proceed), ".v138-test-continue-%s", tag);
  int descriptor = openat(root, ready, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (descriptor < 0) die("V138_NATIVE_BARRIER_READY_FAILED");
  close(descriptor); fsync(root);
  struct stat status;
  int observed = 0;
  for (int attempt = 0; attempt < 5000; attempt++) {
    if (fstatat(root, proceed, &status, AT_SYMLINK_NOFOLLOW) == 0) { observed = 1; break; }
    if (errno != ENOENT) die("V138_NATIVE_BARRIER_STAT_FAILED");
    usleep(1000);
  }
  if (!observed) die("V138_NATIVE_BARRIER_TIMEOUT");
  unlinkat(root, ready, 0); unlinkat(root, proceed, 0); fsync(root);
}

static void pair_transaction(int root, char **parts, int count) {
  if (count != 11) die("V138_NATIVE_PAIR_INPUT_INVALID");
  const char *intent_relative = parts[2], *namespace = parts[3];
  if (!exact_hex(namespace, 64)) die("V138_NATIVE_NAMESPACE_INVALID");
  char *lock_targets[3] = { (char *)intent_relative, parts[4], parts[6] };
  int crash_boundary = atoi(parts[10]);
  RelativeFile intent = open_parent(root, intent_relative);
  RelativeFile targets[2] = { open_parent(root, parts[4]), open_parent(root, parts[6]) };
  if (targets[0].parent == targets[1].parent && strcmp(targets[0].name, targets[1].name) == 0) die("V138_NATIVE_PAIR_DUPLICATE");
  size_t bytes_length[2], intent_length;
  unsigned char *bytes[2] = { decode_hex(parts[5], &bytes_length[0]), decode_hex(parts[7], &bytes_length[1]) };
  unsigned char *intent_bytes = decode_hex(parts[8], &intent_length);
  if (strcmp(parts[9], "pair-v2") != 0) die("V138_NATIVE_PAIR_SCHEMA_INVALID");
  HeldLocks held = acquire_descriptor_locks(root, lock_targets, 3, intent_relative, intent_bytes, intent_length);
  int staging = open_internal_dir(root, ".v138-pair-staging");

  /* Every canonical precondition is inspected before any transaction byte is written. */
  for (int index = 0; index < 2; index++) if (regular_state(targets[index]) && !bytes_equal(targets[index], bytes[index], bytes_length[index])) die("V138_PAIR_V2_CANONICAL_CONFLICT");
  barrier_if_requested(root);
  if (regular_state(intent)) {
    if (!bytes_equal(intent, intent_bytes, intent_length)) die("V138_PAIR_V2_INTENT_CONFLICT");
  } else {
    write_committed(intent, intent_bytes, intent_length, namespace, "pair-intent", crash_boundary);
  }
  crash_if(crash_boundary, 1);

  char stages[2][96];
  for (int index = 0; index < 2; index++) {
    snprintf(stages[index], sizeof(stages[index]), "%s-%d.stage", namespace, index);
    RelativeFile stage = { .parent = staging }; strcpy(stage.name, stages[index]);
    if (regular_state(stage)) {
      if (!bytes_equal(stage, bytes[index], bytes_length[index])) die("V138_PAIR_V2_STAGE_CONFLICT");
    } else {
      char label[32]; snprintf(label, sizeof(label), "pair-stage-%d", index);
      write_committed(stage, bytes[index], bytes_length[index], namespace, label, crash_boundary);
    }
    crash_if(crash_boundary, 2 + index);
  }
  for (int index = 0; index < 2; index++) {
    if (!regular_state(targets[index])) {
      if (linkat(staging, stages[index], targets[index].parent, targets[index].name, 0) != 0 && errno != EEXIST) die("V138_NATIVE_LINK_FAILED");
    }
    if (!regular_state(targets[index]) || !bytes_equal(targets[index], bytes[index], bytes_length[index])) die("V138_PAIR_V2_CANONICAL_CONFLICT");
    fsync(targets[index].parent);
    crash_if(crash_boundary, 4 + index);
  }
  for (int index = 0; index < 2; index++) if (regular_state_at(staging, stages[index])) unlinkat(staging, stages[index], 0);
  if (regular_state(intent)) unlinkat(intent.parent, intent.name, 0);
  fsync(staging); fsync(intent.parent);
  for (int index = 0; index < 2; index++) { free(bytes[index]); close_file(targets[index]); }
  free(intent_bytes); close_file(intent); close(staging); release_descriptor_locks(held);
}

typedef struct {
  RelativeFile target;
  char target_name[4096];
  char expected_before[65];
  unsigned char *after;
  size_t after_length;
  char after_digest[65];
  char stage[96];
  char backup[96];
  int state; /* 0=before, 1=after, 2=interrupted */
} LifecycleStep;

static void lifecycle_transaction(int root, char **header, int header_count, FILE *stream) {
  if (header_count != 10) die("V138_NATIVE_LIFECYCLE_INPUT_INVALID");
  const char *intent_relative = header[2], *namespace = header[3], *lifecycle_relative = header[4];
  if (!exact_hex(namespace, 64)) die("V138_NATIVE_NAMESPACE_INVALID");
  size_t lifecycle_length = 0, intent_length = 0;
  unsigned char *lifecycle_bytes = decode_hex(header[5], &lifecycle_length);
  int step_count = atoi(header[6]);
  int crash_boundary = atoi(header[7]);
  unsigned char *intent_bytes = decode_hex(header[8], &intent_length);
  if (strcmp(header[9], "lifecycle-v2") != 0 || step_count < 1 || step_count > 128) die("V138_NATIVE_LIFECYCLE_SCHEMA_INVALID");
  RelativeFile intent = open_parent(root, intent_relative);
  RelativeFile lifecycle = open_parent(root, lifecycle_relative);
  int staging = open_internal_dir(root, ".v138-lifecycle-staging");
  LifecycleStep *steps = calloc((size_t)step_count, sizeof(LifecycleStep));
  if (!steps) die("V138_NATIVE_OOM");
  char *line = malloc(MAX_LINE);
  if (!line) die("V138_NATIVE_OOM");
  for (int index = 0; index < step_count; index++) {
    if (!fgets(line, MAX_LINE, stream)) die("V138_NATIVE_LIFECYCLE_STEP_MISSING");
    char *parts[MAX_PARTS];
    int count = split_tabs(line, parts, MAX_PARTS);
    if (count != 4 || strlen(parts[2]) != 64) die("V138_NATIVE_LIFECYCLE_STEP_INVALID");
    steps[index].target = open_parent(root, parts[1]);
    if (strlen(parts[1]) >= sizeof(steps[index].target_name)) die("V138_NATIVE_RELATIVE_INVALID");
    strcpy(steps[index].target_name, parts[1]);
    strcpy(steps[index].expected_before, parts[2]);
    steps[index].after = decode_hex(parts[3], &steps[index].after_length);
    unsigned char digest[CC_SHA256_DIGEST_LENGTH];
    CC_SHA256(steps[index].after, (CC_LONG)steps[index].after_length, digest);
    for (int offset = 0; offset < CC_SHA256_DIGEST_LENGTH; offset++) sprintf(steps[index].after_digest + offset * 2, "%02x", digest[offset]);
    steps[index].after_digest[64] = '\0';
    snprintf(steps[index].stage, sizeof(steps[index].stage), "%s-%d.after", namespace, index);
    snprintf(steps[index].backup, sizeof(steps[index].backup), "%s-%d.before", namespace, index);
  }
  free(line);
  char **lock_targets = calloc((size_t)step_count + 2, sizeof(char *));
  if (!lock_targets) die("V138_NATIVE_OOM");
  for (int index = 0; index < step_count; index++) lock_targets[index] = steps[index].target_name;
  lock_targets[step_count] = (char *)lifecycle_relative;
  lock_targets[step_count + 1] = (char *)intent_relative;
  HeldLocks held = acquire_descriptor_locks(root, lock_targets, step_count + 2, intent_relative, intent_bytes, intent_length);
  free(lock_targets);

  barrier_if_requested(root);

  int lifecycle_present = regular_state(lifecycle);
  if (lifecycle_present && !bytes_equal(lifecycle, lifecycle_bytes, lifecycle_length)) die("V138_LIFECYCLE_V2_STATUS_CONFLICT");
  for (int index = 0; index < step_count; index++) {
    char digest[65];
    if (regular_state(steps[index].target)) {
      sha256_file(steps[index].target, digest);
      if (strcmp(digest, steps[index].expected_before) == 0) steps[index].state = 0;
      else if (strcmp(digest, steps[index].after_digest) == 0) steps[index].state = 1;
      else die("V138_LIFECYCLE_V2_STEP_STATE_INVALID");
    } else if (regular_state_at(staging, steps[index].backup)) steps[index].state = 2;
    else die("V138_LIFECYCLE_V2_STEP_ABSENT");
    if (lifecycle_present && steps[index].state != 1) die("V138_LIFECYCLE_V2_PREMATURE_STATUS");
  }
  if (regular_state(intent)) {
    if (!bytes_equal(intent, intent_bytes, intent_length)) die("V138_LIFECYCLE_V2_INTENT_CONFLICT");
  } else {
    if (!lifecycle_present) {
      for (int index = 0; index < step_count; index++) if (steps[index].state != 0) die("V138_LIFECYCLE_V2_INTENT_REQUIRED");
      write_committed(intent, intent_bytes, intent_length, namespace, "life-intent", crash_boundary);
    }
  }
  crash_if(crash_boundary, 1);

  for (int index = 0; index < step_count; index++) {
    if (steps[index].state == 1) continue;
    RelativeFile stage = { .parent = staging }, backup = { .parent = staging };
    strcpy(stage.name, steps[index].stage); strcpy(backup.name, steps[index].backup);
    if (regular_state(stage)) {
      if (!bytes_equal(stage, steps[index].after, steps[index].after_length)) die("V138_LIFECYCLE_V2_STAGE_CONFLICT");
    } else {
      char label[32]; snprintf(label, sizeof(label), "life-after-%d", index);
      write_committed(stage, steps[index].after, steps[index].after_length, namespace, label, crash_boundary);
    }
    if (steps[index].state == 0) {
      if (!regular_state(backup)) {
        if (linkat(steps[index].target.parent, steps[index].target.name, staging, backup.name, 0) != 0) die("V138_NATIVE_BACKUP_LINK_FAILED");
        crash_if(crash_boundary, 200);
      }
      char digest[65]; sha256_file(backup, digest);
      if (strcmp(digest, steps[index].expected_before) != 0) die("V138_LIFECYCLE_V2_BACKUP_CONFLICT");
      if (fsync(staging) != 0) die("V138_NATIVE_FSYNC_FAILED");
      crash_if(crash_boundary, 201);
      if (unlinkat(steps[index].target.parent, steps[index].target.name, 0) != 0) die("V138_NATIVE_UNLINK_FAILED");
      crash_if(crash_boundary, 202);
      if (fsync(steps[index].target.parent) != 0) die("V138_NATIVE_FSYNC_FAILED");
      crash_if(crash_boundary, 203);
    }
    if (linkat(staging, stage.name, steps[index].target.parent, steps[index].target.name, 0) != 0 && errno != EEXIST) die("V138_NATIVE_LINK_FAILED");
    crash_if(crash_boundary, 204);
    char installed[65]; sha256_file(steps[index].target, installed);
    if (strcmp(installed, steps[index].after_digest) != 0) die("V138_LIFECYCLE_V2_CAS_CONFLICT");
    if (fsync(steps[index].target.parent) != 0) die("V138_NATIVE_FSYNC_FAILED");
    crash_if(crash_boundary, 205);
    crash_if(crash_boundary, 2 + index);
  }
  char status_name[96]; snprintf(status_name, sizeof(status_name), "%s.status", namespace);
  RelativeFile status_stage = { .parent = staging }; strcpy(status_stage.name, status_name);
  if (regular_state(status_stage)) {
    if (!bytes_equal(status_stage, lifecycle_bytes, lifecycle_length)) die("V138_LIFECYCLE_V2_STATUS_STAGE_CONFLICT");
  } else write_committed(status_stage, lifecycle_bytes, lifecycle_length, namespace, "life-status", crash_boundary);
  crash_if(crash_boundary, 2 + step_count);
  if (!regular_state(lifecycle) && linkat(staging, status_name, lifecycle.parent, lifecycle.name, 0) != 0 && errno != EEXIST) die("V138_NATIVE_LINK_FAILED");
  if (!bytes_equal(lifecycle, lifecycle_bytes, lifecycle_length)) die("V138_LIFECYCLE_V2_STATUS_POSTCONDITION");
  fsync(lifecycle.parent);
  crash_if(crash_boundary, 3 + step_count);
  /* Canonical status and every target are durable; recovery material is now private residue. */
  for (int index = 0; index < step_count; index++) {
    RelativeFile stage = { .parent = staging }, backup = { .parent = staging };
    strcpy(stage.name, steps[index].stage); strcpy(backup.name, steps[index].backup);
    if (regular_state(stage)) {
      if (!bytes_equal(stage, steps[index].after, steps[index].after_length)) die("V138_LIFECYCLE_V2_STAGE_CONFLICT");
      if (unlinkat(staging, stage.name, 0) != 0) die("V138_NATIVE_CLEANUP_FAILED");
    }
    if (regular_state(backup)) {
      char digest[65]; sha256_file(backup, digest);
      if (strcmp(digest, steps[index].expected_before) != 0) die("V138_LIFECYCLE_V2_BACKUP_CONFLICT");
      if (unlinkat(staging, backup.name, 0) != 0) die("V138_NATIVE_CLEANUP_FAILED");
    }
  }
  if (regular_state(status_stage)) {
    if (!bytes_equal(status_stage, lifecycle_bytes, lifecycle_length)) die("V138_LIFECYCLE_V2_STATUS_STAGE_CONFLICT");
    if (unlinkat(staging, status_stage.name, 0) != 0) die("V138_NATIVE_CLEANUP_FAILED");
  }
  if (regular_state(intent)) {
    if (!bytes_equal(intent, intent_bytes, intent_length)) die("V138_LIFECYCLE_V2_INTENT_CONFLICT");
    if (unlinkat(intent.parent, intent.name, 0) != 0) die("V138_NATIVE_CLEANUP_FAILED");
  }
  if (fsync(staging) != 0 || fsync(intent.parent) != 0 || fsync(lifecycle.parent) != 0) die("V138_NATIVE_FSYNC_FAILED");
  for (int index = 0; index < step_count; index++) { close_file(steps[index].target); free(steps[index].after); }
  free(steps); free(intent_bytes); free(lifecycle_bytes); close_file(intent); close_file(lifecycle); close(staging); release_descriptor_locks(held);
}

int main(int argc, char **argv) {
  (void)argv;
  if (argc != 1 || strlen(V138_CONTROLLER_TOKEN_HEX) != 64) die("V138_NATIVE_ARGUMENTS_INVALID");
  int capability_descriptor = dup_cloexec(3);
  FILE *capability_stream = fdopen(capability_descriptor, "r");
  if (!capability_stream) die("V138_NATIVE_CAPABILITY_MISSING");
  char capability_line[1024];
  if (!fgets(capability_line, sizeof(capability_line), capability_stream)) die("V138_NATIVE_CAPABILITY_MISSING");
  fclose(capability_stream);
  char *capability_parts[MAX_PARTS];
  int capability_count = split_tabs(capability_line, capability_parts, MAX_PARTS);
  if (capability_count != 10 || strcmp(capability_parts[0], "V138CAP2") != 0 ||
      strcmp(capability_parts[1], V138_CONTROLLER_TOKEN_HEX) != 0 || !exact_hex(capability_parts[2], 64) ||
      !exact_hex(capability_parts[3], 64) || !exact_hex(capability_parts[4], 64) ||
      !exact_hex(capability_parts[7], 64) || !exact_hex(capability_parts[8], 64) || !exact_hex(capability_parts[9], 64)) {
    die("V138_NATIVE_CAPABILITY_INVALID");
  }
  strcpy(capability_nonce, capability_parts[2]);
  strcpy(capability_lock_hash, capability_parts[4]);
  int root = dup_cloexec(4);
  struct stat status;
  if (fstat(root, &status) != 0 || !S_ISDIR(status.st_mode)) die("V138_NATIVE_ROOT_INVALID");
  if ((unsigned long long)status.st_dev != strtoull(capability_parts[5], NULL, 10) ||
      (unsigned long long)status.st_ino != strtoull(capability_parts[6], NULL, 10)) die("V138_NATIVE_ROOT_IDENTITY_MISMATCH");

  size_t capacity = MAX_LINE, input_length = 0;
  unsigned char *input = malloc(capacity);
  if (!input) die("V138_NATIVE_OOM");
  for (;;) {
    if (input_length == capacity) {
      if (capacity >= MAX_LINE * 256) die("V138_NATIVE_INPUT_OVERFLOW");
      capacity *= 2;
      unsigned char *grown = realloc(input, capacity);
      if (!grown) die("V138_NATIVE_OOM");
      input = grown;
    }
    size_t count = fread(input + input_length, 1, capacity - input_length, stdin);
    input_length += count;
    if (count == 0) { if (ferror(stdin)) die("V138_NATIVE_INPUT_READ_FAILED"); break; }
  }
  char input_hash[65]; sha256_bytes(input, input_length, input_hash);
  if (strcmp(input_hash, capability_parts[3]) != 0) die("V138_NATIVE_CAPABILITY_INTENT_MISMATCH");
  FILE *stream = tmpfile();
  if (!stream || fwrite(input, 1, input_length, stream) != input_length || fflush(stream) != 0 || fseek(stream, 0, SEEK_SET) != 0) die("V138_NATIVE_INPUT_STAGE_FAILED");
  free(input);
  if (write(5, "1", 1) != 1) die("V138_NATIVE_CONTROLLER_HANDSHAKE_FAILED");
  close(5);
  char *line = malloc(MAX_LINE);
  if (!line || !fgets(line, MAX_LINE, stream)) die("V138_NATIVE_INPUT_MISSING");
  char *parts[MAX_PARTS];
  int count = split_tabs(line, parts, MAX_PARTS);
  if (strcmp(parts[0], "PAIR") == 0) pair_transaction(root, parts, count);
  else if (strcmp(parts[0], "LIFE") == 0) lifecycle_transaction(root, parts, count, stream);
  else die("V138_NATIVE_OPERATION_INVALID");
  free(line); fclose(stream); close(root);
  return 0;
}

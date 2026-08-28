#define _DARWIN_C_SOURCE 1
#include <CommonCrypto/CommonDigest.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef O_NOFOLLOW
#define O_NOFOLLOW 0
#endif

#define MAX_LINE 1048576
#define MAX_PARTS 16

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

static void write_exclusive(RelativeFile file, const unsigned char *bytes, size_t length) {
  int descriptor = openat(file.parent, file.name, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (descriptor < 0) die("V138_NATIVE_EXCLUSIVE_WRITE_FAILED");
  size_t offset = 0;
  while (offset < length) {
    ssize_t count = write(descriptor, bytes + offset, length - offset);
    if (count <= 0) die("V138_NATIVE_WRITE_FAILED");
    offset += (size_t)count;
  }
  if (fsync(descriptor) != 0) die("V138_NATIVE_FSYNC_FAILED");
  close(descriptor);
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

static void pair_transaction(int root, char **parts, int count) {
  if (count != 11) die("V138_NATIVE_PAIR_INPUT_INVALID");
  const char *intent_relative = parts[2], *namespace = parts[3];
  int crash_boundary = atoi(parts[10]);
  RelativeFile intent = open_parent(root, intent_relative);
  RelativeFile targets[2] = { open_parent(root, parts[4]), open_parent(root, parts[6]) };
  if (targets[0].parent == targets[1].parent && strcmp(targets[0].name, targets[1].name) == 0) die("V138_NATIVE_PAIR_DUPLICATE");
  size_t bytes_length[2], intent_length;
  unsigned char *bytes[2] = { decode_hex(parts[5], &bytes_length[0]), decode_hex(parts[7], &bytes_length[1]) };
  unsigned char *intent_bytes = decode_hex(parts[8], &intent_length);
  if (strcmp(parts[9], "pair-v2") != 0) die("V138_NATIVE_PAIR_SCHEMA_INVALID");
  int staging = open_internal_dir(root, ".v138-pair-staging");

  /* Every canonical precondition is inspected before any transaction byte is written. */
  for (int index = 0; index < 2; index++) if (regular_state(targets[index]) && !bytes_equal(targets[index], bytes[index], bytes_length[index])) die("V138_PAIR_V2_CANONICAL_CONFLICT");
  if (regular_state(intent)) {
    if (!bytes_equal(intent, intent_bytes, intent_length)) die("V138_PAIR_V2_INTENT_CONFLICT");
  } else {
    write_exclusive(intent, intent_bytes, intent_length);
    fsync(intent.parent);
  }
  crash_if(crash_boundary, 1);

  char stages[2][96];
  for (int index = 0; index < 2; index++) {
    snprintf(stages[index], sizeof(stages[index]), "%s-%d.stage", namespace, index);
    RelativeFile stage = { .parent = staging }; strcpy(stage.name, stages[index]);
    if (regular_state(stage)) {
      if (!bytes_equal(stage, bytes[index], bytes_length[index])) die("V138_PAIR_V2_STAGE_CONFLICT");
    } else write_exclusive(stage, bytes[index], bytes_length[index]);
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
  free(intent_bytes); close_file(intent); close(staging);
}

typedef struct {
  RelativeFile target;
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
    if (lifecycle_present) die("V138_LIFECYCLE_V2_INTENT_REQUIRED");
    for (int index = 0; index < step_count; index++) if (steps[index].state != 0) die("V138_LIFECYCLE_V2_INTENT_REQUIRED");
    write_exclusive(intent, intent_bytes, intent_length); fsync(intent.parent);
  }
  crash_if(crash_boundary, 1);

  for (int index = 0; index < step_count; index++) {
    if (steps[index].state == 1) continue;
    RelativeFile stage = { .parent = staging }, backup = { .parent = staging };
    strcpy(stage.name, steps[index].stage); strcpy(backup.name, steps[index].backup);
    if (regular_state(stage)) {
      if (!bytes_equal(stage, steps[index].after, steps[index].after_length)) die("V138_LIFECYCLE_V2_STAGE_CONFLICT");
    } else write_exclusive(stage, steps[index].after, steps[index].after_length);
    if (steps[index].state == 0) {
      if (!regular_state(backup) && linkat(steps[index].target.parent, steps[index].target.name, staging, backup.name, 0) != 0) die("V138_NATIVE_BACKUP_LINK_FAILED");
      char digest[65]; sha256_file(backup, digest);
      if (strcmp(digest, steps[index].expected_before) != 0) die("V138_LIFECYCLE_V2_BACKUP_CONFLICT");
      if (unlinkat(steps[index].target.parent, steps[index].target.name, 0) != 0) die("V138_NATIVE_UNLINK_FAILED");
    }
    if (linkat(staging, stage.name, steps[index].target.parent, steps[index].target.name, 0) != 0 && errno != EEXIST) die("V138_NATIVE_LINK_FAILED");
    char installed[65]; sha256_file(steps[index].target, installed);
    if (strcmp(installed, steps[index].after_digest) != 0) die("V138_LIFECYCLE_V2_CAS_CONFLICT");
    fsync(steps[index].target.parent);
    crash_if(crash_boundary, 2 + index);
  }
  char status_name[96]; snprintf(status_name, sizeof(status_name), "%s.status", namespace);
  RelativeFile status_stage = { .parent = staging }; strcpy(status_stage.name, status_name);
  if (regular_state(status_stage)) {
    if (!bytes_equal(status_stage, lifecycle_bytes, lifecycle_length)) die("V138_LIFECYCLE_V2_STATUS_STAGE_CONFLICT");
  } else write_exclusive(status_stage, lifecycle_bytes, lifecycle_length);
  crash_if(crash_boundary, 2 + step_count);
  if (!regular_state(lifecycle) && linkat(staging, status_name, lifecycle.parent, lifecycle.name, 0) != 0 && errno != EEXIST) die("V138_NATIVE_LINK_FAILED");
  if (!bytes_equal(lifecycle, lifecycle_bytes, lifecycle_length)) die("V138_LIFECYCLE_V2_STATUS_POSTCONDITION");
  fsync(lifecycle.parent);
  crash_if(crash_boundary, 3 + step_count);
  for (int index = 0; index < step_count; index++) { close_file(steps[index].target); free(steps[index].after); }
  free(steps); free(intent_bytes); free(lifecycle_bytes); close_file(intent); close_file(lifecycle); close(staging);
}

int main(int argc, char **argv) {
  if (argc != 4) die("V138_NATIVE_ARGUMENTS_INVALID");
  int root = open(argv[1], O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (root < 0) die("V138_NATIVE_ROOT_OPEN_FAILED");
  struct stat status;
  if (fstat(root, &status) != 0 || !S_ISDIR(status.st_mode)) die("V138_NATIVE_ROOT_INVALID");
  if ((unsigned long long)status.st_dev != strtoull(argv[2], NULL, 10) || (unsigned long long)status.st_ino != strtoull(argv[3], NULL, 10)) die("V138_NATIVE_ROOT_IDENTITY_MISMATCH");
  char *line = malloc(MAX_LINE);
  if (!line || !fgets(line, MAX_LINE, stdin)) die("V138_NATIVE_INPUT_MISSING");
  char *parts[MAX_PARTS];
  int count = split_tabs(line, parts, MAX_PARTS);
  if (strcmp(parts[0], "PAIR") == 0) pair_transaction(root, parts, count);
  else if (strcmp(parts[0], "LIFE") == 0) lifecycle_transaction(root, parts, count, stdin);
  else die("V138_NATIVE_OPERATION_INVALID");
  free(line); close(root);
  return 0;
}

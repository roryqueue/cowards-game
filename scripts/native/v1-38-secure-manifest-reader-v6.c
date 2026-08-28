#define _DARWIN_C_SOURCE 1
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <CommonCrypto/CommonDigest.h>

#ifndef O_NOFOLLOW
#define O_NOFOLLOW 0
#endif

#define MAX_REQUESTS 512
#define MAX_DIRS 1024
#define MAX_PATH 4096

typedef struct { char kind; char path[MAX_PATH]; } request_t;
typedef struct { char path[MAX_PATH]; int fd; struct stat identity; } dir_t;
typedef struct {
  int fd;
  struct stat identity;
  unsigned char *bytes;
  size_t length;
  unsigned char sha256[CC_SHA256_DIGEST_LENGTH];
} leaf_t;
static request_t requests[MAX_REQUESTS];
static dir_t dirs[MAX_DIRS];
static leaf_t leaves[MAX_REQUESTS];
static size_t request_count = 0, dir_count = 0;

__attribute__((noreturn)) static void die(const char *code) {
  fprintf(stderr, "%s\n", code);
  exit(2);
}

static int safe_relative(const char *value) {
  if (!value || !*value || value[0] == '/' || strchr(value, '\\') || strstr(value, "//")) return 0;
  char copy[MAX_PATH];
  if (strlen(value) >= sizeof(copy)) return 0;
  strcpy(copy, value);
  char *save = NULL;
  for (char *part = strtok_r(copy, "/", &save); part; part = strtok_r(NULL, "/", &save))
    if (!*part || strcmp(part, ".") == 0 || strcmp(part, "..") == 0) return 0;
  return 1;
}

static void hex_bytes(const unsigned char *bytes, size_t count) {
  static const char hex[] = "0123456789abcdef";
  for (size_t i = 0; i < count; i++) {
    char out[2] = { hex[bytes[i] >> 4], hex[bytes[i] & 15] };
    if (write(STDOUT_FILENO, out, 2) != 2) die("V138_READER_OUTPUT_FAILED");
  }
}

static int cached_dir(const char *relative) {
  for (size_t i = 0; i < dir_count; i++)
    if (strcmp(dirs[i].path, relative) == 0) return (int)i;
  return -1;
}

static int retain_dir(const char *relative) {
  int existing = cached_dir(relative);
  if (existing >= 0) return existing;
  if (dir_count >= MAX_DIRS) die("V138_READER_TOO_MANY_DIRECTORIES");
  char parent_path[MAX_PATH], name[MAX_PATH];
  const char *slash = strrchr(relative, '/');
  if (slash) {
    size_t count = (size_t)(slash - relative);
    memcpy(parent_path, relative, count); parent_path[count] = '\0';
    strcpy(name, slash + 1);
  } else {
    parent_path[0] = '\0'; strcpy(name, relative);
  }
  int parent_index = retain_dir(parent_path);
  int child = openat(dirs[parent_index].fd, name,
    O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (child < 0) die("V138_READER_PARENT_INVALID");
  struct stat status;
  if (fstat(child, &status) != 0 || !S_ISDIR(status.st_mode)) die("V138_READER_PARENT_INVALID");
  dir_t *slot = &dirs[dir_count++];
  strcpy(slot->path, relative); slot->fd = child; slot->identity = status;
  return (int)(dir_count - 1);
}

static int parent_for(const char *relative, char *name) {
  char parent_path[MAX_PATH];
  const char *slash = strrchr(relative, '/');
  if (slash) {
    size_t count = (size_t)(slash - relative);
    memcpy(parent_path, relative, count); parent_path[count] = '\0';
    strcpy(name, slash + 1);
  } else {
    parent_path[0] = '\0'; strcpy(name, relative);
  }
  return retain_dir(parent_path);
}

static void barrier(int control) {
  const char *tag = getenv("V138_READER_TEST_BARRIER");
  if (!tag || !*tag) return;
  for (const char *cursor = tag; *cursor; cursor++)
    if (!((*cursor >= 'a' && *cursor <= 'z') || (*cursor >= '0' && *cursor <= '9') || *cursor == '-'))
      die("V138_READER_BARRIER_INVALID");
  char ready[128], proceed[128];
  snprintf(ready, sizeof(ready), ".v138-reader-ready-%s", tag);
  snprintf(proceed, sizeof(proceed), ".v138-reader-continue-%s", tag);
  int marker = openat(control, ready, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (marker < 0) die("V138_READER_BARRIER_READY_FAILED");
  close(marker); fsync(control);
  struct stat status;
  for (int attempt = 0; attempt < 10000; attempt++) {
    if (fstatat(control, proceed, &status, AT_SYMLINK_NOFOLLOW) == 0) {
      unlinkat(control, ready, 0); unlinkat(control, proceed, 0); fsync(control); return;
    }
    if (errno != ENOENT) die("V138_READER_BARRIER_STAT_FAILED");
    usleep(1000);
  }
  die("V138_READER_BARRIER_TIMEOUT");
}

static void require_sanitized_environment(void) {
  const char *path = getenv("PATH"), *lang = getenv("LANG"), *locale = getenv("LC_ALL"), *temporary = getenv("TMPDIR");
  if (!path || strcmp(path, "/usr/bin:/bin") != 0 || !lang || strcmp(lang, "C") != 0 ||
      !locale || strcmp(locale, "C") != 0 || !temporary || !*temporary)
    die("V138_READER_ENVIRONMENT_INVALID");
  const char *forbidden[] = {
    "DYLD_INSERT_LIBRARIES", "DYLD_LIBRARY_PATH", "DYLD_FRAMEWORK_PATH",
    "DYLD_FALLBACK_LIBRARY_PATH", "DYLD_FALLBACK_FRAMEWORK_PATH",
    "LD_PRELOAD", "LD_LIBRARY_PATH", "NODE_OPTIONS"
  };
  for (size_t index = 0; index < sizeof(forbidden) / sizeof(forbidden[0]); index++)
    if (getenv(forbidden[index]) != NULL) die("V138_READER_LOADER_ENVIRONMENT_FORBIDDEN");
}

static int same_generation(const struct stat *left, const struct stat *right) {
  return left->st_dev == right->st_dev && left->st_ino == right->st_ino &&
    left->st_gen == right->st_gen &&
    left->st_mtimespec.tv_sec == right->st_mtimespec.tv_sec &&
    left->st_mtimespec.tv_nsec == right->st_mtimespec.tv_nsec &&
    left->st_ctimespec.tv_sec == right->st_ctimespec.tv_sec &&
    left->st_ctimespec.tv_nsec == right->st_ctimespec.tv_nsec;
}

static int same_leaf_identity(const struct stat *left, const struct stat *right) {
  return same_generation(left, right) && left->st_size == right->st_size;
}

static void read_and_authenticate_leaves(void) {
  for (size_t index = 0; index < request_count; index++) {
    if (requests[index].kind != 'R') continue;
    leaf_t *leaf = &leaves[index];
    leaf->length = (size_t)leaf->identity.st_size;
    leaf->bytes = malloc(leaf->length == 0 ? 1 : leaf->length);
    if (!leaf->bytes) die("V138_READER_OOM");
    size_t offset = 0;
    while (offset < leaf->length) {
      ssize_t count = read(leaf->fd, leaf->bytes + offset, leaf->length - offset);
      if (count < 0) die("V138_READER_READ_FAILED");
      if (count == 0) die("V138_READER_LEAF_TRUNCATED");
      offset += (size_t)count;
    }
    unsigned char trailing;
    ssize_t trailing_count = read(leaf->fd, &trailing, 1);
    if (trailing_count < 0) die("V138_READER_READ_FAILED");
    if (trailing_count != 0) die("V138_READER_LEAF_GREW");
    if (!CC_SHA256(leaf->bytes, (CC_LONG)leaf->length, leaf->sha256))
      die("V138_READER_HASH_FAILED");
  }
  for (size_t index = 0; index < request_count; index++) {
    if (requests[index].kind != 'R') continue;
    struct stat current;
    if (fstat(leaves[index].fd, &current) != 0 ||
        !same_leaf_identity(&leaves[index].identity, &current))
      die("V138_READER_LEAF_GENERATION_CHANGED");
  }
}

static void require_directory_generations(void) {
  for (size_t index = 0; index < dir_count; index++) {
    struct stat current;
    if (fstat(dirs[index].fd, &current) != 0 || !same_generation(&dirs[index].identity, &current))
      die("V138_READER_BATCH_GENERATION_CHANGED");
  }
}

static void require_absences(void) {
  for (size_t index = 0; index < request_count; index++) {
    if (requests[index].kind != 'A') continue;
    char name[MAX_PATH]; int parent = parent_for(requests[index].path, name);
    struct stat status;
    if (fstatat(dirs[parent].fd, name, &status, AT_SYMLINK_NOFOLLOW) == 0)
      die("V138_READER_EXPECTED_ABSENT");
    if (errno != ENOENT) die("V138_READER_ABSENCE_CHECK_FAILED");
  }
}

int main(void) {
  require_sanitized_environment();
  setvbuf(stdout, NULL, _IONBF, 0);
  int root = fcntl(3, F_DUPFD_CLOEXEC, 4);
  if (root < 0) die("V138_READER_ROOT_INVALID");
  int control = fcntl(4, F_DUPFD_CLOEXEC, 5);
  if (control < 0) die("V138_READER_CONTROL_INVALID");
  struct stat root_status;
  if (fstat(root, &root_status) != 0 || !S_ISDIR(root_status.st_mode)) die("V138_READER_ROOT_INVALID");
  struct stat control_status;
  if (fstat(control, &control_status) != 0 || !S_ISDIR(control_status.st_mode)) die("V138_READER_CONTROL_INVALID");
  strcpy(dirs[0].path, ""); dirs[0].fd = root; dirs[0].identity = root_status; dir_count = 1;

  char line[MAX_PATH + 8];
  while (fgets(line, sizeof(line), stdin)) {
    size_t length = strlen(line);
    if (length < 4 || line[length - 1] != '\n' || line[1] != '\t') die("V138_READER_ARGUMENT_INVALID");
    line[length - 1] = '\0';
    if ((line[0] != 'R' && line[0] != 'A') || !safe_relative(line + 2) || request_count >= MAX_REQUESTS)
      die("V138_READER_ARGUMENT_INVALID");
    requests[request_count].kind = line[0]; strcpy(requests[request_count].path, line + 2); request_count++;
  }
  if (request_count == 0) die("V138_READER_ARGUMENT_INVALID");

  /* Retain every ancestor and every required regular leaf before reading any
     evidence bytes. Absence decisions are bound to before/after parent
     generation, identity, mtime, and ctime checks. */
  for (size_t i = 0; i < request_count; i++) {
    char name[MAX_PATH]; (void)parent_for(requests[i].path, name);
  }
  for (size_t i = 0; i < request_count; i++) {
    leaves[i].fd = -1;
    if (requests[i].kind != 'R') continue;
    char name[MAX_PATH]; int parent = parent_for(requests[i].path, name);
    leaves[i].fd = openat(dirs[parent].fd, name, O_RDONLY | O_NOFOLLOW | O_CLOEXEC);
    if (leaves[i].fd < 0 || fstat(leaves[i].fd, &leaves[i].identity) != 0 ||
        !S_ISREG(leaves[i].identity.st_mode) || leaves[i].identity.st_size < 0 ||
        leaves[i].identity.st_size > 64 * 1024 * 1024)
      die("V138_READER_FILE_INVALID");
  }
  for (size_t i = 0; i < dir_count; i++)
    if (fstat(dirs[i].fd, &dirs[i].identity) != 0) die("V138_READER_PARENT_INVALID");
  require_absences();
  barrier(control);
  require_directory_generations();
  require_absences();

  /* Do not emit even a handshake until every exact-size leaf has been read,
     hashed, and post-fstat authenticated and all parents/absences still match. */
  read_and_authenticate_leaves();
  require_directory_generations();
  require_absences();

  printf("H\tone-shot-v6\n");
  printf("I\t%llu\t%llu\n", (unsigned long long)root_status.st_dev, (unsigned long long)root_status.st_ino);
  for (size_t i = 0; i < dir_count; i++) {
    printf("D\t"); hex_bytes((const unsigned char *)dirs[i].path, strlen(dirs[i].path));
    printf("\t%llu\t%llu\n", (unsigned long long)dirs[i].identity.st_dev, (unsigned long long)dirs[i].identity.st_ino);
  }
  for (size_t i = 0; i < request_count; i++) {
    printf("%c\t", requests[i].kind); hex_bytes((const unsigned char *)requests[i].path, strlen(requests[i].path)); printf("\t");
    if (requests[i].kind == 'A') {
      printf("-\n");
    } else {
      hex_bytes(leaves[i].bytes, leaves[i].length);
      printf("\n");
    }
  }
  require_directory_generations();
  require_absences();
  for (size_t i = 0; i < request_count; i++) if (leaves[i].fd >= 0) { free(leaves[i].bytes); close(leaves[i].fd); }
  for (size_t i = 0; i < dir_count; i++) close(dirs[i].fd);
  close(control);
  return 0;
}

#define _DARWIN_C_SOURCE 1
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

#define MAX_BYTES 1048576

__attribute__((noreturn)) static void die(const char *code) {
  fprintf(stderr, "%s\n", code);
  exit(2);
}

static int safe_relative(const char *value) {
  if (!value || !*value || value[0] == '/' || strchr(value, '\\')) return 0;
  char copy[4096];
  if (strlen(value) >= sizeof(copy)) return 0;
  strcpy(copy, value);
  char *save = NULL;
  for (char *part = strtok_r(copy, "/", &save); part; part = strtok_r(NULL, "/", &save)) {
    if (!*part || strcmp(part, ".") == 0 || strcmp(part, "..") == 0) return 0;
  }
  return 1;
}

typedef struct {
  int parent;
  char name[256];
} RelativeFile;

static RelativeFile open_parent(int root, const char *relative, int fatal) {
  RelativeFile invalid = { .parent = -1, .name = "" };
  if (!safe_relative(relative)) {
    if (fatal) die("V138_PLAN115_NATIVE_RELATIVE_INVALID");
    return invalid;
  }
  char copy[4096];
  strcpy(copy, relative);
  int current = fcntl(root, F_DUPFD_CLOEXEC, 3);
  if (current < 0) {
    if (fatal) die("V138_PLAN115_NATIVE_DUP_FAILED");
    return invalid;
  }
  char *save = NULL;
  char *part = strtok_r(copy, "/", &save);
  for (;;) {
    char *next = strtok_r(NULL, "/", &save);
    if (!next) {
      RelativeFile result = { .parent = current };
      if (strlen(part) >= sizeof(result.name)) {
        close(current);
        if (fatal) die("V138_PLAN115_NATIVE_NAME_INVALID");
        return invalid;
      }
      strcpy(result.name, part);
      return result;
    }
    int child = openat(current, part, O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
    close(current);
    if (child < 0) {
      if (fatal) die("V138_PLAN115_NATIVE_PARENT_UNSAFE");
      return invalid;
    }
    struct stat status;
    if (fstat(child, &status) != 0 || !S_ISDIR(status.st_mode)) {
      close(child);
      if (fatal) die("V138_PLAN115_NATIVE_PARENT_UNSAFE");
      return invalid;
    }
    current = child;
    part = next;
  }
}

static int same_directory(int left, int right) {
  struct stat a, b;
  return left >= 0 && right >= 0 && fstat(left, &a) == 0 && fstat(right, &b) == 0 &&
    a.st_dev == b.st_dev && a.st_ino == b.st_ino;
}

static void barrier_if_requested(int root) {
  const char *tag = getenv("V138_PLAN115_NATIVE_TEST_BARRIER");
  if (!tag || !*tag) return;
  if (strlen(tag) > 64 || strchr(tag, '/') || strstr(tag, ".."))
    die("V138_PLAN115_NATIVE_BARRIER_INVALID");
  char ready[96], proceed[96];
  snprintf(ready, sizeof(ready), ".v138-plan115-ready-%s", tag);
  snprintf(proceed, sizeof(proceed), ".v138-plan115-continue-%s", tag);
  int marker = openat(root, ready, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (marker < 0) die("V138_PLAN115_NATIVE_BARRIER_READY_FAILED");
  close(marker);
  if (fsync(root) != 0) die("V138_PLAN115_NATIVE_FSYNC_FAILED");
  struct stat status;
  int observed = 0;
  for (int attempt = 0; attempt < 5000; attempt++) {
    if (fstatat(root, proceed, &status, AT_SYMLINK_NOFOLLOW) == 0) { observed = 1; break; }
    if (errno != ENOENT) die("V138_PLAN115_NATIVE_BARRIER_STAT_FAILED");
    usleep(1000);
  }
  if (!observed) die("V138_PLAN115_NATIVE_BARRIER_TIMEOUT");
  unlinkat(root, ready, 0);
  unlinkat(root, proceed, 0);
  if (fsync(root) != 0) die("V138_PLAN115_NATIVE_FSYNC_FAILED");
}

static unsigned char *read_stdin(size_t *length) {
  unsigned char *bytes = malloc(MAX_BYTES + 1);
  if (!bytes) die("V138_PLAN115_NATIVE_OOM");
  size_t offset = 0;
  for (;;) {
    ssize_t count = read(STDIN_FILENO, bytes + offset, MAX_BYTES - offset);
    if (count < 0) die("V138_PLAN115_NATIVE_INPUT_READ_FAILED");
    if (count == 0) break;
    offset += (size_t)count;
    if (offset == MAX_BYTES) {
      unsigned char extra;
      if (read(STDIN_FILENO, &extra, 1) != 0) die("V138_PLAN115_NATIVE_INPUT_TOO_LARGE");
      break;
    }
  }
  *length = offset;
  return bytes;
}

int main(int argc, char **argv) {
  if (argc != 5) die("V138_PLAN115_NATIVE_ARGUMENTS_INVALID");
  int root = open(argv[1], O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (root < 0) die("V138_PLAN115_NATIVE_ROOT_OPEN_FAILED");
  struct stat root_status;
  if (fstat(root, &root_status) != 0 || !S_ISDIR(root_status.st_mode) ||
      (unsigned long long)root_status.st_dev != strtoull(argv[2], NULL, 10) ||
      (unsigned long long)root_status.st_ino != strtoull(argv[3], NULL, 10))
    die("V138_PLAN115_NATIVE_ROOT_IDENTITY_MISMATCH");

  RelativeFile retained = open_parent(root, argv[4], 1);
  barrier_if_requested(root);
  RelativeFile current = open_parent(root, argv[4], 0);
  if (!same_directory(retained.parent, current.parent)) {
    if (current.parent >= 0) close(current.parent);
    close(retained.parent);
    close(root);
    die("V138_PLAN115_NATIVE_PARENT_CHANGED");
  }
  close(current.parent);

  size_t length = 0;
  unsigned char *bytes = read_stdin(&length);
  int descriptor = openat(retained.parent, retained.name,
    O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (descriptor < 0) die("V138_PLAN115_NATIVE_EXCLUSIVE_WRITE_FAILED");
  int failed = 0;
  size_t offset = 0;
  while (offset < length) {
    ssize_t count = write(descriptor, bytes + offset, length - offset);
    if (count <= 0) { failed = 1; break; }
    offset += (size_t)count;
  }
  if (!failed && fchmod(descriptor, 0644) != 0) failed = 1;
  if (!failed && fsync(descriptor) != 0) failed = 1;
  struct stat file_status;
  if (!failed && (fstat(descriptor, &file_status) != 0 || !S_ISREG(file_status.st_mode) ||
      (file_status.st_mode & 07777) != 0644 || file_status.st_size != (off_t)length)) failed = 1;

  current = open_parent(root, argv[4], 0);
  int parent_changed = !same_directory(retained.parent, current.parent);
  if (current.parent >= 0) close(current.parent);
  if (close(descriptor) != 0) failed = 1;
  if (failed || parent_changed) {
    unlinkat(retained.parent, retained.name, 0);
    fsync(retained.parent);
    free(bytes);
    close(retained.parent);
    close(root);
    die(parent_changed ? "V138_PLAN115_NATIVE_PARENT_CHANGED" : "V138_PLAN115_NATIVE_WRITE_FAILED");
  }
  if (fsync(retained.parent) != 0) {
    unlinkat(retained.parent, retained.name, 0);
    fsync(retained.parent);
    die("V138_PLAN115_NATIVE_FSYNC_FAILED");
  }
  free(bytes);
  close(retained.parent);
  close(root);
  return 0;
}

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

__attribute__((noreturn)) static void die(const char *code) { fprintf(stderr, "%s\n", code); exit(2); }

static int safe_relative(const char *value) {
  if (!value || !*value || value[0] == '/' || strchr(value, '\\') || strstr(value, "//")) return 0;
  char copy[4096];
  if (strlen(value) >= sizeof(copy)) return 0;
  strcpy(copy, value);
  char *save = NULL;
  for (char *part = strtok_r(copy, "/", &save); part; part = strtok_r(NULL, "/", &save)) {
    if (!*part || strcmp(part, ".") == 0 || strcmp(part, "..") == 0) return 0;
  }
  return 1;
}

static void barrier(int root) {
  const char *tag = getenv("V138_READER_TEST_BARRIER");
  if (!tag || !*tag) return;
  for (const char *cursor = tag; *cursor; cursor++) if (!((*cursor >= 'a' && *cursor <= 'z') || (*cursor >= '0' && *cursor <= '9') || *cursor == '-')) die("V138_READER_BARRIER_INVALID");
  char ready[128], proceed[128];
  snprintf(ready, sizeof(ready), ".v138-reader-ready-%s", tag);
  snprintf(proceed, sizeof(proceed), ".v138-reader-continue-%s", tag);
  int marker = openat(root, ready, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (marker < 0) die("V138_READER_BARRIER_READY_FAILED");
  close(marker); fsync(root);
  struct stat status;
  for (int attempt = 0; attempt < 10000; attempt++) {
    if (fstatat(root, proceed, &status, AT_SYMLINK_NOFOLLOW) == 0) { unlinkat(root, ready, 0); unlinkat(root, proceed, 0); fsync(root); return; }
    if (errno != ENOENT) die("V138_READER_BARRIER_STAT_FAILED");
    usleep(1000);
  }
  die("V138_READER_BARRIER_TIMEOUT");
}

int main(int argc, char **argv) {
  if (argc != 3 || (strcmp(argv[1], "read") != 0 && strcmp(argv[1], "absent") != 0) || !safe_relative(argv[2])) die("V138_READER_ARGUMENT_INVALID");
  int root = fcntl(3, F_DUPFD_CLOEXEC, 4);
  if (root < 0) die("V138_READER_ROOT_INVALID");
  struct stat root_status;
  if (fstat(root, &root_status) != 0 || !S_ISDIR(root_status.st_mode)) die("V138_READER_ROOT_INVALID");
  char relative[4096]; strcpy(relative, argv[2]);
  int parent = fcntl(root, F_DUPFD_CLOEXEC, 3);
  if (parent < 0) die("V138_READER_DUP_FAILED");
  char *save = NULL, *part = strtok_r(relative, "/", &save), *next;
  if (!part) die("V138_READER_ARGUMENT_INVALID");
  while ((next = strtok_r(NULL, "/", &save)) != NULL) {
    int child = openat(parent, part, O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
    if (child < 0) die("V138_READER_PARENT_INVALID");
    struct stat status;
    if (fstat(child, &status) != 0 || !S_ISDIR(status.st_mode)) die("V138_READER_PARENT_INVALID");
    close(parent); parent = child; part = next;
  }
  barrier(root);
  if (strcmp(argv[1], "absent") == 0) {
    struct stat absent_status;
    if (fstatat(parent, part, &absent_status, AT_SYMLINK_NOFOLLOW) == 0) die("V138_READER_EXPECTED_ABSENT");
    if (errno != ENOENT) die("V138_READER_ABSENCE_CHECK_FAILED");
    close(parent); close(root);
    return 0;
  }
  int file = openat(parent, part, O_RDONLY | O_NOFOLLOW | O_CLOEXEC);
  if (file < 0) die("V138_READER_FILE_INVALID");
  struct stat status;
  if (fstat(file, &status) != 0 || !S_ISREG(status.st_mode) || status.st_size < 0 || status.st_size > 64 * 1024 * 1024) die("V138_READER_FILE_INVALID");
  unsigned char buffer[65536];
  for (;;) {
    ssize_t count = read(file, buffer, sizeof(buffer));
    if (count < 0) die("V138_READER_READ_FAILED");
    if (count == 0) break;
    size_t offset = 0;
    while (offset < (size_t)count) {
      ssize_t written = write(STDOUT_FILENO, buffer + offset, (size_t)count - offset);
      if (written <= 0) die("V138_READER_OUTPUT_FAILED");
      offset += (size_t)written;
    }
  }
  close(file); close(parent); close(root);
  return 0;
}

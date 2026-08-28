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

#define MAX_REQUESTS 512
#define MAX_DIRS 1024
#define MAX_PATH 4096

typedef struct { char kind; char path[MAX_PATH]; } request_t;
typedef struct { char path[MAX_PATH]; int fd; dev_t dev; ino_t ino; } dir_t;
static request_t requests[MAX_REQUESTS];
static dir_t dirs[MAX_DIRS];
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
  strcpy(slot->path, relative); slot->fd = child; slot->dev = status.st_dev; slot->ino = status.st_ino;
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

static void barrier(int root) {
  const char *tag = getenv("V138_READER_TEST_BARRIER");
  if (!tag || !*tag) return;
  for (const char *cursor = tag; *cursor; cursor++)
    if (!((*cursor >= 'a' && *cursor <= 'z') || (*cursor >= '0' && *cursor <= '9') || *cursor == '-'))
      die("V138_READER_BARRIER_INVALID");
  char ready[128], proceed[128];
  snprintf(ready, sizeof(ready), ".v138-reader-ready-%s", tag);
  snprintf(proceed, sizeof(proceed), ".v138-reader-continue-%s", tag);
  int marker = openat(root, ready, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (marker < 0) die("V138_READER_BARRIER_READY_FAILED");
  close(marker); fsync(root);
  struct stat status;
  for (int attempt = 0; attempt < 10000; attempt++) {
    if (fstatat(root, proceed, &status, AT_SYMLINK_NOFOLLOW) == 0) {
      unlinkat(root, ready, 0); unlinkat(root, proceed, 0); fsync(root); return;
    }
    if (errno != ENOENT) die("V138_READER_BARRIER_STAT_FAILED");
    usleep(1000);
  }
  die("V138_READER_BARRIER_TIMEOUT");
}

int main(void) {
  setvbuf(stdout, NULL, _IONBF, 0);
  int root = fcntl(3, F_DUPFD_CLOEXEC, 4);
  if (root < 0) die("V138_READER_ROOT_INVALID");
  struct stat root_status;
  if (fstat(root, &root_status) != 0 || !S_ISDIR(root_status.st_mode)) die("V138_READER_ROOT_INVALID");
  strcpy(dirs[0].path, ""); dirs[0].fd = root; dirs[0].dev = root_status.st_dev; dirs[0].ino = root_status.st_ino; dir_count = 1;

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

  /* First retain every ancestor. No evidence byte or absence decision is made
     until the full ancestor graph is descriptor-bound. */
  for (size_t i = 0; i < request_count; i++) {
    char name[MAX_PATH]; (void)parent_for(requests[i].path, name);
  }
  barrier(root);

  printf("I\t%llu\t%llu\n", (unsigned long long)root_status.st_dev, (unsigned long long)root_status.st_ino);
  for (size_t i = 0; i < dir_count; i++) {
    printf("D\t"); hex_bytes((const unsigned char *)dirs[i].path, strlen(dirs[i].path));
    printf("\t%llu\t%llu\n", (unsigned long long)dirs[i].dev, (unsigned long long)dirs[i].ino);
  }
  for (size_t i = 0; i < request_count; i++) {
    char name[MAX_PATH]; int parent = parent_for(requests[i].path, name);
    printf("%c\t", requests[i].kind); hex_bytes((const unsigned char *)requests[i].path, strlen(requests[i].path)); printf("\t");
    if (requests[i].kind == 'A') {
      struct stat status;
      if (fstatat(dirs[parent].fd, name, &status, AT_SYMLINK_NOFOLLOW) == 0) die("V138_READER_EXPECTED_ABSENT");
      if (errno != ENOENT) die("V138_READER_ABSENCE_CHECK_FAILED");
      printf("-\n");
      continue;
    }
    int file = openat(dirs[parent].fd, name, O_RDONLY | O_NOFOLLOW | O_CLOEXEC);
    if (file < 0) die("V138_READER_FILE_INVALID");
    struct stat status;
    if (fstat(file, &status) != 0 || !S_ISREG(status.st_mode) || status.st_size < 0 || status.st_size > 64 * 1024 * 1024)
      die("V138_READER_FILE_INVALID");
    unsigned char buffer[65536];
    for (;;) {
      ssize_t count = read(file, buffer, sizeof(buffer));
      if (count < 0) die("V138_READER_READ_FAILED");
      if (count == 0) break;
      hex_bytes(buffer, (size_t)count);
    }
    close(file); printf("\n");
  }
  for (size_t i = 0; i < dir_count; i++) close(dirs[i].fd);
  return 0;
}

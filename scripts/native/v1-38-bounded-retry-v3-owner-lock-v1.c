#define _DARWIN_C_SOURCE 1
#include <sys/file.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef O_NOFOLLOW
#define O_NOFOLLOW 0
#endif

__attribute__((noreturn)) static void die(const char *code) {
  fprintf(stderr, "%s\n", code);
  exit(2);
}

static unsigned long long parse_identity(const char *value) {
  char *end = NULL;
  errno = 0;
  unsigned long long parsed = strtoull(value, &end, 10);
  if (errno != 0 || end == value || *end != '\0') die("V138_RETRY_OWNER_CAPABILITY_INVALID");
  return parsed;
}

int main(int argc, char **argv) {
  (void)argv;
  if (argc != 1) die("V138_RETRY_OWNER_ARGUMENTS_INVALID");
  const char *path = getenv("PATH"), *lang = getenv("LANG"), *locale = getenv("LC_ALL");
  if (!path || strcmp(path, "/usr/bin:/bin") != 0 || !lang || strcmp(lang, "C") != 0 ||
      !locale || strcmp(locale, "C") != 0) die("V138_RETRY_OWNER_ENVIRONMENT_INVALID");

  int capability = fcntl(3, F_DUPFD_CLOEXEC, 6);
  int root = fcntl(4, F_DUPFD_CLOEXEC, 6);
  if (capability < 0 || root < 0) die("V138_RETRY_OWNER_DESCRIPTOR_MISSING");
  struct stat capability_status, root_status;
  if (fstat(capability, &capability_status) != 0 || !S_ISREG(capability_status.st_mode) ||
      capability_status.st_uid != getuid() || (capability_status.st_mode & 0777) != 0600)
    die("V138_RETRY_OWNER_CAPABILITY_UNTRUSTED");
  if (fstat(root, &root_status) != 0 || !S_ISDIR(root_status.st_mode) || root_status.st_uid != getuid())
    die("V138_RETRY_OWNER_ROOT_UNTRUSTED");

  FILE *stream = fdopen(capability, "r");
  if (!stream) die("V138_RETRY_OWNER_CAPABILITY_INVALID");
  char line[256], marker[32], device[64], inode[64], token[80];
  if (!fgets(line, sizeof(line), stream) ||
      sscanf(line, "%31s\t%63s\t%63s\t%79s", marker, device, inode, token) != 4 ||
      strcmp(marker, "V138OWNER1") != 0 || strlen(token) != 64 ||
      (unsigned long long)root_status.st_dev != parse_identity(device) ||
      (unsigned long long)root_status.st_ino != parse_identity(inode))
    die("V138_RETRY_OWNER_CAPABILITY_INVALID");
  fclose(stream);

  if (flock(root, LOCK_EX | LOCK_NB) != 0) die("V138_RETRY_OWNER_LOCK_ACTIVE");
  if (write(STDOUT_FILENO, "acquired\n", 9) != 9) die("V138_RETRY_OWNER_HANDSHAKE_FAILED");
  char buffer[64];
  while (read(STDIN_FILENO, buffer, sizeof(buffer)) > 0) {}
  close(root);
  return 0;
}

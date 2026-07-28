use std::collections::BTreeSet;

const REQUIRED_CONTROLLERS: [&str; 3] = ["cpu", "memory", "pids"];

fn validate_nonce(value: &str) -> Result<(), &'static str> {
    if value.len() < 24
        || value.len() > 255
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"._:-".contains(&byte))
    {
        return Err("INVALID_NONCE");
    }
    Ok(())
}

fn require_controllers(value: &str) -> Result<(), &'static str> {
    let values = value.split_ascii_whitespace().collect::<Vec<_>>();
    let unique = values.iter().copied().collect::<BTreeSet<_>>();
    if values.len() != REQUIRED_CONTROLLERS.len()
        || unique.len() != REQUIRED_CONTROLLERS.len()
        || REQUIRED_CONTROLLERS
            .iter()
            .any(|required| !unique.contains(required))
    {
        return Err("CONTROLLERS_UNAVAILABLE");
    }
    Ok(())
}

fn cpu_max(quota: u64, period: u64) -> String {
    format!("{quota} {period}")
}

fn json_escape(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    for character in value.chars() {
        match character {
            '"' => output.push_str("\\\""),
            '\\' => output.push_str("\\\\"),
            '\n' => output.push_str("\\n"),
            '\r' => output.push_str("\\r"),
            '\t' => output.push_str("\\t"),
            value if value <= '\u{001f}' => {
                output.push_str(&format!("\\u{:04x}", value as u32));
            }
            value => output.push(value),
        }
    }
    output
}

fn base64(bytes: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut output = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let first = chunk[0];
        let second = *chunk.get(1).unwrap_or(&0);
        let third = *chunk.get(2).unwrap_or(&0);
        output.push(TABLE[(first >> 2) as usize] as char);
        output.push(TABLE[(((first & 0x03) << 4) | (second >> 4)) as usize] as char);
        output.push(if chunk.len() > 1 {
            TABLE[(((second & 0x0f) << 2) | (third >> 6)) as usize] as char
        } else {
            '='
        });
        output.push(if chunk.len() > 2 {
            TABLE[(third & 0x3f) as usize] as char
        } else {
            '='
        });
    }
    output
}

fn sha256(bytes: &[u8]) -> [u8; 32] {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    let mut state = [
        0x6a09e667_u32,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19,
    ];
    let bit_length = (bytes.len() as u64).wrapping_mul(8);
    let mut padded = bytes.to_vec();
    padded.push(0x80);
    while padded.len() % 64 != 56 {
        padded.push(0);
    }
    padded.extend_from_slice(&bit_length.to_be_bytes());
    for chunk in padded.chunks_exact(64) {
        let mut words = [0_u32; 64];
        for (index, word) in words.iter_mut().take(16).enumerate() {
            let start = index * 4;
            *word = u32::from_be_bytes(chunk[start..start + 4].try_into().expect("word"));
        }
        for index in 16..64 {
            let s0 = words[index - 15].rotate_right(7)
                ^ words[index - 15].rotate_right(18)
                ^ (words[index - 15] >> 3);
            let s1 = words[index - 2].rotate_right(17)
                ^ words[index - 2].rotate_right(19)
                ^ (words[index - 2] >> 10);
            words[index] = words[index - 16]
                .wrapping_add(s0)
                .wrapping_add(words[index - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut h] = state;
        for index in 0..64 {
            let sum1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let choice = (e & f) ^ ((!e) & g);
            let temporary1 = h
                .wrapping_add(sum1)
                .wrapping_add(choice)
                .wrapping_add(K[index])
                .wrapping_add(words[index]);
            let sum0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let majority = (a & b) ^ (a & c) ^ (b & c);
            let temporary2 = sum0.wrapping_add(majority);
            h = g;
            g = f;
            f = e;
            e = d.wrapping_add(temporary1);
            d = c;
            c = b;
            b = a;
            a = temporary1.wrapping_add(temporary2);
        }
        for (slot, value) in state.iter_mut().zip([a, b, c, d, e, f, g, h].into_iter()) {
            *slot = slot.wrapping_add(value);
        }
    }
    let mut output = [0_u8; 32];
    for (index, value) in state.iter().enumerate() {
        output[index * 4..index * 4 + 4].copy_from_slice(&value.to_be_bytes());
    }
    output
}

fn sha256_hex(bytes: &[u8]) -> String {
    sha256(bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn validate_sha256_identity(value: &str) -> Result<(), &'static str> {
    if value.len() != 71
        || !value.starts_with("sha256:")
        || !value[7..]
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
    {
        return Err("INVALID_IDENTITY");
    }
    Ok(())
}

#[derive(Debug, PartialEq, Eq)]
struct CompletionStatus {
    exit_code: Option<u32>,
    signal: Option<u32>,
}

fn parse_completion_status(value: &str, nonce: &str) -> Result<CompletionStatus, &'static str> {
    let lines = value.split_inclusive('\n').collect::<Vec<_>>();
    if lines.len() != 3 || lines.iter().any(|line| !line.ends_with('\n')) {
        return Err("COMPLETION_INVALID");
    }
    let expected_nonce = format!("nonce={nonce}\n");
    if lines[0] != expected_nonce {
        return Err("COMPLETION_INVALID");
    }
    let parse_optional = |line: &str, prefix: &str| -> Result<Option<u32>, &'static str> {
        let value = line
            .strip_prefix(prefix)
            .and_then(|value| value.strip_suffix('\n'))
            .ok_or("COMPLETION_INVALID")?;
        if value == "null" {
            return Ok(None);
        }
        let parsed = value.parse::<u32>().map_err(|_| "COMPLETION_INVALID")?;
        Ok(Some(parsed))
    };
    let status = CompletionStatus {
        exit_code: parse_optional(lines[1], "exit-code=")?,
        signal: parse_optional(lines[2], "signal=")?,
    };
    if status.exit_code.is_some() == status.signal.is_some() {
        return Err("COMPLETION_INVALID");
    }
    Ok(status)
}

#[cfg(any(test, not(target_os = "linux")))]
fn platform_status() -> &'static str {
    #[cfg(target_os = "linux")]
    {
        "linux-cgroup-v2"
    }
    #[cfg(not(target_os = "linux"))]
    {
        "unsupported-before-launch"
    }
}

#[cfg(target_os = "linux")]
mod linux {
    use super::{
        CompletionStatus, REQUIRED_CONTROLLERS, base64, cpu_max, json_escape,
        parse_completion_status, require_controllers, sha256_hex, validate_nonce,
        validate_sha256_identity,
    };
    use std::collections::{BTreeMap, BTreeSet};
    use std::env;
    use std::ffi::{CString, c_char, c_int, c_long, c_ulong, c_void};
    use std::fs::{self, OpenOptions};
    use std::io::{self, Read, Write};
    use std::os::fd::AsRawFd;
    use std::os::unix::fs::{MetadataExt, OpenOptionsExt, PermissionsExt};
    use std::os::unix::process::{CommandExt, ExitStatusExt};
    use std::path::{Path, PathBuf};
    use std::process::{Command, Stdio};
    use std::thread;
    use std::time::{Duration, Instant};

    const CLONE_NEWNS: c_int = 0x0002_0000;
    const CLONE_NEWUSER: c_int = 0x1000_0000;
    const PR_SET_CHILD_SUBREAPER: c_int = 36;
    const MS_REC: c_ulong = 16_384;
    const MS_PRIVATE: c_ulong = 1 << 18;
    const MS_NOSUID: c_ulong = 2;
    const MS_NODEV: c_ulong = 4;
    const MS_NOEXEC: c_ulong = 8;
    const SIGKILL: c_int = 9;
    const PR_SET_NO_NEW_PRIVS: c_int = 38;
    const PR_CAPBSET_DROP: c_int = 24;
    const O_PATH: c_int = 0o10_000_000;
    const O_CLOEXEC: c_int = 0o2_000_000;
    const O_NOFOLLOW: c_int = 0o4_000_00;
    const WNOHANG: c_int = 1;
    const SUPERVISOR_HOST_UID: u32 = 65_532;
    const GUEST_HOST_UID: u32 = 65_534;
    const LANDLOCK_CREATE_RULESET_VERSION: u32 = 1;
    const LANDLOCK_RULE_PATH_BENEATH: u32 = 1;
    const LANDLOCK_ACCESS_FS_EXECUTE: u64 = 1 << 0;
    const LANDLOCK_ACCESS_FS_WRITE_FILE: u64 = 1 << 1;
    const LANDLOCK_ACCESS_FS_READ_FILE: u64 = 1 << 2;
    const LANDLOCK_ACCESS_FS_READ_DIR: u64 = 1 << 3;
    const LANDLOCK_ACCESS_FS_REMOVE_DIR: u64 = 1 << 4;
    const LANDLOCK_ACCESS_FS_REMOVE_FILE: u64 = 1 << 5;
    const LANDLOCK_ACCESS_FS_MAKE_CHAR: u64 = 1 << 6;
    const LANDLOCK_ACCESS_FS_MAKE_DIR: u64 = 1 << 7;
    const LANDLOCK_ACCESS_FS_MAKE_REG: u64 = 1 << 8;
    const LANDLOCK_ACCESS_FS_MAKE_SOCK: u64 = 1 << 9;
    const LANDLOCK_ACCESS_FS_MAKE_FIFO: u64 = 1 << 10;
    const LANDLOCK_ACCESS_FS_MAKE_BLOCK: u64 = 1 << 11;
    const LANDLOCK_ACCESS_FS_MAKE_SYM: u64 = 1 << 12;
    const LANDLOCK_ACCESS_FS_REFER: u64 = 1 << 13;
    const LANDLOCK_ACCESS_FS_TRUNCATE: u64 = 1 << 14;
    const LANDLOCK_READ_EXEC: u64 =
        LANDLOCK_ACCESS_FS_EXECUTE | LANDLOCK_ACCESS_FS_READ_FILE | LANDLOCK_ACCESS_FS_READ_DIR;
    const LANDLOCK_WRITE: u64 = LANDLOCK_ACCESS_FS_WRITE_FILE
        | LANDLOCK_ACCESS_FS_REMOVE_DIR
        | LANDLOCK_ACCESS_FS_REMOVE_FILE
        | LANDLOCK_ACCESS_FS_MAKE_CHAR
        | LANDLOCK_ACCESS_FS_MAKE_DIR
        | LANDLOCK_ACCESS_FS_MAKE_REG
        | LANDLOCK_ACCESS_FS_MAKE_SOCK
        | LANDLOCK_ACCESS_FS_MAKE_FIFO
        | LANDLOCK_ACCESS_FS_MAKE_BLOCK
        | LANDLOCK_ACCESS_FS_MAKE_SYM
        | LANDLOCK_ACCESS_FS_REFER
        | LANDLOCK_ACCESS_FS_TRUNCATE;
    const LANDLOCK_HANDLED: u64 = LANDLOCK_READ_EXEC | LANDLOCK_WRITE;

    #[cfg(target_arch = "x86_64")]
    const SYS_LANDLOCK_CREATE_RULESET: c_long = 444;
    #[cfg(target_arch = "x86_64")]
    const SYS_LANDLOCK_ADD_RULE: c_long = 445;
    #[cfg(target_arch = "x86_64")]
    const SYS_LANDLOCK_RESTRICT_SELF: c_long = 446;

    #[repr(C)]
    struct LandlockRulesetAttr {
        handled_access_fs: u64,
    }

    #[repr(C)]
    struct LandlockPathBeneathAttr {
        allowed_access: u64,
        parent_fd: c_int,
        reserved: u32,
    }

    unsafe extern "C" {
        fn unshare(flags: c_int) -> c_int;
        fn mount(
            source: *const c_char,
            target: *const c_char,
            filesystemtype: *const c_char,
            mountflags: c_ulong,
            data: *const c_void,
        ) -> c_int;
        fn prctl(option: c_int, ...) -> c_int;
        fn syscall(number: c_long, ...) -> c_long;
        fn kill(pid: c_int, signal: c_int) -> c_int;
        fn waitpid(pid: c_int, status: *mut c_int, options: c_int) -> c_int;
        fn getuid() -> u32;
        fn getgid() -> u32;
    }

    #[derive(Debug)]
    struct Config {
        cgroup_root: PathBuf,
        nonce: String,
        cpu_quota_us: u64,
        cpu_period_us: u64,
        memory_max_bytes: u64,
        pids_max: u64,
        guest_namespace_uid: u32,
        deadline_ms: u64,
        stdout_max: usize,
        stderr_max: usize,
        payload_max: usize,
        request_sha256: String,
        process_group_sha256: String,
        expected_executable_sha256: String,
        environment: Vec<(String, String)>,
        cancellation_path: PathBuf,
        cancellation_nonce: String,
        input_path: PathBuf,
        command: Vec<String>,
    }

    #[derive(Debug)]
    struct MonitorConfig {
        cgroup_root: PathBuf,
        invocation_name: String,
        control_root: PathBuf,
        nonce: String,
        cpu_quota_us: u64,
        cpu_period_us: u64,
        memory_max_bytes: u64,
        pids_max: u64,
        supervisor_host_uid: u32,
        guest_host_uid: u32,
        deadline_ms: u64,
        stdout_max: usize,
        stderr_max: usize,
        payload_max: usize,
        request_sha256: String,
        process_group_sha256: String,
        cancellation_path: PathBuf,
        cancellation_nonce: String,
        completion_path: PathBuf,
        ready_path: PathBuf,
        stdout_path: PathBuf,
        stderr_path: PathBuf,
    }

    impl MonitorConfig {
        fn parse() -> Result<Self, String> {
            Self::parse_from(env::args().skip(1))
        }

        fn parse_from(arguments: impl IntoIterator<Item = String>) -> Result<Self, String> {
            let mut arguments = arguments.into_iter();
            if arguments.next().as_deref() != Some("monitor") {
                return Err("USAGE".into());
            }
            let mut values = BTreeMap::new();
            while let Some(argument) = arguments.next() {
                if !argument.starts_with("--") {
                    return Err("USAGE".into());
                }
                let value = arguments.next().ok_or("USAGE")?;
                if values.insert(argument, value).is_some() {
                    return Err("DUPLICATE_ARGUMENT".into());
                }
            }
            let take = |name: &str| {
                values
                    .get(name)
                    .cloned()
                    .ok_or_else(|| format!("MISSING_{name}"))
            };
            let parse_u64 = |name: &str| -> Result<u64, String> {
                take(name)?
                    .parse::<u64>()
                    .map_err(|_| format!("INVALID_{name}"))
            };
            let nonce = take("--nonce")?;
            validate_nonce(&nonce).map_err(str::to_owned)?;
            let supervisor_host_uid: u32 = parse_u64("--supervisor-host-uid")?
                .try_into()
                .map_err(|_| "INVALID_SUPERVISOR_UID")?;
            let guest_host_uid: u32 = parse_u64("--guest-host-uid")?
                .try_into()
                .map_err(|_| "INVALID_GUEST_UID")?;
            let config = Self {
                cgroup_root: PathBuf::from(take("--cgroup-root")?),
                invocation_name: take("--invocation-name")?,
                control_root: PathBuf::from(take("--control-root")?),
                nonce,
                cpu_quota_us: parse_u64("--cpu-quota-us")?,
                cpu_period_us: parse_u64("--cpu-period-us")?,
                memory_max_bytes: parse_u64("--memory-max-bytes")?,
                pids_max: parse_u64("--pids-max")?,
                supervisor_host_uid,
                guest_host_uid,
                deadline_ms: parse_u64("--deadline-ms")?,
                stdout_max: parse_u64("--stdout-max")?
                    .try_into()
                    .map_err(|_| "INVALID_STDOUT_MAX")?,
                stderr_max: parse_u64("--stderr-max")?
                    .try_into()
                    .map_err(|_| "INVALID_STDERR_MAX")?,
                payload_max: parse_u64("--payload-max")?
                    .try_into()
                    .map_err(|_| "INVALID_PAYLOAD_MAX")?,
                request_sha256: take("--request-sha256")?,
                process_group_sha256: take("--process-group-sha256")?,
                cancellation_path: PathBuf::from(take("--cancellation-path")?),
                cancellation_nonce: take("--cancellation-nonce")?,
                completion_path: PathBuf::from(take("--completion-path")?),
                ready_path: PathBuf::from(take("--ready-path")?),
                stdout_path: PathBuf::from(take("--stdout-path")?),
                stderr_path: PathBuf::from(take("--stderr-path")?),
            };
            if values.len() != 22 {
                return Err("UNKNOWN_ARGUMENT".into());
            }
            if config.invocation_name != format!("invocation-{}", config.nonce)
                || !config.cgroup_root.is_absolute()
                || !config.control_root.is_absolute()
                || config.cpu_quota_us == 0
                || config.cpu_period_us == 0
                || config.memory_max_bytes == 0
                || config.pids_max == 0
                || config.deadline_ms == 0
                || config.deadline_ms > 300_000
                || config.stdout_max == 0
                || config.stdout_max > 16 * 1024 * 1024
                || config.stderr_max == 0
                || config.stderr_max > 16 * 1024 * 1024
                || config.payload_max == 0
                || config.payload_max > config.stdout_max
                || config.supervisor_host_uid != SUPERVISOR_HOST_UID
                || config.guest_host_uid != GUEST_HOST_UID
                || config.supervisor_host_uid == config.guest_host_uid
                || config.cancellation_nonce.len() < 24
                || validate_sha256_identity(&config.request_sha256).is_err()
                || validate_sha256_identity(&config.process_group_sha256).is_err()
            {
                return Err("INVALID_LIMIT_OR_IDENTITY".into());
            }
            for (path, name) in [
                (&config.cancellation_path, "cancel"),
                (&config.completion_path, "completion"),
                (&config.ready_path, "ready"),
                (&config.stdout_path, "stdout"),
                (&config.stderr_path, "stderr"),
            ] {
                if path.parent() != Some(config.control_root.as_path())
                    || path.file_name().and_then(|value| value.to_str()) != Some(name)
                {
                    return Err("CONTROL_PATH_INVALID".into());
                }
            }
            Ok(config)
        }
    }

    impl Config {
        fn parse() -> Result<Self, String> {
            let mut arguments = env::args().skip(1);
            if arguments.next().as_deref() != Some("run") {
                return Err("USAGE".into());
            }
            let mut values = BTreeMap::new();
            let mut command = Vec::new();
            while let Some(argument) = arguments.next() {
                if argument == "--" {
                    command.extend(arguments);
                    break;
                }
                if !argument.starts_with("--") {
                    return Err("USAGE".into());
                }
                let value = arguments.next().ok_or("USAGE")?;
                if values.insert(argument, value).is_some() {
                    return Err("DUPLICATE_ARGUMENT".into());
                }
            }
            let take = |name: &str| {
                values
                    .get(name)
                    .cloned()
                    .ok_or_else(|| format!("MISSING_{name}"))
            };
            let parse_u64 = |name: &str| -> Result<u64, String> {
                take(name)?
                    .parse::<u64>()
                    .map_err(|_| format!("INVALID_{name}"))
            };
            let nonce = take("--nonce")?;
            validate_nonce(&nonce).map_err(str::to_owned)?;
            if command.is_empty() || command.iter().any(|value| value.contains('\0')) {
                return Err("INVALID_COMMAND".into());
            }
            let environment_count = parse_u64("--environment-count")?
                .try_into()
                .map_err(|_| "INVALID_ENVIRONMENT_COUNT")?;
            if environment_count > 128 {
                return Err("INVALID_ENVIRONMENT_COUNT".into());
            }
            let mut environment = Vec::with_capacity(environment_count);
            for index in 0..environment_count {
                let name = take(&format!("--environment-{index}-name"))?;
                let value = take(&format!("--environment-{index}-value"))?;
                if name.is_empty()
                    || name.len() > 128
                    || !name.bytes().enumerate().all(|(offset, byte)| {
                        if offset == 0 {
                            byte.is_ascii_alphabetic() || byte == b'_'
                        } else {
                            byte.is_ascii_alphanumeric() || byte == b'_'
                        }
                    })
                    || value.contains('\0')
                    || value.len() > 16_384
                {
                    return Err("INVALID_ENVIRONMENT".into());
                }
                environment.push((name, value));
            }
            let config = Self {
                cgroup_root: PathBuf::from(take("--cgroup-root")?),
                nonce,
                cpu_quota_us: parse_u64("--cpu-quota-us")?,
                cpu_period_us: parse_u64("--cpu-period-us")?,
                memory_max_bytes: parse_u64("--memory-max-bytes")?,
                pids_max: parse_u64("--pids-max")?,
                guest_namespace_uid: parse_u64("--guest-namespace-uid")?
                    .try_into()
                    .map_err(|_| "INVALID_GUEST_UID")?,
                deadline_ms: parse_u64("--deadline-ms")?,
                stdout_max: parse_u64("--stdout-max")?
                    .try_into()
                    .map_err(|_| "INVALID_STDOUT_MAX")?,
                stderr_max: parse_u64("--stderr-max")?
                    .try_into()
                    .map_err(|_| "INVALID_STDERR_MAX")?,
                payload_max: parse_u64("--payload-max")?
                    .try_into()
                    .map_err(|_| "INVALID_PAYLOAD_MAX")?,
                request_sha256: take("--request-sha256")?,
                process_group_sha256: take("--process-group-sha256")?,
                expected_executable_sha256: take("--expected-executable-sha256")?,
                environment,
                cancellation_path: PathBuf::from(take("--cancellation-path")?),
                cancellation_nonce: take("--cancellation-nonce")?,
                input_path: PathBuf::from(take("--input-path")?),
                command,
            };
            if values.len() != 18 + environment_count * 2 {
                return Err("UNKNOWN_ARGUMENT".into());
            }
            if config.cpu_quota_us == 0
                || config.cpu_period_us == 0
                || config.memory_max_bytes == 0
                || config.pids_max == 0
                || config.deadline_ms == 0
                || config.stdout_max == 0
                || config.stderr_max == 0
                || config.payload_max == 0
                || !config.request_sha256.starts_with("sha256:")
                || !config.process_group_sha256.starts_with("sha256:")
                || config.expected_executable_sha256.len() != 71
                || !config.expected_executable_sha256.starts_with("sha256:")
                || config.cancellation_nonce.len() < 24
            {
                return Err("INVALID_LIMIT_OR_IDENTITY".into());
            }
            Ok(config)
        }
    }

    fn write_control(path: &Path, value: &str) -> io::Result<()> {
        OpenOptions::new()
            .write(true)
            .open(path)?
            .write_all(value.as_bytes())
    }

    fn parse_key_values(path: &Path) -> io::Result<BTreeMap<String, u64>> {
        let mut output = BTreeMap::new();
        for line in fs::read_to_string(path)?.lines() {
            let mut values = line.split_ascii_whitespace();
            let key = values
                .next()
                .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "missing key"))?;
            let value = values
                .next()
                .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "missing value"))?
                .parse::<u64>()
                .map_err(|_| io::Error::new(io::ErrorKind::InvalidData, "invalid value"))?;
            if values.next().is_some() || output.insert(key.to_owned(), value).is_some() {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "duplicate or extra cgroup value",
                ));
            }
        }
        Ok(output)
    }

    fn read_u64(path: &Path) -> io::Result<u64> {
        fs::read_to_string(path)?
            .trim()
            .parse::<u64>()
            .map_err(|_| io::Error::new(io::ErrorKind::InvalidData, "invalid integer"))
    }

    fn read_limited(mut reader: impl Read, maximum: usize) -> io::Result<(Vec<u8>, bool)> {
        let mut retained = Vec::with_capacity(maximum.min(64 * 1024));
        let mut truncated = false;
        let mut buffer = [0_u8; 8192];
        loop {
            let read = reader.read(&mut buffer)?;
            if read == 0 {
                break;
            }
            let remaining = maximum.saturating_sub(retained.len());
            retained.extend_from_slice(&buffer[..read.min(remaining)]);
            if read > remaining {
                truncated = true;
            }
        }
        Ok((retained, truncated))
    }

    fn validate_private_directory(path: &Path, owner: u32) -> Result<(), String> {
        let metadata = fs::symlink_metadata(path).map_err(|_| "CONTROL_ROOT_INVALID")?;
        if metadata.file_type().is_symlink()
            || !metadata.is_dir()
            || metadata.uid() != owner
            || metadata.mode() & 0o7777 != 0o700
        {
            return Err("CONTROL_ROOT_INVALID".into());
        }
        Ok(())
    }

    fn secure_file(path: &Path, owner: u32, maximum: usize) -> Result<Vec<u8>, String> {
        let before = fs::symlink_metadata(path).map_err(|_| "CONTROL_FILE_INVALID")?;
        if before.file_type().is_symlink()
            || !before.is_file()
            || before.uid() != owner
            || before.mode() & 0o7777 != 0o600
            || before.nlink() != 1
            || before.len() > (maximum as u64).saturating_add(1)
        {
            return Err("CONTROL_FILE_INVALID".into());
        }
        let mut file = OpenOptions::new()
            .read(true)
            .custom_flags(O_NOFOLLOW | O_CLOEXEC)
            .open(path)
            .map_err(|_| "CONTROL_FILE_INVALID")?;
        let opened = file.metadata().map_err(|_| "CONTROL_FILE_INVALID")?;
        if before.dev() != opened.dev() || before.ino() != opened.ino() {
            return Err("CONTROL_FILE_INVALID".into());
        }
        let mut bytes = Vec::with_capacity(maximum.min(64 * 1024).saturating_add(1));
        Read::by_ref(&mut file)
            .take((maximum as u64).saturating_add(2))
            .read_to_end(&mut bytes)
            .map_err(|_| "CONTROL_FILE_INVALID")?;
        if bytes.len() > maximum.saturating_add(1) {
            return Err("CONTROL_FILE_INVALID".into());
        }
        Ok(bytes)
    }

    fn optional_secure_text(
        path: &Path,
        owner: u32,
        maximum: usize,
    ) -> Result<Option<String>, String> {
        match fs::symlink_metadata(path) {
            Ok(_) => {
                let bytes = secure_file(path, owner, maximum)?;
                let value =
                    String::from_utf8(bytes).map_err(|_| "CONTROL_FILE_INVALID".to_owned())?;
                Ok(Some(value))
            }
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
            Err(_) => Err("CONTROL_FILE_INVALID".into()),
        }
    }

    fn create_ready_marker(config: &MonitorConfig) -> Result<(), String> {
        let mut ready = OpenOptions::new()
            .write(true)
            .create_new(true)
            .mode(0o600)
            .custom_flags(O_NOFOLLOW | O_CLOEXEC)
            .open(&config.ready_path)
            .map_err(|_| "READY_MARKER_INVALID")?;
        ready
            .write_all(format!("{}\n", config.nonce).as_bytes())
            .and_then(|()| ready.sync_all())
            .map_err(|_| "READY_MARKER_INVALID".to_owned())
    }

    fn monitor_cancellation_requested(config: &MonitorConfig) -> Result<bool, String> {
        match optional_secure_text(
            &config.cancellation_path,
            config.supervisor_host_uid,
            config.cancellation_nonce.len().saturating_add(1),
        )? {
            Some(value) if value == format!("{}\n", config.cancellation_nonce) => Ok(true),
            Some(_) => Err("CANCELLATION_CHANNEL_INVALID".into()),
            None => Ok(false),
        }
    }

    fn monitor_completion(config: &MonitorConfig) -> Result<Option<CompletionStatus>, String> {
        let Some(value) =
            optional_secure_text(&config.completion_path, config.supervisor_host_uid, 1024)?
        else {
            return Ok(None);
        };
        parse_completion_status(&value, &config.nonce)
            .map(Some)
            .map_err(str::to_owned)
    }

    fn cgroup_populated(path: &Path) -> Result<bool, String> {
        let events =
            parse_key_values(&path.join("cgroup.events")).map_err(|_| "COUNTER_READ_FAILED")?;
        match events.get("populated") {
            Some(0) => Ok(false),
            Some(1) => Ok(true),
            _ => Err("COUNTER_READ_FAILED".into()),
        }
    }

    fn validate_cgroup_directory(path: &Path, owner: u32) -> Result<(), String> {
        let metadata = fs::symlink_metadata(path).map_err(|_| "CGROUP_IDENTITY_INVALID")?;
        if metadata.file_type().is_symlink() || !metadata.is_dir() || metadata.uid() != owner {
            return Err("CGROUP_IDENTITY_INVALID".into());
        }
        Ok(())
    }

    fn wait_recursive_empty(invocation: &Path, duration: Duration) -> Result<(), String> {
        let deadline = Instant::now() + duration;
        loop {
            if !cgroup_populated(invocation)? {
                let procs = fs::read_to_string(invocation.join("cgroup.procs"))
                    .map_err(|_| "COUNTER_READ_FAILED")?;
                if procs.trim().is_empty() {
                    return Ok(());
                }
            }
            if Instant::now() >= deadline {
                return Err("CGROUP_NOT_EMPTY".into());
            }
            thread::sleep(Duration::from_millis(2));
        }
    }

    fn validate_no_process_children() -> Result<(), String> {
        let mut status = 0;
        let reaped = unsafe { waitpid(-1, &mut status, WNOHANG) };
        if reaped < 0 && io::Error::last_os_error().raw_os_error() == Some(10) {
            return Ok(());
        }
        Err("DAEMON_SEPARATION_INVALID".into())
    }

    fn monitor_mandatory_kill(invocation: &Path) -> Result<(), String> {
        let cgroup_kill = invocation.join("cgroup.kill");
        let metadata = fs::symlink_metadata(&cgroup_kill).map_err(|_| "CGROUP_KILL_UNAVAILABLE")?;
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err("CGROUP_KILL_UNAVAILABLE".into());
        }
        write_control(&cgroup_kill, "1").map_err(|_| "CGROUP_KILL_FAILED".to_owned())
    }

    fn read_bounded_output(
        path: &Path,
        owner: u32,
        maximum: usize,
    ) -> Result<(Vec<u8>, bool, usize), String> {
        let bytes = secure_file(path, owner, maximum)?;
        let original_length = bytes.len();
        let truncated = original_length > maximum;
        Ok((
            bytes.into_iter().take(maximum).collect(),
            truncated,
            original_length,
        ))
    }

    unsafe fn add_landlock_path(ruleset_fd: c_int, path: &Path, access: u64) -> io::Result<()> {
        if !path.exists() {
            return Ok(());
        }
        let path = CString::new(path.as_os_str().as_encoded_bytes())
            .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "path contains NUL"))?;
        let fd = unsafe { libc_open(path.as_ptr(), O_PATH | O_CLOEXEC) };
        if fd < 0 {
            return Err(io::Error::last_os_error());
        }
        let attribute = LandlockPathBeneathAttr {
            allowed_access: access,
            parent_fd: fd,
            reserved: 0,
        };
        let result = unsafe {
            syscall(
                SYS_LANDLOCK_ADD_RULE,
                ruleset_fd,
                LANDLOCK_RULE_PATH_BENEATH,
                &attribute as *const LandlockPathBeneathAttr,
                0_u32,
            )
        };
        unsafe { libc_close(fd) };
        if result != 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(())
    }

    unsafe extern "C" {
        #[link_name = "open"]
        fn libc_open(path: *const c_char, flags: c_int, ...) -> c_int;
        #[link_name = "close"]
        fn libc_close(fd: c_int) -> c_int;
    }

    fn cancellation_requested(config: &Config) -> Result<bool, String> {
        match fs::read_to_string(&config.cancellation_path) {
            Ok(value) if value.trim_end() == config.cancellation_nonce => Ok(true),
            Ok(_) => Err("CANCELLATION_CHANNEL_INVALID".into()),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(false),
            Err(_) => Err("CANCELLATION_CHANNEL_INVALID".into()),
        }
    }

    fn wait_cgroup_empty(invocation: &Path, duration: Duration) -> Result<(), String> {
        let deadline = Instant::now() + duration;
        loop {
            let procs = fs::read_to_string(invocation.join("cgroup.procs"))
                .map_err(|_| "COUNTER_READ_FAILED")?;
            if procs.trim().is_empty() {
                return Ok(());
            }
            if Instant::now() >= deadline {
                return Err("CGROUP_NOT_EMPTY".into());
            }
            thread::sleep(Duration::from_millis(2));
        }
    }

    fn reap_adopted_children() -> Result<(), String> {
        loop {
            let mut status = 0;
            let reaped = unsafe { waitpid(-1, &mut status, WNOHANG) };
            if reaped > 0 {
                continue;
            }
            if reaped == 0 || io::Error::last_os_error().raw_os_error() == Some(10) {
                return Ok(());
            }
            return Err("DESCENDANT_REAP_FAILED".into());
        }
    }

    fn mandatory_kill(child_pid: u32, invocation: &Path) -> Result<(), String> {
        let group_result = unsafe { kill(-(child_pid as c_int), SIGKILL) };
        let cgroup_kill = invocation.join("cgroup.kill");
        if !cgroup_kill.exists() {
            return Err("CGROUP_KILL_UNAVAILABLE".into());
        }
        write_control(&cgroup_kill, "1").map_err(|_| "CGROUP_KILL_FAILED")?;
        if group_result != 0 {
            return Err("PROCESS_GROUP_KILL_FAILED".into());
        }
        Ok(())
    }

    fn cleanup_invocation(invocation: &Path) -> Result<(), String> {
        if !invocation.exists() {
            return Ok(());
        }
        let populated = fs::read_to_string(invocation.join("cgroup.procs"))
            .map_err(|_| "CLEANUP_READ_FAILED")?;
        if !populated.trim().is_empty() {
            let cgroup_kill = invocation.join("cgroup.kill");
            if !cgroup_kill.exists() {
                return Err("CGROUP_KILL_UNAVAILABLE".into());
            }
            write_control(&cgroup_kill, "1").map_err(|_| "CGROUP_KILL_FAILED")?;
            wait_cgroup_empty(invocation, Duration::from_secs(2))?;
        }
        reap_adopted_children()?;
        fs::remove_dir(invocation).map_err(|_| "CGROUP_REMOVE_FAILED")?;
        if invocation.exists() {
            return Err("CGROUP_REMOVE_FAILED".into());
        }
        Ok(())
    }

    unsafe fn install_landlock(executable: &Path) -> io::Result<()> {
        let version = unsafe {
            syscall(
                SYS_LANDLOCK_CREATE_RULESET,
                std::ptr::null::<LandlockRulesetAttr>(),
                0_usize,
                LANDLOCK_CREATE_RULESET_VERSION,
            )
        };
        if version < 1 {
            return Err(io::Error::new(
                io::ErrorKind::Unsupported,
                "Landlock unavailable",
            ));
        }
        let attribute = LandlockRulesetAttr {
            handled_access_fs: LANDLOCK_HANDLED,
        };
        let ruleset_fd = unsafe {
            syscall(
                SYS_LANDLOCK_CREATE_RULESET,
                &attribute as *const LandlockRulesetAttr,
                std::mem::size_of::<LandlockRulesetAttr>(),
                0_u32,
            )
        } as c_int;
        if ruleset_fd < 0 {
            return Err(io::Error::last_os_error());
        }
        for path in [
            "/bin", "/sbin", "/usr", "/lib", "/lib64", "/etc", "/dev", "/proc",
        ] {
            unsafe { add_landlock_path(ruleset_fd, Path::new(path), LANDLOCK_READ_EXEC)? };
        }
        unsafe {
            add_landlock_path(ruleset_fd, Path::new("/tmp"), LANDLOCK_HANDLED)?;
        }
        if let Some(parent) = executable.parent() {
            unsafe { add_landlock_path(ruleset_fd, parent, LANDLOCK_READ_EXEC)? };
        }
        let cwd = env::current_dir()?;
        unsafe { add_landlock_path(ruleset_fd, &cwd, LANDLOCK_HANDLED)? };
        if unsafe { prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) } != 0
            || unsafe { syscall(SYS_LANDLOCK_RESTRICT_SELF, ruleset_fd, 0_u32) } != 0
        {
            unsafe { libc_close(ruleset_fd) };
            return Err(io::Error::last_os_error());
        }
        unsafe { libc_close(ruleset_fd) };
        Ok(())
    }

    unsafe fn enter_guest_namespace(
        cgroup_fd: c_int,
        delegated_root: &Path,
        guest_namespace_uid: u32,
        executable: &Path,
    ) -> io::Result<()> {
        write_control(Path::new(&format!("/proc/self/fd/{cgroup_fd}")), "0")?;
        let host_uid = unsafe { getuid() };
        let host_gid = unsafe { getgid() };
        if unsafe { unshare(CLONE_NEWUSER | CLONE_NEWNS) } != 0 {
            return Err(io::Error::last_os_error());
        }
        let _ = fs::write("/proc/self/setgroups", "deny");
        fs::write(
            "/proc/self/uid_map",
            format!("{guest_namespace_uid} {host_uid} 1\n"),
        )?;
        fs::write(
            "/proc/self/gid_map",
            format!("{guest_namespace_uid} {host_gid} 1\n"),
        )?;
        let root = CString::new("/").expect("static root");
        if unsafe {
            mount(
                std::ptr::null(),
                root.as_ptr(),
                std::ptr::null(),
                MS_REC | MS_PRIVATE,
                std::ptr::null(),
            )
        } != 0
        {
            return Err(io::Error::last_os_error());
        }
        let delegated = CString::new(delegated_root.as_os_str().as_encoded_bytes())
            .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "path contains NUL"))?;
        let tmpfs = CString::new("tmpfs").expect("static tmpfs");
        let data = CString::new("size=4096,mode=000").expect("static mount data");
        if unsafe {
            mount(
                tmpfs.as_ptr(),
                delegated.as_ptr(),
                tmpfs.as_ptr(),
                MS_NOSUID | MS_NODEV | MS_NOEXEC,
                data.as_ptr().cast(),
            )
        } != 0
        {
            return Err(io::Error::last_os_error());
        }
        unsafe { install_landlock(executable)? };
        for capability in 0..64 {
            let _ = unsafe { prctl(PR_CAPBSET_DROP, capability, 0, 0, 0) };
        }
        Ok(())
    }

    fn monitor_inner(config: &MonitorConfig) -> Result<String, String> {
        if unsafe { getuid() } != config.supervisor_host_uid
            || config.supervisor_host_uid == config.guest_host_uid
        {
            return Err("HOST_UID_IDENTITY_MISMATCH".into());
        }
        validate_private_directory(&config.control_root, config.supervisor_host_uid)?;
        validate_cgroup_directory(&config.cgroup_root, config.supervisor_host_uid)?;
        let controllers = fs::read_to_string(config.cgroup_root.join("cgroup.controllers"))
            .map_err(|_| "CONTROLLERS_UNAVAILABLE")?;
        let available = controllers
            .split_ascii_whitespace()
            .collect::<BTreeSet<_>>();
        if REQUIRED_CONTROLLERS
            .iter()
            .any(|required| !available.contains(required))
        {
            return Err("CONTROLLERS_UNAVAILABLE".into());
        }
        let subtree_path = config.cgroup_root.join("cgroup.subtree_control");
        let subtree = fs::read_to_string(&subtree_path).map_err(|_| "DELEGATION_UNAVAILABLE")?;
        let extras = subtree
            .split_ascii_whitespace()
            .map(|value| value.trim_start_matches('+'))
            .filter(|value| !REQUIRED_CONTROLLERS.contains(value))
            .collect::<Vec<_>>();
        if !extras.is_empty() {
            write_control(
                &subtree_path,
                &extras
                    .iter()
                    .map(|value| format!("-{value}"))
                    .collect::<Vec<_>>()
                    .join(" "),
            )
            .map_err(|_| "DELEGATION_NORMALIZATION_FAILED")?;
        }
        let subtree = fs::read_to_string(&subtree_path).map_err(|_| "DELEGATION_UNAVAILABLE")?;
        require_controllers(
            &subtree
                .split_ascii_whitespace()
                .map(|value| value.trim_start_matches('+'))
                .collect::<Vec<_>>()
                .join(" "),
        )
        .map_err(str::to_owned)?;

        let invocation = config.cgroup_root.join(&config.invocation_name);
        validate_cgroup_directory(&invocation, config.supervisor_host_uid)?;
        let invocation_metadata =
            fs::symlink_metadata(&invocation).map_err(|_| "CGROUP_IDENTITY_INVALID")?;
        if invocation_metadata.mode() & 0o7777 != 0o700 {
            return Err("CGROUP_IDENTITY_INVALID".into());
        }
        let actual_cpu_max = fs::read_to_string(invocation.join("cpu.max"))
            .map_err(|_| "CGROUP_READBACK_FAILED")?
            .trim()
            .to_owned();
        let actual_memory_max =
            read_u64(&invocation.join("memory.max")).map_err(|_| "CGROUP_READBACK_FAILED")?;
        let actual_pids_max =
            read_u64(&invocation.join("pids.max")).map_err(|_| "CGROUP_READBACK_FAILED")?;
        if actual_cpu_max != cpu_max(config.cpu_quota_us, config.cpu_period_us)
            || actual_memory_max != config.memory_max_bytes
            || actual_pids_max != config.pids_max
        {
            return Err("CGROUP_SETTINGS_MISMATCH".into());
        }
        if read_u64(&invocation.join("pids.current")).map_err(|_| "COUNTER_READ_FAILED")? != 0
            || cgroup_populated(&invocation)?
        {
            return Err("CGROUP_NOT_EMPTY".into());
        }
        let baseline_cpu =
            parse_key_values(&invocation.join("cpu.stat")).map_err(|_| "COUNTER_READ_FAILED")?;
        let baseline_memory = parse_key_values(&invocation.join("memory.events"))
            .map_err(|_| "COUNTER_READ_FAILED")?;
        let baseline_pids =
            parse_key_values(&invocation.join("pids.events")).map_err(|_| "COUNTER_READ_FAILED")?;

        create_ready_marker(config)?;
        let ready_at = Instant::now();
        let deadline = Duration::from_millis(config.deadline_ms);
        let mut started = None;
        let mut observed_populated = false;
        let mut timed_out = false;
        let mut cancellation_won = false;
        let completion = loop {
            if cgroup_populated(&invocation)? {
                observed_populated = true;
                started.get_or_insert_with(Instant::now);
            }
            if monitor_cancellation_requested(config)? {
                if !observed_populated {
                    return Err("CANCELLED_BEFORE_GUEST".into());
                }
                cancellation_won = true;
                monitor_mandatory_kill(&invocation)?;
                break None;
            }
            if let Some(status) = monitor_completion(config)? {
                if !observed_populated {
                    return Err("POPULATED_STATE_NOT_OBSERVED".into());
                }
                break Some(status);
            }
            if started.is_some_and(|started| started.elapsed() >= deadline) {
                timed_out = true;
                monitor_mandatory_kill(&invocation)?;
                break None;
            }
            if !observed_populated && ready_at.elapsed() >= Duration::from_secs(30) {
                return Err("GUEST_NOT_OBSERVED".into());
            }
            thread::sleep(Duration::from_millis(2));
        };

        wait_recursive_empty(&invocation, Duration::from_secs(5))?;
        validate_no_process_children()?;
        let (stdout, stdout_truncated, stdout_original_length) = if completion.is_some() {
            read_bounded_output(
                &config.stdout_path,
                config.supervisor_host_uid,
                config.stdout_max,
            )?
        } else {
            (Vec::new(), false, 0)
        };
        let (stderr, stderr_truncated, _) = if completion.is_some() {
            read_bounded_output(
                &config.stderr_path,
                config.supervisor_host_uid,
                config.stderr_max,
            )?
        } else {
            (Vec::new(), false, 0)
        };
        let final_cpu =
            parse_key_values(&invocation.join("cpu.stat")).map_err(|_| "COUNTER_READ_FAILED")?;
        let final_memory = parse_key_values(&invocation.join("memory.events"))
            .map_err(|_| "COUNTER_READ_FAILED")?;
        let final_pids =
            parse_key_values(&invocation.join("pids.events")).map_err(|_| "COUNTER_READ_FAILED")?;
        let pids_peak =
            read_u64(&invocation.join("pids.peak")).map_err(|_| "COUNTER_READ_FAILED")?;
        let memory_peak =
            read_u64(&invocation.join("memory.peak")).map_err(|_| "COUNTER_READ_FAILED")?;
        let elapsed_ns: u64 = started
            .ok_or("GUEST_NOT_OBSERVED")?
            .elapsed()
            .as_nanos()
            .try_into()
            .map_err(|_| "COUNTER_OVERFLOW")?;
        let cpu_before = baseline_cpu
            .get("usage_usec")
            .copied()
            .ok_or("COUNTER_READ_FAILED")?;
        let cpu_after = final_cpu
            .get("usage_usec")
            .copied()
            .ok_or("COUNTER_READ_FAILED")?;
        if cpu_after < cpu_before {
            return Err("COUNTER_REGRESSION".into());
        }
        let (exit_code, signal) = match completion {
            Some(CompletionStatus { exit_code, signal }) => (
                exit_code.map_or("null".to_owned(), |value| value.to_string()),
                signal.map_or("null".to_owned(), |value| format!("\"SIG{value}\"")),
            ),
            None => ("null".to_owned(), "\"SIG9\"".to_owned()),
        };
        let cgroup_kill_used = timed_out || cancellation_won;
        let actual_cgroup_path = invocation.to_str().ok_or("CGROUP_PATH_INVALID")?.to_owned();
        if fs::read_dir(&invocation)
            .map_err(|_| "CGROUP_REMOVE_FAILED")?
            .filter_map(Result::ok)
            .any(|entry| entry.file_type().map(|kind| kind.is_dir()).unwrap_or(true))
        {
            return Err("FOREIGN_CGROUP_CHILD".into());
        }

        Ok(format!(
            concat!(
                "{{\"schemaVersion\":\"cowards-native-supervisor-receipt-v1\",",
                "\"requestSha256\":\"{}\",\"processGroupIdentitySha256\":\"{}\",",
                "\"actualCgroupPath\":\"{}\",\"cpuMax\":\"{}\",",
                "\"memoryMaxBytes\":{},\"pidsMax\":{},",
                "\"guestNamespaceUid\":{},\"supervisorHostUid\":{},",
                "\"wallElapsedNanoseconds\":{},\"cpuUsageBeforeMicroseconds\":{},",
                "\"cpuUsageAfterMicroseconds\":{},\"memoryPeakBytes\":{},",
                "\"memoryEventsBefore\":{},\"memoryEventsAfter\":{},",
                "\"pidsEventsBefore\":{},\"pidsEventsAfter\":{},\"pidsPeak\":{},",
                "\"exitCode\":{},\"signal\":{},\"timedOut\":{},",
                "\"cancellationRequested\":{},\"cgroupKillUsed\":{},",
                "\"stdoutBase64\":\"{}\",\"stderrBase64\":\"{}\",",
                "\"stdoutTruncated\":{},\"stderrTruncated\":{},",
                "\"payloadTruncated\":{},\"cgroupEmpty\":true,",
                "\"cleanupComplete\":false}}"
            ),
            json_escape(&config.request_sha256),
            json_escape(&config.process_group_sha256),
            json_escape(&actual_cgroup_path),
            json_escape(&actual_cpu_max),
            actual_memory_max,
            actual_pids_max,
            config.guest_host_uid,
            config.supervisor_host_uid,
            elapsed_ns,
            cpu_before,
            cpu_after,
            memory_peak,
            json_map(&baseline_memory),
            json_map(&final_memory),
            json_map(&baseline_pids),
            json_map(&final_pids),
            pids_peak,
            exit_code,
            signal,
            timed_out,
            cancellation_won,
            cgroup_kill_used,
            base64(&stdout),
            base64(&stderr),
            stdout_truncated,
            stderr_truncated,
            stdout_original_length > config.payload_max,
        ))
    }

    fn force_monitor_cleanup(config: &MonitorConfig) -> Result<(), String> {
        let invocation = config.cgroup_root.join(&config.invocation_name);
        if !invocation.exists() {
            return Ok(());
        }
        monitor_mandatory_kill(&invocation)?;
        wait_recursive_empty(&invocation, Duration::from_secs(5))?;
        Ok(())
    }

    fn monitor(config: MonitorConfig) -> Result<String, String> {
        match monitor_inner(&config) {
            Ok(receipt) => Ok(receipt),
            Err(code) => match force_monitor_cleanup(&config) {
                Ok(()) => Err(code),
                Err(cleanup) => Err(format!("{code}:{cleanup}")),
            },
        }
    }

    #[allow(unused_variables)]
    fn run(config: Config) -> Result<String, String> {
        // The legacy in-process namespace launcher maps the guest namespace UID
        // onto the supervisor's kernel UID. It remains parseable only for
        // compatibility diagnostics and can never produce counted evidence.
        return Err("LEGACY_RUN_MODE_NOT_COUNTED".into());
        #[allow(unreachable_code)]
        {
            let controllers = fs::read_to_string(config.cgroup_root.join("cgroup.controllers"))
                .map_err(|_| "CONTROLLERS_UNAVAILABLE")?;
            let available = controllers
                .split_ascii_whitespace()
                .collect::<BTreeSet<_>>();
            if REQUIRED_CONTROLLERS
                .iter()
                .any(|required| !available.contains(required))
            {
                return Err("CONTROLLERS_UNAVAILABLE".into());
            }
            let subtree_control = config.cgroup_root.join("cgroup.subtree_control");
            let delegated =
                fs::read_to_string(&subtree_control).map_err(|_| "DELEGATION_UNAVAILABLE")?;
            let extra_controllers = delegated
                .split_ascii_whitespace()
                .map(|value| value.trim_start_matches('+'))
                .filter(|value| !REQUIRED_CONTROLLERS.contains(value))
                .collect::<Vec<_>>();
            if !extra_controllers.is_empty() {
                let disable = extra_controllers
                    .iter()
                    .map(|value| format!("-{value}"))
                    .collect::<Vec<_>>()
                    .join(" ");
                write_control(&subtree_control, &disable)
                    .map_err(|_| "DELEGATION_NORMALIZATION_FAILED")?;
            }
            let enabled = fs::read_to_string(&subtree_control)
                .map_err(|_| "DELEGATION_UNAVAILABLE")?
                .split_ascii_whitespace()
                .map(|value| value.trim_start_matches('+'))
                .collect::<Vec<_>>()
                .join(" ");
            require_controllers(&enabled).map_err(str::to_owned)?;

            let invocation = config
                .cgroup_root
                .join(format!("invocation-{}", config.nonce));
            fs::create_dir(&invocation).map_err(|_| "CGROUP_CREATE_FAILED")?;
            fs::set_permissions(&invocation, fs::Permissions::from_mode(0o700))
                .map_err(|_| "CGROUP_MODE_FAILED")?;
            let result = (|| -> Result<String, String> {
                write_control(
                    &invocation.join("cpu.max"),
                    &cpu_max(config.cpu_quota_us, config.cpu_period_us),
                )
                .map_err(|_| "CGROUP_WRITE_FAILED")?;
                write_control(
                    &invocation.join("memory.max"),
                    &config.memory_max_bytes.to_string(),
                )
                .map_err(|_| "CGROUP_WRITE_FAILED")?;
                write_control(&invocation.join("pids.max"), &config.pids_max.to_string())
                    .map_err(|_| "CGROUP_WRITE_FAILED")?;
                if invocation.join("memory.oom.group").exists() {
                    write_control(&invocation.join("memory.oom.group"), "1")
                        .map_err(|_| "CGROUP_WRITE_FAILED")?;
                }
                let actual_cpu_max = fs::read_to_string(invocation.join("cpu.max"))
                    .map_err(|_| "CGROUP_READBACK_FAILED")?
                    .trim()
                    .to_owned();
                let actual_memory_max = fs::read_to_string(invocation.join("memory.max"))
                    .map_err(|_| "CGROUP_READBACK_FAILED")?
                    .trim()
                    .parse::<u64>()
                    .map_err(|_| "CGROUP_READBACK_FAILED")?;
                let actual_pids_max = fs::read_to_string(invocation.join("pids.max"))
                    .map_err(|_| "CGROUP_READBACK_FAILED")?
                    .trim()
                    .parse::<u64>()
                    .map_err(|_| "CGROUP_READBACK_FAILED")?;
                if actual_cpu_max != cpu_max(config.cpu_quota_us, config.cpu_period_us)
                    || actual_memory_max != config.memory_max_bytes
                    || actual_pids_max != config.pids_max
                {
                    return Err("CGROUP_SETTINGS_MISMATCH".into());
                }

                let baseline_cpu = parse_key_values(&invocation.join("cpu.stat"))
                    .map_err(|_| "COUNTER_READ_FAILED")?;
                let baseline_memory = parse_key_values(&invocation.join("memory.events"))
                    .map_err(|_| "COUNTER_READ_FAILED")?;
                let baseline_pids = parse_key_values(&invocation.join("pids.events"))
                    .map_err(|_| "COUNTER_READ_FAILED")?;
                if read_u64(&invocation.join("pids.current")).map_err(|_| "COUNTER_READ_FAILED")?
                    != 0
                {
                    return Err("CGROUP_NOT_EMPTY".into());
                }

                let input = fs::read(&config.input_path).map_err(|_| "INPUT_READ_FAILED")?;
                if cancellation_requested(&config)? {
                    return Err("CANCELLED_BEFORE_LAUNCH".into());
                }
                let executable = PathBuf::from(&config.command[0]);
                let mut executable_file = OpenOptions::new()
                    .read(true)
                    .custom_flags(O_NOFOLLOW)
                    .open(&executable)
                    .map_err(|_| "EXECUTABLE_OPEN_FAILED")?;
                let mut executable_bytes = Vec::new();
                executable_file
                    .read_to_end(&mut executable_bytes)
                    .map_err(|_| "EXECUTABLE_READ_FAILED")?;
                if format!("sha256:{}", sha256_hex(&executable_bytes))
                    != config.expected_executable_sha256
                {
                    return Err("EXECUTABLE_IDENTITY_MISMATCH".into());
                }
                let executable_fd = executable_file.as_raw_fd();
                let cgroup_procs = OpenOptions::new()
                    .write(true)
                    .custom_flags(0)
                    .open(invocation.join("cgroup.procs"))
                    .map_err(|_| "DELEGATION_UNAVAILABLE")?;
                let cgroup_fd = cgroup_procs.as_raw_fd();
                let delegated_root = config.cgroup_root.clone();
                let guest_uid = config.guest_namespace_uid;
                let preexec_executable = executable.clone();
                let mut command = Command::new(format!("/proc/self/fd/{executable_fd}"));
                command
                    .arg0(&config.command[0])
                    .args(&config.command[1..])
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .env_clear()
                    .envs(config.environment.iter().cloned());
                if unsafe { prctl(PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0) } != 0 {
                    return Err("SUBREAPER_UNAVAILABLE".into());
                }
                unsafe {
                    command.pre_exec(move || {
                        if libc_setsid() < 0 {
                            return Err(io::Error::last_os_error());
                        }
                        enter_guest_namespace(
                            cgroup_fd,
                            &delegated_root,
                            guest_uid,
                            &preexec_executable,
                        )
                    });
                }
                let started = Instant::now();
                let mut child = command
                    .spawn()
                    .map_err(|error| format!("CHILD_LAUNCH_FAILED:{error}"))?;
                drop(executable_file);
                drop(cgroup_procs);
                child
                    .stdin
                    .take()
                    .ok_or("CHILD_STDIN_FAILED")?
                    .write_all(&input)
                    .map_err(|_| "CHILD_STDIN_FAILED")?;
                let stdout = child.stdout.take().ok_or("CHILD_STDOUT_FAILED")?;
                let stderr = child.stderr.take().ok_or("CHILD_STDERR_FAILED")?;
                let stdout_max = config.stdout_max;
                let stderr_max = config.stderr_max;
                let stdout_reader = thread::spawn(move || read_limited(stdout, stdout_max));
                let stderr_reader = thread::spawn(move || read_limited(stderr, stderr_max));
                let deadline = Duration::from_millis(config.deadline_ms);
                let mut timed_out = false;
                let mut cancellation_won = false;
                let mut cgroup_kill_used = false;
                let status = loop {
                    if let Some(status) = child.try_wait().map_err(|_| "CHILD_WAIT_FAILED")? {
                        if cancellation_requested(&config)? {
                            return Err("CANCELLATION_RACE_AMBIGUOUS".into());
                        }
                        break status;
                    }
                    let requested = cancellation_requested(&config)?;
                    if requested || started.elapsed() >= deadline {
                        timed_out = !requested;
                        cancellation_won = requested;
                        mandatory_kill(child.id(), &invocation)?;
                        cgroup_kill_used = true;
                        break child.wait().map_err(|_| "CHILD_WAIT_FAILED")?;
                    }
                    thread::sleep(Duration::from_millis(2));
                };
                if wait_cgroup_empty(&invocation, Duration::from_secs(1)).is_err() {
                    mandatory_kill(child.id(), &invocation)?;
                    wait_cgroup_empty(&invocation, Duration::from_secs(2))?;
                    reap_adopted_children()?;
                    return Err("LINGERING_DESCENDANT".into());
                }
                reap_adopted_children()?;
                let (stdout, stdout_truncated) = stdout_reader
                    .join()
                    .map_err(|_| "STDOUT_READER_FAILED")?
                    .map_err(|_| "STDOUT_READER_FAILED")?;
                let (stderr, stderr_truncated) = stderr_reader
                    .join()
                    .map_err(|_| "STDERR_READER_FAILED")?
                    .map_err(|_| "STDERR_READER_FAILED")?;

                let final_cpu = parse_key_values(&invocation.join("cpu.stat"))
                    .map_err(|_| "COUNTER_READ_FAILED")?;
                let final_memory = parse_key_values(&invocation.join("memory.events"))
                    .map_err(|_| "COUNTER_READ_FAILED")?;
                let final_pids = parse_key_values(&invocation.join("pids.events"))
                    .map_err(|_| "COUNTER_READ_FAILED")?;
                let pids_peak =
                    read_u64(&invocation.join("pids.peak")).map_err(|_| "COUNTER_READ_FAILED")?;
                let memory_peak =
                    read_u64(&invocation.join("memory.peak")).map_err(|_| "COUNTER_READ_FAILED")?;
                let elapsed_ns: u64 = started
                    .elapsed()
                    .as_nanos()
                    .try_into()
                    .map_err(|_| "COUNTER_OVERFLOW")?;
                let payload_truncated = stdout.len() > config.payload_max;
                let exit_code = status
                    .code()
                    .map_or("null".to_owned(), |value| value.to_string());
                let signal = status
                    .signal()
                    .map_or("null".to_owned(), |value| format!("\"SIG{value}\""));
                let cpu_before = baseline_cpu
                    .get("usage_usec")
                    .copied()
                    .ok_or("COUNTER_READ_FAILED")?;
                let cpu_after = final_cpu
                    .get("usage_usec")
                    .copied()
                    .ok_or("COUNTER_READ_FAILED")?;
                Ok(format!(
                    concat!(
                        "{{\"schemaVersion\":\"cowards-native-supervisor-receipt-v1\",",
                        "\"requestSha256\":\"{}\",\"processGroupIdentitySha256\":\"{}\",",
                        "\"actualCgroupPath\":\"{}\",\"cpuMax\":\"{}\",",
                        "\"memoryMaxBytes\":{},\"pidsMax\":{},",
                        "\"guestNamespaceUid\":{},\"supervisorHostUid\":{},",
                        "\"wallElapsedNanoseconds\":{},\"cpuUsageBeforeMicroseconds\":{},",
                        "\"cpuUsageAfterMicroseconds\":{},\"memoryPeakBytes\":{},",
                        "\"memoryEventsBefore\":{},\"memoryEventsAfter\":{},",
                        "\"pidsEventsBefore\":{},\"pidsEventsAfter\":{},\"pidsPeak\":{},",
                        "\"exitCode\":{},\"signal\":{},\"timedOut\":{},",
                        "\"cancellationRequested\":{},\"cgroupKillUsed\":{},",
                        "\"stdoutBase64\":\"{}\",\"stderrBase64\":\"{}\",",
                        "\"stdoutTruncated\":{},\"stderrTruncated\":{},",
                        "\"payloadTruncated\":{},\"cgroupEmpty\":true,",
                        "\"cleanupComplete\":true}}"
                    ),
                    json_escape(&config.request_sha256),
                    json_escape(&config.process_group_sha256),
                    json_escape(invocation.to_str().ok_or("CGROUP_PATH_INVALID")?,),
                    json_escape(&actual_cpu_max),
                    actual_memory_max,
                    actual_pids_max,
                    config.guest_namespace_uid,
                    unsafe { getuid() },
                    elapsed_ns,
                    cpu_before,
                    cpu_after,
                    memory_peak,
                    json_map(&baseline_memory),
                    json_map(&final_memory),
                    json_map(&baseline_pids),
                    json_map(&final_pids),
                    pids_peak,
                    exit_code,
                    signal,
                    timed_out,
                    cancellation_won,
                    cgroup_kill_used,
                    base64(&stdout),
                    base64(&stderr),
                    stdout_truncated,
                    stderr_truncated,
                    payload_truncated,
                ))
            })();
            match result {
                Ok(receipt) => {
                    cleanup_invocation(&invocation)?;
                    Ok(receipt)
                }
                Err(code) => match cleanup_invocation(&invocation) {
                    Ok(()) => Err(code),
                    Err(cleanup) => Err(format!("{code}:{cleanup}")),
                },
            }
        }
    }

    unsafe extern "C" {
        #[link_name = "setsid"]
        fn libc_setsid() -> c_int;
    }

    fn json_map(values: &BTreeMap<String, u64>) -> String {
        format!(
            "{{{}}}",
            values
                .iter()
                .map(|(key, value)| format!("\"{}\":{}", json_escape(key), value))
                .collect::<Vec<_>>()
                .join(",")
        )
    }

    pub fn main_linux() {
        let mode = env::args().nth(1);
        let result = match mode.as_deref() {
            Some("monitor") => MonitorConfig::parse().and_then(monitor),
            Some("run") => Config::parse().and_then(run),
            _ => Err("USAGE".into()),
        };
        match result {
            Ok(receipt) => println!("{receipt}"),
            Err(code) => {
                eprintln!("cowards-runtime-supervisor:{code}");
                std::process::exit(70);
            }
        }
    }

    #[cfg(test)]
    mod monitor_tests {
        use super::*;

        fn arguments() -> Vec<String> {
            [
                "monitor",
                "--cgroup-root",
                "/run/cowards-cgroup",
                "--invocation-name",
                "invocation-certification-nonce-00000000000000000001",
                "--control-root",
                "/run/cowards-control",
                "--nonce",
                "certification-nonce-00000000000000000001",
                "--cpu-quota-us",
                "50000",
                "--cpu-period-us",
                "100000",
                "--memory-max-bytes",
                "33554432",
                "--pids-max",
                "16",
                "--supervisor-host-uid",
                "65532",
                "--guest-host-uid",
                "65534",
                "--deadline-ms",
                "2000",
                "--stdout-max",
                "16384",
                "--stderr-max",
                "4096",
                "--payload-max",
                "16384",
                "--request-sha256",
                "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "--process-group-sha256",
                "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                "--cancellation-path",
                "/run/cowards-control/cancel",
                "--cancellation-nonce",
                "certification-cancel-nonce-00000000000001",
                "--completion-path",
                "/run/cowards-control/completion",
                "--ready-path",
                "/run/cowards-control/ready",
                "--stdout-path",
                "/run/cowards-control/stdout",
                "--stderr-path",
                "/run/cowards-control/stderr",
            ]
            .into_iter()
            .map(str::to_owned)
            .collect()
        }

        fn replace(arguments: &mut [String], name: &str, value: &str) {
            let index = arguments
                .iter()
                .position(|argument| argument == name)
                .expect("argument");
            arguments[index + 1] = value.to_owned();
        }

        #[test]
        fn parses_exact_daemon_monitor_contract() {
            let config = MonitorConfig::parse_from(arguments()).expect("valid monitor arguments");
            assert_eq!(config.supervisor_host_uid, SUPERVISOR_HOST_UID);
            assert_eq!(config.guest_host_uid, GUEST_HOST_UID);
            assert_ne!(config.supervisor_host_uid, config.guest_host_uid);
            assert_eq!(
                config.cgroup_root.join(&config.invocation_name),
                PathBuf::from(
                    "/run/cowards-cgroup/invocation-certification-nonce-00000000000000000001"
                )
            );
        }

        #[test]
        fn rejects_same_kernel_uid_and_control_path_substitution() {
            let mut same_uid = arguments();
            replace(&mut same_uid, "--guest-host-uid", "65532");
            assert_eq!(
                MonitorConfig::parse_from(same_uid).unwrap_err(),
                "INVALID_LIMIT_OR_IDENTITY"
            );

            let mut escaped = arguments();
            replace(
                &mut escaped,
                "--completion-path",
                "/run/guest-visible/completion",
            );
            assert_eq!(
                MonitorConfig::parse_from(escaped).unwrap_err(),
                "CONTROL_PATH_INVALID"
            );
        }

        #[test]
        fn rejects_unknown_duplicate_and_unbound_invocation_arguments() {
            let mut duplicate = arguments();
            duplicate.extend(["--deadline-ms".to_owned(), "3000".to_owned()]);
            assert_eq!(
                MonitorConfig::parse_from(duplicate).unwrap_err(),
                "DUPLICATE_ARGUMENT"
            );

            let mut unknown = arguments();
            unknown.extend(["--extra".to_owned(), "value".to_owned()]);
            assert_eq!(
                MonitorConfig::parse_from(unknown).unwrap_err(),
                "UNKNOWN_ARGUMENT"
            );

            let mut unbound = arguments();
            replace(&mut unbound, "--invocation-name", "invocation-other");
            assert_eq!(
                MonitorConfig::parse_from(unbound).unwrap_err(),
                "INVALID_LIMIT_OR_IDENTITY"
            );
        }
    }
}

fn main() {
    #[cfg(target_os = "linux")]
    linux::main_linux();
    #[cfg(not(target_os = "linux"))]
    {
        eprintln!("cowards-runtime-supervisor:{}", platform_status());
        std::process::exit(78);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_bounded_path_safe_nonces() {
        assert!(validate_nonce("nonce-0123456789abcdef01234567").is_ok());
        for invalid in [
            "",
            "short",
            "../escape-0123456789abcdef01234567",
            "slash/escape-0123456789abcdef01234567",
            "nul\0nonce-0123456789abcdef01234567",
        ] {
            assert!(validate_nonce(invalid).is_err(), "{invalid:?}");
        }
    }

    #[test]
    fn requires_exact_cpu_memory_and_pids_controller_set() {
        assert!(require_controllers("cpu memory pids").is_ok());
        assert!(require_controllers("memory pids cpu").is_ok());
        for invalid in [
            "",
            "cpu memory",
            "cpu memory pids io",
            "cpu memory memory pids",
        ] {
            assert!(require_controllers(invalid).is_err(), "{invalid:?}");
        }
    }

    #[test]
    fn renders_exact_cpu_max_setting() {
        assert_eq!(cpu_max(50_000, 100_000), "50000 100000");
    }

    #[test]
    fn escapes_receipt_json_without_host_text_injection() {
        assert_eq!(
            json_escape("line\nquote\"slash\\control\u{0001}"),
            "line\\nquote\\\"slash\\\\control\\u0001"
        );
    }

    #[test]
    fn base64_is_canonical() {
        assert_eq!(base64(b""), "");
        assert_eq!(base64(b"f"), "Zg==");
        assert_eq!(base64(b"fo"), "Zm8=");
        assert_eq!(base64(b"foo"), "Zm9v");
    }

    #[test]
    fn sha256_matches_the_empty_and_abc_vectors() {
        assert_eq!(
            sha256_hex(b""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        assert_eq!(
            sha256_hex(b"abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    #[test]
    fn validates_exact_sha256_identity_shape() {
        assert!(
            validate_sha256_identity(
                "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            )
            .is_ok()
        );
        for invalid in [
            "",
            "sha256:abc",
            "sha256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "sha512:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        ] {
            assert!(validate_sha256_identity(invalid).is_err(), "{invalid}");
        }
    }

    #[test]
    fn parses_nonce_bound_exact_completion_status() {
        let nonce = "certification-nonce-00000000000000000001";
        assert_eq!(
            parse_completion_status(&format!("nonce={nonce}\nexit-code=0\nsignal=null\n"), nonce),
            Ok(CompletionStatus {
                exit_code: Some(0),
                signal: None,
            })
        );
        assert_eq!(
            parse_completion_status(&format!("nonce={nonce}\nexit-code=null\nsignal=9\n"), nonce),
            Ok(CompletionStatus {
                exit_code: None,
                signal: Some(9),
            })
        );
        for invalid in [
            format!("nonce={nonce}\nexit-code=null\nsignal=null\n"),
            format!("nonce={nonce}\nexit-code=0\nsignal=9\n"),
            format!("nonce=other\nexit-code=0\nsignal=null\n"),
            format!("nonce={nonce}\nexit-code=0\nsignal=null"),
        ] {
            assert_eq!(
                parse_completion_status(&invalid, nonce),
                Err("COMPLETION_INVALID")
            );
        }
    }

    #[test]
    fn counted_platform_is_linux_only() {
        #[cfg(target_os = "linux")]
        assert_eq!(platform_status(), "linux-cgroup-v2");
        #[cfg(not(target_os = "linux"))]
        assert_eq!(platform_status(), "unsupported-before-launch");
    }
}

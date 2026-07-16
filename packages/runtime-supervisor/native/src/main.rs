use std::collections::BTreeSet;

const REQUIRED_CONTROLLERS: [&str; 3] = ["cpu", "memory", "pids"];

fn validate_nonce(_value: &str) -> Result<(), &'static str> {
    Err("NOT_IMPLEMENTED")
}

fn require_controllers(_value: &str) -> Result<(), &'static str> {
    Err("NOT_IMPLEMENTED")
}

fn cpu_max(_quota: u64, _period: u64) -> String {
    String::new()
}

fn json_escape(_value: &str) -> String {
    String::new()
}

fn platform_status() -> &'static str {
    "NOT_IMPLEMENTED"
}

fn main() {
    eprintln!("cowards-runtime-supervisor: NOT_IMPLEMENTED");
    std::process::exit(78);
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
    fn counted_platform_is_linux_only() {
        #[cfg(target_os = "linux")]
        assert_eq!(platform_status(), "linux-cgroup-v2");
        #[cfg(not(target_os = "linux"))]
        assert_eq!(platform_status(), "unsupported-before-launch");
    }
}

export const FOUR_LANGUAGE_GOLDEN_CORPUS_VERSION =
  "four-language-golden-corpus-v1.32" as const

export const fourLanguagePrivateMarkers = {
  strategyMemory: "V132_PRIVATE_STRATEGY_MEMORY",
  soldierMemory: "V132_PRIVATE_SOLDIER_MEMORY",
  objective: "V132_PRIVATE_OBJECTIVE",
} as const

export type FourLanguageGoldenLanguageId =
  | "typescript"
  | "python"
  | "rust"
  | "zig"

export interface FourLanguageGoldenStrategySource {
  languageId: FourLanguageGoldenLanguageId
  providerId: string
  runtimeTarget: "runtime-js" | "runtime-python" | "runtime-wasm-wasi"
  behavior: "first-active-turn-to-stone"
  source: string
}

export const fourLanguageGoldenSources = [
  {
    languageId: "typescript",
    providerId: "strategy-language-provider-js-ts",
    runtimeTarget: "runtime-js",
    behavior: "first-active-turn-to-stone",
    source: `
export default {
  selectActivations(input) {
    const firstActive = input.mySoldiers.find((soldier) => soldier.status === "ACTIVE")
    return {
      activationOrders: firstActive
        ? [{
            soldierId: firstActive.id,
            objective: { marker: "${fourLanguagePrivateMarkers.objective}", stance: "stone" },
          }]
        : [],
      strategyMemory: { marker: "${fourLanguagePrivateMarkers.strategyMemory}" },
    }
  },
  soldierBrain() {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: { marker: "${fourLanguagePrivateMarkers.soldierMemory}" },
    }
  },
}
`,
  },
  {
    languageId: "python",
    providerId: "strategy-language-provider-python",
    runtimeTarget: "runtime-python",
    behavior: "first-active-turn-to-stone",
    source: `
def select_activations(input):
    first_active = None
    for soldier in input["mySoldiers"]:
        if soldier["status"] == "ACTIVE":
            first_active = soldier
            break
    return {
        "activationOrders": (
            [{
                "soldierId": first_active["id"],
                "objective": {"marker": "${fourLanguagePrivateMarkers.objective}", "stance": "stone"},
            }]
            if first_active
            else []
        ),
        "strategyMemory": {"marker": "${fourLanguagePrivateMarkers.strategyMemory}"},
    }


def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": {"marker": "${fourLanguagePrivateMarkers.soldierMemory}"},
    }
`,
  },
  {
    languageId: "rust",
    providerId: "strategy-language-provider-rust-wasi",
    runtimeTarget: "runtime-wasm-wasi",
    behavior: "first-active-turn-to-stone",
    source: `
use std::io::{self, Read};

fn find_substring(haystack: &str, needle: &str) -> Option<usize> {
    haystack.find(needle)
}

fn first_active_soldier_id(input: &str) -> Option<&str> {
    let soldiers_start = find_substring(input, "\\"mySoldiers\\":[")?;
    let mut cursor = &input[soldiers_start..];
    loop {
        let id_start = find_substring(cursor, "\\"id\\":\\"")? + "\\"id\\":\\"".len();
        let after_id = &cursor[id_start..];
        let id_end = after_id.find('"')?;
        let soldier_id = &after_id[..id_end];
        let after_record_start = &after_id[id_end..];
        let next_id = after_record_start
            .find("\\"id\\":\\"")
            .unwrap_or(after_record_start.len());
        let record = &after_record_start[..next_id];
        if record.contains("\\"status\\":\\"ACTIVE\\"") {
            return Some(soldier_id);
        }
        if next_id == after_record_start.len() {
            return None;
        }
        cursor = &after_record_start[next_id..];
    }
}

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":{{"marker":"${fourLanguagePrivateMarkers.soldierMemory}"}}}}}}"#);
    } else if let Some(soldier_id) = first_active_soldier_id(&input) {
        println!(
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"marker":"${fourLanguagePrivateMarkers.objective}","stance":"stone"}}}}],"strategyMemory":{{"marker":"${fourLanguagePrivateMarkers.strategyMemory}"}}}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":{{"marker":"${fourLanguagePrivateMarkers.strategyMemory}"}}}}}}"#);
    }
}
`,
  },
  {
    languageId: "zig",
    providerId: "strategy-language-provider-zig-wasi",
    runtimeTarget: "runtime-wasm-wasi",
    behavior: "first-active-turn-to-stone",
    source: `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn indexOf(haystack: []const u8, needle: []const u8) ?usize {
    if (needle.len == 0) return 0;
    if (haystack.len < needle.len) return null;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return index;
    }
    return null;
}

fn indexOfByte(haystack: []const u8, needle: u8) ?usize {
    var index: usize = 0;
    while (index < haystack.len) : (index += 1) {
        if (haystack[index] == needle) return index;
    }
    return null;
}

fn firstActiveSoldierId(input: []const u8) ?[]const u8 {
    const soldiers_start = indexOf(input, "\\"mySoldiers\\":[") orelse return null;
    var cursor = input[soldiers_start..];
    const id_needle = "\\"id\\":\\"";
    const active_needle = "\\"status\\":\\"ACTIVE\\"";
    while (true) {
        const id_start = (indexOf(cursor, id_needle) orelse return null) + id_needle.len;
        const after_id = cursor[id_start..];
        const id_end = indexOfByte(after_id, '"') orelse return null;
        const after_record_start = after_id[id_end..];
        const next_id = indexOf(after_record_start, id_needle) orelse after_record_start.len;
        const record = after_record_start[0..next_id];
        if (indexOf(record, active_needle) != null) {
            return after_id[0..id_end];
        }
        if (next_id == after_record_start.len) {
            return null;
        }
        cursor = after_record_start[next_id..];
    }
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    const input = input_buf[0..nread];
    if (indexOf(input, "\\"methodName\\":\\"soldierBrain\\"") != null) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":{\\"marker\\":\\"${fourLanguagePrivateMarkers.soldierMemory}\\"}}}\\n");
    } else if (firstActiveSoldierId(input)) |soldier_id| {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[{\\"soldierId\\":\\"");
        writeAll(soldier_id);
        writeAll("\\",\\"objective\\":{\\"marker\\":\\"${fourLanguagePrivateMarkers.objective}\\",\\"stance\\":\\"stone\\"}}],\\"strategyMemory\\":{\\"marker\\":\\"${fourLanguagePrivateMarkers.strategyMemory}\\"}}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":{\\"marker\\":\\"${fourLanguagePrivateMarkers.strategyMemory}\\"}}}\\n");
    }
}
`,
  },
] as const satisfies readonly FourLanguageGoldenStrategySource[]

export const fourLanguageGoldenPairs = fourLanguageGoldenSources.flatMap(
  (bottom) =>
    fourLanguageGoldenSources.map((top) => ({
      bottomLanguageId: bottom.languageId,
      topLanguageId: top.languageId,
      pairId: `${bottom.languageId}-vs-${top.languageId}`,
    })),
)

export const fourLanguageConformanceGateIds = [
  "valid-behavior",
  "invalid-output",
  "timeout",
  "oversized-output",
  "forbidden-capability",
  "memory-heavy-output",
  "deterministic-repeat",
  "runtime-unavailable",
  "malformed-runtime-result",
  "missing-or-stale-artifact",
  "no-silent-fallback",
  "public-result-replay-shape",
  "privacy-parity",
] as const

export type FourLanguageConformanceGateId =
  (typeof fourLanguageConformanceGateIds)[number]

export const fourLanguageConformanceRequirements =
  fourLanguageConformanceGateIds.map((gateId) => ({
    gateId,
    requiredLanguageIds: fourLanguageGoldenSources.map(
      (source) => source.languageId,
    ),
    status: "required" as const,
  }))

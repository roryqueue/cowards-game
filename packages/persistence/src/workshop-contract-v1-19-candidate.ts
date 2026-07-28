/* eslint-disable no-useless-escape */
export type WorkshopContractV119Language =
  | "typescript"
  | "python"
  | "rust"
  | "zig"

export interface WorkshopContractV119Example {
  language: WorkshopContractV119Language
  sourceFormat: WorkshopContractV119Language
  source: string
}

export interface WorkshopContractV119Candidate {
  schemaVersion: "workshop-contract-v1.19-candidate-v1"
  workshopContractVersion: "workshop-contract-v1.19"
  runtimeAbiVersion: string
  lifecycle: {
    status: "inactive-candidate"
    active: boolean
    current: boolean
    activationOwner: "Phase-260-Plan-14"
  }
  semantics: {
    initiative: "kernel-owned-absolute-and-player-relative"
    hasAdvancedThisActivation:
      | "pre-action-activation-slot-scoped-observation"
    observationOnly: boolean
    addsHoldOrEndActivation: boolean
    storedInStrategyOrSoldierMemory: boolean
  }
  examples: WorkshopContractV119Example[]
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const workshopTypeScriptV119CandidateSource = `
export default {
  selectActivations(input) {
    // Initiative facts are kernel-owned observations for this selection call.
    const initiative = {
      initialPlayerId: input.initialInitiativePlayerId,
      mineInitially: input.hasInitialInitiative,
      roundPlayerId: input.roundInitiativePlayerId,
      mineThisRound: input.hasRoundInitiative
    }
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { initiative } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    // This pre-Action value belongs only to the current Activation slot.
    const action = input.hasAdvancedThisActivation
      ? { type: "TURN", direction: input.self.facing ?? "UP" }
      : { type: "MOVE", direction: input.self.facing ?? "UP" }
    return { action, soldierMemory: input.soldierMemory }
  }
}
`.trim()

export const workshopPythonV119CandidateSource = `
def select_activations(input):
    # Initiative facts are kernel-owned observations for this selection call.
    initiative = {
        "initialPlayerId": input["initialInitiativePlayerId"],
        "mineInitially": input["hasInitialInitiative"],
        "roundPlayerId": input["roundInitiativePlayerId"],
        "mineThisRound": input["hasRoundInitiative"],
    }
    active = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    orders = [
        {"soldierId": soldier["id"], "objective": {"initiative": initiative}}
        for soldier in active[: input["activationCount"]]
    ]
    return {"activationOrders": orders, "strategyMemory": input["strategyMemory"]}


def soldier_brain(input):
    # This pre-Action value belongs only to the current Activation slot.
    direction = input["self"]["facing"] or "UP"
    if input["hasAdvancedThisActivation"]:
        action = {"type": "TURN", "direction": direction}
    else:
        action = {"type": "MOVE", "direction": direction}
    return {"action": action, "soldierMemory": input["soldierMemory"]}
`.trim()

export const workshopRustV119CandidateSource = `
use std::io::{self, Read};

fn contains(input: &str, key: &str) -> bool {
    input.contains(key)
}

fn first_active_soldier_id(input: &str) -> Option<&str> {
    let soldiers_start = input.find("\\\"mySoldiers\\\":[")?;
    let soldiers = &input[soldiers_start..];
    let id_start = soldiers.find("\\\"id\\\":\\\"")? + "\\\"id\\\":\\\"".len();
    let after_id = &soldiers[id_start..];
    let id_end = after_id.find('"')?;
    Some(&after_id[..id_end])
}

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if contains(&input, "\\\"methodName\\\":\\\"soldierBrain\\\"") {
        // hasAdvancedThisActivation is pre-Action and scoped to this Activation slot.
        let advanced = contains(&input, "\\\"hasAdvancedThisActivation\\\":true");
        let action = if advanced {
            r#"{"type":"TURN","direction":"UP"}"#
        } else {
            r#"{"type":"MOVE","direction":"UP"}"#
        };
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.19","value":{{"action":{},"soldierMemory":null}}}}"#, action);
        return;
    }

    // All four initiative fields are kernel-owned observations for this call.
    let observations_present = contains(&input, "\\\"initialInitiativePlayerId\\\"")
        && contains(&input, "\\\"hasInitialInitiative\\\"")
        && contains(&input, "\\\"roundInitiativePlayerId\\\"")
        && contains(&input, "\\\"hasRoundInitiative\\\"");
    if observations_present {
        if let Some(soldier_id) = first_active_soldier_id(&input) {
            println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.19","value":{{"activationOrders":[{{"soldierId":"{}"}}],"strategyMemory":null}}}}"#, soldier_id);
            return;
        }
    }
    println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.19","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
}
`.trim()

export const workshopZigV119CandidateSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var offset: usize = 0;
        while (offset < needle.len and haystack[index + offset] == needle[offset]) : (offset += 1) {}
        if (offset == needle.len) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [32768]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    const input = input_buf[0..nread];

    if (contains(input, "\\\"methodName\\\":\\\"soldierBrain\\\"")) {
        // hasAdvancedThisActivation is pre-Action and scoped to this Activation slot.
        if (contains(input, "\\\"hasAdvancedThisActivation\\\":true")) {
            writeAll("{\\\"ok\\\":true,\\\"abiVersion\\\":\\\"strategy-runtime-abi-v1.19\\\",\\\"value\\\":{\\\"action\\\":{\\\"type\\\":\\\"TURN\\\",\\\"direction\\\":\\\"UP\\\"},\\\"soldierMemory\\\":null}}\\n");
        } else {
            writeAll("{\\\"ok\\\":true,\\\"abiVersion\\\":\\\"strategy-runtime-abi-v1.19\\\",\\\"value\\\":{\\\"action\\\":{\\\"type\\\":\\\"MOVE\\\",\\\"direction\\\":\\\"UP\\\"},\\\"soldierMemory\\\":null}}\\n");
        }
        return;
    }

    // All four initiative fields are kernel-owned observations for this call.
    const observations_present = contains(input, "\\\"initialInitiativePlayerId\\\"") and
        contains(input, "\\\"hasInitialInitiative\\\"") and
        contains(input, "\\\"roundInitiativePlayerId\\\"") and
        contains(input, "\\\"hasRoundInitiative\\\"");
    if (observations_present) {
        writeAll("{\\\"ok\\\":true,\\\"abiVersion\\\":\\\"strategy-runtime-abi-v1.19\\\",\\\"value\\\":{\\\"activationOrders\\\":[],\\\"strategyMemory\\\":null}}\\n");
    } else {
        writeAll("{\\\"ok\\\":true,\\\"abiVersion\\\":\\\"strategy-runtime-abi-v1.19\\\",\\\"value\\\":{\\\"activationOrders\\\":[],\\\"strategyMemory\\\":null}}\\n");
    }
}
`.trim()

export const WORKSHOP_CONTRACT_V1_19_CANDIDATE = deepFreeze<WorkshopContractV119Candidate>({
  schemaVersion: "workshop-contract-v1.19-candidate-v1",
  workshopContractVersion: "workshop-contract-v1.19",
  runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  lifecycle: {
    status: "inactive-candidate",
    active: false,
    current: false,
    activationOwner: "Phase-260-Plan-14",
  },
  semantics: {
    initiative: "kernel-owned-absolute-and-player-relative",
    hasAdvancedThisActivation:
      "pre-action-activation-slot-scoped-observation",
    observationOnly: true,
    addsHoldOrEndActivation: false,
    storedInStrategyOrSoldierMemory: false,
  },
  examples: [
    {
      language: "typescript",
      sourceFormat: "typescript",
      source: workshopTypeScriptV119CandidateSource,
    },
    {
      language: "python",
      sourceFormat: "python",
      source: workshopPythonV119CandidateSource,
    },
    {
      language: "rust",
      sourceFormat: "rust",
      source: workshopRustV119CandidateSource,
    },
    {
      language: "zig",
      sourceFormat: "zig",
      source: workshopZigV119CandidateSource,
    },
  ],
})

import { resolveLeanChildCliTerminal } from "../lib/v1-38-lean-child-cli-terminal.js"

const mode = process.argv[2]
const inertAction = async (): Promise<void> => {
  try {
    if (mode === "failure") throw new Error("inert private failure detail")
    if (mode === "known-failure") throw new Error("LEAN_PILOT_HANDSHAKE")
    if (mode === "trusted-import-failure") throw new TypeError("SERIOUS_LEAGUE_CANDIDATE_SUPERVISION")
    if (mode === "resource-failure") throw new TypeError("LEAN_EXPERIMENT_RESOURCE")
    if (mode === "buffer-failure") throw new TypeError("LEAN_EXPERIMENT_BUFFER_CAP")
    if (mode === "unlisted-import-failure") throw new TypeError("SERIOUS_LEAGUE_PRIVATE_DETAIL: /private/path")
    if (mode !== "success") throw new Error("inert private failure detail")
  } finally {
    // Models cleanup completion without constructing a provider or doing work.
    process.send?.("cleanup-complete")
  }
}

void resolveLeanChildCliTerminal(inertAction())

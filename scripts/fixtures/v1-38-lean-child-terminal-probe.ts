import { resolveLeanChildCliTerminal } from "../lib/v1-38-lean-child-cli-terminal.js"

const mode = process.argv[2]
const inertAction = async (): Promise<void> => {
  try {
    if (mode === "failure") throw new Error("inert private failure detail")
    if (mode === "known-failure") throw new Error("LEAN_PILOT_HANDSHAKE")
    if (mode !== "success") throw new Error("inert private failure detail")
  } finally {
    // Models cleanup completion without constructing a provider or doing work.
    process.send?.("cleanup-complete")
  }
}

void resolveLeanChildCliTerminal(inertAction())

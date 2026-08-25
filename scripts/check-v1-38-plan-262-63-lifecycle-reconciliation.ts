#!/usr/bin/env -S pnpm exec tsx
import path from "node:path"
import { fileURLToPath } from "node:url"
import { inspectV138Plan26263Lifecycle } from "./lib/v1-38-plan-262-63-lifecycle-reconciliation.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
if (process.argv.slice(2).join(" ") !== "--check-current") throw new TypeError("V138_262_63_ARGUMENTS_INVALID")
process.stdout.write(`${JSON.stringify(inspectV138Plan26263Lifecycle(root))}\n`)

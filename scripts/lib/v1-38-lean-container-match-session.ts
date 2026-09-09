import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { Worker } from "node:worker_threads"
import type { RuntimeResult } from "@cowards/engine"
import type { StrategyExecutionAdapterV117, StrategyExecutionRequest } from "../../packages/runtime-js/src/adapter.js"
import { createRuntimeGuestExecutionV117, executeStrategyRuntimeAbiV117, observeRuntimeGuestAccountingV117, type RuntimeGuestObservationV117 } from "../../packages/runtime-js/src/abi-bridge.js"
import { consumeCandidateEvidenceFixture } from "../../packages/runtime-js/src/candidate-evidence-fixture.js"
import { CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 } from "../../packages/runtime-js/src/candidate-host-envelope.js"
import { observeCandidateSubprocessV117 } from "../../packages/runtime-js/src/candidate-subprocess-observation.js"
import { containerSubprocessStrategyExecutionAdapterMetadata } from "../../packages/runtime-js/src/container-subprocess-adapter.js"
import { RUNTIME_TIMEOUT_MS } from "../../packages/runtime-js/src/guards.js"
import { WORKER_HARNESS_SOURCE, WORKER_HARNESS_V117_SOURCE, WORKER_SIGNAL_V117 } from "../../packages/runtime-js/src/worker-harness.js"
import { assertWithinByteCap, encodeSubprocessIpcRequest, parseSubprocessIpcResponse, SUBPROCESS_STDERR_BYTES, SUBPROCESS_STDOUT_BYTES, SubprocessSystemFailure } from "../../packages/runtime-js/src/subprocess-ipc.js"

export interface LeanContainerTransportResult { readonly status: number | null; readonly signal: string | null; readonly stdout: Buffer; readonly stderr: Buffer; readonly error?: Error | undefined }
export interface LeanContainerTransportOptions { readonly input?: string | Uint8Array | undefined; readonly timeoutMilliseconds: number; readonly maxBufferBytes: number }
export type LeanContainerMatchTransport = (command: string, args: readonly string[], options: LeanContainerTransportOptions) => LeanContainerTransportResult

export interface LeanContainerPersistentStream {
  exchange(frame: string, options: { readonly timeoutMilliseconds: number; readonly maxBufferBytes: number }): Buffer
  close(timeoutMilliseconds: number): LeanContainerTransportResult
}
export type LeanContainerPersistentStreamFactory = (command: string, args: readonly string[], options: { readonly startupTimeoutMilliseconds: number; readonly maxBufferBytes: number }) => LeanContainerPersistentStream
export interface LeanContainerMatchSessionOptions {
  readonly matchId: string; readonly containerName: string; readonly ownershipLabel: string; readonly image: string
  readonly dockerPath?: string | undefined; readonly transport?: LeanContainerMatchTransport | undefined
  readonly streamFactory?: LeanContainerPersistentStreamFactory | undefined; readonly cleanupTimeoutMilliseconds?: number | undefined
}
export interface LeanContainerSessionCloseResult { readonly cleanupComplete: boolean; readonly orphanedChild: boolean }
export interface LeanContainerMatchSession { readonly matchId: string; readonly containerId: string; readonly adapter: StrategyExecutionAdapterV117; readonly state: "active" | "poisoned" | "closed"; close(): LeanContainerSessionCloseResult }

const INERT_CONTAINER_SOURCE = "process.stdin.resume();setInterval(()=>{},2147483647)"
const DEFAULT_CONTROL_TIMEOUT_MS = 5_000
const DEFAULT_CLEANUP_TIMEOUT_MS = 2_000
const CONTROL_BUFFER_BYTES = 4_096
const STREAM_FRAME_LIMIT_BYTES = 1_048_576
const OWNER_LABEL = "v1.38-lean-owner"

const defaultTransport: LeanContainerMatchTransport = (command, args, options) => {
  const spawned = spawnSync(command, [...args], { env: { PATH: process.env.PATH ?? "" }, input: options.input === undefined ? undefined : Buffer.from(options.input), killSignal: "SIGKILL", maxBuffer: options.maxBufferBytes, shell: false, stdio: ["pipe", "pipe", "pipe"], timeout: options.timeoutMilliseconds, windowsHide: true })
  return { status: spawned.status, signal: spawned.signal, stdout: Buffer.isBuffer(spawned.stdout) ? spawned.stdout : Buffer.alloc(0), stderr: Buffer.isBuffer(spawned.stderr) ? spawned.stderr : Buffer.alloc(0), ...(spawned.error === undefined ? {} : { error: spawned.error }) }
}

export const LEAN_CONTAINER_BROKER_SOURCE = `
import { createInterface } from "node:readline";
import { MessageChannel, receiveMessageOnPort, Worker } from "node:worker_threads";
const harnesses = ${JSON.stringify({ legacy: WORKER_HARNESS_SOURCE, v117: WORKER_HARNESS_V117_SOURCE })};
const signals = ${JSON.stringify(WORKER_SIGNAL_V117)};
let expected = 1;
let queue=Promise.resolve();
const exact=(o,k)=>Object.keys(o).sort().join("\\0")===k.slice().sort().join("\\0");
const canonical=(s)=>{ try { return Buffer.from(s,"base64").toString("base64")===s; } catch { return false; } };
const workerUrl=(source)=>new URL("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
const resources={maxOldGenerationSizeMb:16,maxYoungGenerationSizeMb:8,stackSizeMb:4};
const frame=(tag)=>Uint8Array.of(tag.charCodeAt(0));
const hostEnvelope=(raw,go,termination)=>{const header=Buffer.alloc(24);header.write("CG17",0,"ascii");header.writeUInt8(1,4);header.writeUInt8((go===undefined?0:1)|(termination===undefined?0:2),5);header.writeUInt16BE(0,6);header.writeBigUInt64BE(go===undefined?0n:go,8);header.writeUInt32BE(termination===undefined?0:termination,16);header.writeUInt32BE(raw.byteLength,20);return Buffer.concat([header,Buffer.from(raw)]);};
const terminate=async(worker,grace)=>{let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("termination grace exceeded")),grace)});try{await Promise.race([worker.terminate(),timeout]);}finally{clearTimeout(timer)}};
const parsePayload=(q)=>{let value;try{value=JSON.parse(Buffer.from(q.payloadBase64,"base64").toString("utf8"))}catch{return null}return value&&typeof value==="object"&&!Array.isArray(value)?value:null;};
const runLegacy=async(q,request)=>{
  if(!exact(request,["source","methodName","input","outputByteLimit"])&& !exact(request,["source","methodName","input"]))return {status:70,signal:null,out:Buffer.alloc(0),err:Buffer.from("Subprocess request failed schema validation\\n")};
  const signalBuffer=new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);const signal=new Int32Array(signalBuffer);const {port1,port2}=new MessageChannel();
  const worker=new Worker(workerUrl(harnesses.legacy),{workerData:{source:request.source,methodName:request.methodName,input:request.input,outputByteLimit:request.outputByteLimit,port:port2,signalBuffer},transferList:[port2],env: {},execArgv: [],resourceLimits: resources});
  const wait=Atomics.wait(signal,0,0,q.timeoutMilliseconds);if(wait==="timed-out"||Atomics.load(signal,0)!==1){await terminate(worker,100);port1.close();return {status:null,signal:"SIGKILL",out:Buffer.alloc(0),err:Buffer.alloc(0)}}
  const received=receiveMessageOnPort(port1);await terminate(worker,100);port1.close();
  if(!received||!received.message||typeof received.message!=="object")return {status:70,signal:null,out:Buffer.alloc(0),err:Buffer.from("Subprocess response failed schema validation\\n")};
  return {status:0,signal:null,out:Buffer.from(JSON.stringify(received.message)),err:Buffer.alloc(0)};
};
const runV117=async(q,request)=>{
  if(!exact(request,["source","methodName","input","outputByteLimit","methodWallMilliseconds","startupTimeoutMilliseconds","cancellationGraceMilliseconds"]))return {status:0,signal:null,out:hostEnvelope(frame("T")),err:Buffer.alloc(0)};
  const signalBuffer=new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);const signal=new Int32Array(signalBuffer);const {port1,port2}=new MessageChannel();const launched=process.hrtime.bigint();
  const worker=new Worker(workerUrl(harnesses.v117),{workerData:{source:request.source,methodName:request.methodName,input:request.input,outputByteLimit:request.outputByteLimit,port:port2,signalBuffer},transferList:[port2],env: {},execArgv: [],resourceLimits: resources});
  const launchMs=Number(process.hrtime.bigint()-launched)/1000000;const startup=Math.max(0,request.startupTimeoutMilliseconds-launchMs);const startupWait=Atomics.wait(signal,0,signals.starting,startup);
  if(startupWait==="timed-out"||Atomics.load(signal,0)===signals.starting){await terminate(worker,request.cancellationGraceMilliseconds);port1.close();return {status:0,signal:null,out:hostEnvelope(frame("H")),err:Buffer.alloc(0)}}
  let go;if(Atomics.load(signal,0)===signals.ready){go=process.hrtime.bigint();Atomics.store(signal,0,signals.go);Atomics.notify(signal,0);const methodWait=Atomics.wait(signal,0,signals.go,request.methodWallMilliseconds);if(methodWait==="timed-out"||Atomics.load(signal,0)!==signals.done){const began=process.hrtime.bigint();await terminate(worker,request.cancellationGraceMilliseconds);const elapsed=Math.ceil(Number(process.hrtime.bigint()-began)/1000000);port1.close();return {status:0,signal:null,out:elapsed<=request.cancellationGraceMilliseconds?hostEnvelope(frame("D"),go,elapsed):hostEnvelope(frame("H"),go),err:Buffer.alloc(0)}}}
  if(Atomics.load(signal,0)!==signals.done){await terminate(worker,request.cancellationGraceMilliseconds);port1.close();return {status:0,signal:null,out:hostEnvelope(frame("R"),go),err:Buffer.alloc(0)}}
  const received=receiveMessageOnPort(port1);await terminate(worker,request.cancellationGraceMilliseconds);port1.close();const output=received&&received.message;
  return {status:0,signal:null,out:hostEnvelope(output instanceof Uint8Array?output:frame("R"),go),err:Buffer.alloc(0)};
};
const handle=async(line)=>{
  let q;
  try { q=JSON.parse(line); } catch { process.exit(71); }
  if(!q||typeof q!=="object"||!exact(q,["requestId","mode","payloadBase64","timeoutMilliseconds","stdoutByteLimit","stderrByteLimit"])||q.requestId!==expected||!(q.mode in harnesses)||typeof q.payloadBase64!=="string"||!canonical(q.payloadBase64)||!Number.isSafeInteger(q.timeoutMilliseconds)||q.timeoutMilliseconds<1||!Number.isSafeInteger(q.stdoutByteLimit)||q.stdoutByteLimit<1||!Number.isSafeInteger(q.stderrByteLimit)||q.stderrByteLimit<0) process.exit(72);
  expected++;
  const request=parsePayload(q);if(request===null)process.exit(72);
  const result=q.mode==="legacy"?await runLegacy(q,request):await runV117(q,request);
  if(result.out.byteLength>q.stdoutByteLimit||result.err.byteLength>q.stderrByteLimit)process.exit(74);
  const response={requestId:q.requestId,status:result.status,signal:result.signal,stdoutBase64:result.out.toString("base64"),stderrBase64:result.err.toString("base64")};
  process.stdout.write(JSON.stringify(response)+"\\n");
};
const rl=createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
rl.on("line",line=>{queue=queue.then(()=>handle(line)).catch(()=>process.exit(73));});
rl.on("close",()=>{queue.then(()=>process.exit(0),()=>process.exit(73));});
`

const STREAM_WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");
const { spawn } = require("node:child_process");
const child=spawn(workerData.command,workerData.args,{env:{PATH:workerData.path},shell:false,stdio:["pipe","pipe","pipe"],windowsHide:true});
let stdout=Buffer.alloc(0), stderr=Buffer.alloc(0), pending=null, exited=null, forced=false;
const finish=(state,bytes=Buffer.alloc(0))=>{ if(!pending)return; const cap=pending.response.byteLength; if(bytes.length>cap){state=-2;bytes=Buffer.alloc(0)} else new Uint8Array(pending.response).set(bytes); Atomics.store(new Int32Array(pending.control),1,bytes.length); Atomics.store(new Int32Array(pending.control),0,state); Atomics.notify(new Int32Array(pending.control),0); pending=null; };
child.on("spawn",()=>{Atomics.store(new Int32Array(workerData.start),0,1);Atomics.notify(new Int32Array(workerData.start),0)});
child.on("error",()=>{if(Atomics.load(new Int32Array(workerData.start),0)===0){Atomics.store(new Int32Array(workerData.start),0,-1);Atomics.notify(new Int32Array(workerData.start),0)}finish(-3)});
child.stderr.on("data",d=>{stderr=Buffer.concat([stderr,d]);if(stderr.length>workerData.max)finish(-4)});
child.stdout.on("data",d=>{stdout=Buffer.concat([stdout,d]);if(stdout.length>workerData.max)return finish(-2);const newline=stdout.indexOf(10);if(newline>=0){const frame=stdout.subarray(0,newline+1);stdout=stdout.subarray(newline+1);if(stdout.length!==0)return finish(-5);finish(stderr.length===0?1:-4,frame)}});
child.on("exit",(code,signal)=>{exited={code,signal};if(pending)finish(pending.type==="close"&&stderr.length===0&&(forced||(code===0&&!signal))?1:-6)});
parentPort.on("message",m=>{if(m.type==="exchange"){const occupied=pending!==null||exited!==null||stdout.length!==0||stderr.length!==0;pending=m;if(occupied)return void finish(-5);child.stdin.write(Buffer.from(m.request));}else if(m.type==="close"){if(pending){finish(-7);forced=true}pending=m;child.stdin.end();if(forced&&!exited)child.kill("SIGKILL");if(exited)finish(stderr.length===0&&(forced||(exited.code===0&&!exited.signal))?1:-6)}});
`

const defaultStreamFactory: LeanContainerPersistentStreamFactory = (command, args, options) => {
  const start = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const worker = new Worker(STREAM_WORKER_SOURCE, { eval: true, workerData: { command, args: [...args], path: process.env.PATH ?? "", start, max: options.maxBufferBytes } })
  const started = new Int32Array(start)
  if (Atomics.wait(started, 0, 0, options.startupTimeoutMilliseconds) === "timed-out" || Atomics.load(started, 0) !== 1) {
    void worker.terminate()
    throw new TypeError("LEAN_CONTAINER_SESSION_STREAM_START_FAILED")
  }
  let closed = false
  const transact = (message: Record<string, unknown>, timeoutMilliseconds: number, maxBufferBytes: number): Buffer => {
    if (closed) throw new TypeError("LEAN_CONTAINER_SESSION_STREAM_CLOSED")
    const control = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2)
    const response = new SharedArrayBuffer(Math.min(maxBufferBytes, STREAM_FRAME_LIMIT_BYTES))
    worker.postMessage({ ...message, control, response })
    const view = new Int32Array(control)
    if (Atomics.wait(view, 0, 0, timeoutMilliseconds) === "timed-out") throw Object.assign(new Error("persistent stream timeout"), { code: "ETIMEDOUT" })
    const state = Atomics.load(view, 0); const length = Atomics.load(view, 1)
    if (state !== 1 || length < 0 || length > response.byteLength) throw new TypeError(`LEAN_CONTAINER_SESSION_STREAM_FAILURE:${state}`)
    return Buffer.from(new Uint8Array(response, 0, length))
  }
  return {
    exchange(frame, exchangeOptions) { return transact({ type: "exchange", request: Buffer.from(frame) }, exchangeOptions.timeoutMilliseconds, exchangeOptions.maxBufferBytes) },
    close(timeoutMilliseconds) {
      if (closed) return { status: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }
      try { const receipt = transact({ type: "close" }, timeoutMilliseconds, 1); closed = true; void worker.terminate(); return { status: 0, signal: null, stdout: receipt, stderr: Buffer.alloc(0) } }
      catch (error) { closed = true; void worker.terminate(); return { status: null, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), error: error as Error } }
    },
  }
}

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const canonicalBase64 = (value: string): boolean => { try { return Buffer.from(value, "base64").toString("base64") === value } catch { return false } }
const assertSafeIdentity = (label: string, value: string): void => { if (value.length === 0 || value.startsWith("-") || !/^[a-zA-Z0-9._:/@-]+$/u.test(value)) throw new TypeError(`LEAN_CONTAINER_SESSION_${label}_INVALID`) }
const createArgs = (image: string, containerName: string, ownershipLabel: string): readonly string[] => ["create", "--name", containerName, "--label", `${OWNER_LABEL}=${ownershipLabel}`, "--interactive", "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m", "--memory", "64m", "--cpus", "0.5", "--pids-limit", "64", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--env", "NODE_ENV=production", "--workdir", "/tmp", image, "node", "--input-type=module", "--eval", INERT_CONTAINER_SOURCE]
const assertCleanControlResult = (result: LeanContainerTransportResult, code: string): void => { if (result.error !== undefined || result.signal !== null || result.status !== 0 || result.stderr.byteLength !== 0) throw new TypeError(code) }
const exactAbsent = (result: LeanContainerTransportResult, name: string): boolean => result.error === undefined && result.signal === null && result.status === 1 && (
  (result.stdout.byteLength === 0 && result.stderr.equals(Buffer.from(`Error: No such object: ${name}\n`, "utf8")))
  || (result.stdout.equals(Buffer.from("\n", "utf8")) && result.stderr.equals(Buffer.from(`error: no such object: ${name}\n`, "utf8")))
)
const strictJsonResponse = (stdout: Buffer, byteLimit: number): RuntimeResult<unknown> => { const text = stdout.toString("utf8"); assertWithinByteCap("stdout", text, byteLimit); let parsed: unknown; try { parsed = JSON.parse(text) } catch { throw new SubprocessSystemFailure("MALFORMED_IPC", "Container session response was not one JSON frame") }; if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new SubprocessSystemFailure("MALFORMED_IPC", "Container session response frame is invalid"); const record = parsed as Record<string, unknown>; if (!exactKeys(record, record.ok === true ? ["ok", "value"] : ["ok", "violation"])) throw new SubprocessSystemFailure("MALFORMED_IPC", "Container session response frame has surplus fields"); return parseSubprocessIpcResponse(text, byteLimit) }

export const createLeanContainerMatchSession = (options: LeanContainerMatchSessionOptions): LeanContainerMatchSession => {
  assertSafeIdentity("MATCH_ID", options.matchId); assertSafeIdentity("CONTAINER_NAME", options.containerName); assertSafeIdentity("OWNERSHIP_LABEL", options.ownershipLabel); assertSafeIdentity("IMAGE", options.image)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/u.test(options.containerName)) throw new TypeError("LEAN_CONTAINER_SESSION_CONTAINER_NAME_INVALID")
  const dockerPath = options.dockerPath ?? "docker"; const transport = options.transport ?? defaultTransport; const streamFactory = options.streamFactory ?? defaultStreamFactory; const cleanupTimeout = options.cleanupTimeoutMilliseconds ?? DEFAULT_CLEANUP_TIMEOUT_MS
  let state: LeanContainerMatchSession["state"] = "active"; let cleanupResult: LeanContainerSessionCloseResult | undefined; let stream: LeanContainerPersistentStream | undefined; let nextRequestId = 1
  const inspectOwner = (): "absent" | "owned" | "foreign" | "unknown" => {
    const inspected = transport(dockerPath, ["inspect", "--format", `{{index .Config.Labels \"${OWNER_LABEL}\"}}`, options.containerName], { timeoutMilliseconds: cleanupTimeout, maxBufferBytes: CONTROL_BUFFER_BYTES })
    if (exactAbsent(inspected, options.containerName)) return "absent"
    if (inspected.error !== undefined || inspected.signal !== null || inspected.status !== 0 || inspected.stderr.byteLength !== 0) return "unknown"
    return inspected.stdout.toString("utf8").trim() === options.ownershipLabel ? "owned" : "foreign"
  }
  const initialOwner = inspectOwner(); if (initialOwner === "owned" || initialOwner === "foreign") throw new TypeError("LEAN_CONTAINER_SESSION_NAME_COLLISION"); if (initialOwner !== "absent") throw new TypeError("LEAN_CONTAINER_SESSION_NAME_CHECK_FAILED")
  const remove = (): LeanContainerSessionCloseResult => {
    if (cleanupResult !== undefined) return cleanupResult
    const streamClosed = stream === undefined ? true : (() => { const receipt = stream!.close(cleanupTimeout); return receipt.error === undefined && receipt.signal === null && receipt.status === 0 && receipt.stderr.byteLength === 0 })()
    const removed = transport(dockerPath, ["rm", "--force", options.containerName], { timeoutMilliseconds: cleanupTimeout, maxBufferBytes: CONTROL_BUFFER_BYTES })
    const absent = inspectOwner() === "absent"
    cleanupResult = streamClosed && removed.error === undefined && removed.signal === null && removed.status === 0 && removed.stderr.byteLength === 0 && absent ? { cleanupComplete: true, orphanedChild: false } : { cleanupComplete: false, orphanedChild: true }
    return cleanupResult
  }
  const created = transport(dockerPath, createArgs(options.image, options.containerName, options.ownershipLabel), { timeoutMilliseconds: DEFAULT_CONTROL_TIMEOUT_MS, maxBufferBytes: CONTROL_BUFFER_BYTES })
  const ownershipAfterCreate = inspectOwner(); const createOutput = created.stdout.toString("utf8").trim(); const createClean = created.error === undefined && created.signal === null && created.status === 0 && created.stderr.byteLength === 0 && /^[a-zA-Z0-9._:-]+$/u.test(createOutput)
  if (!createClean || ownershipAfterCreate !== "owned") { if (ownershipAfterCreate === "owned") { const cleanup = remove(); if (!cleanup.cleanupComplete) throw new TypeError("LEAN_CONTAINER_SESSION_CREATE_CLEANUP_INCOMPLETE") } else if (ownershipAfterCreate === "foreign" || ownershipAfterCreate === "unknown") throw new TypeError("LEAN_CONTAINER_SESSION_CREATE_CLEANUP_INCOMPLETE"); throw new TypeError("LEAN_CONTAINER_SESSION_CREATE_FAILED") }
  const containerId = options.containerName
  const poison = (): void => { state = "poisoned"; remove() }
  try {
    const started = transport(dockerPath, ["start", containerId], { timeoutMilliseconds: DEFAULT_CONTROL_TIMEOUT_MS, maxBufferBytes: CONTROL_BUFFER_BYTES }); assertCleanControlResult(started, "LEAN_CONTAINER_SESSION_START_FAILED")
    stream = streamFactory(dockerPath, ["exec", "-i", containerId, "node", "--input-type=module", "--eval", LEAN_CONTAINER_BROKER_SOURCE], { startupTimeoutMilliseconds: DEFAULT_CONTROL_TIMEOUT_MS, maxBufferBytes: STREAM_FRAME_LIMIT_BYTES })
  } catch { poison(); throw new TypeError("LEAN_CONTAINER_SESSION_START_FAILED") }
  const assertActive = (): void => { if (state === "poisoned") throw new TypeError("LEAN_CONTAINER_SESSION_POISONED"); if (state === "closed") throw new TypeError("LEAN_CONTAINER_SESSION_CLOSED") }
  const runMethod = (request: StrategyExecutionRequest, mode: "legacy" | "v117", timeoutMilliseconds: number, stdoutLimit: number, stderrLimit: number, input: string | Uint8Array): LeanContainerTransportResult => {
    assertActive(); const requestId = nextRequestId++; const inputBytes = typeof input === "string" ? Buffer.byteLength(input) : input.byteLength
    if (inputBytes > STREAM_FRAME_LIMIT_BYTES / 2) { poison(); throw new SubprocessSystemFailure("STDIO_CAP_EXCEEDED", "Container session request exceeded payload cap") }
    const payload = Buffer.from(input); const frame = `${JSON.stringify({ requestId, mode, payloadBase64: payload.toString("base64"), timeoutMilliseconds, stdoutByteLimit: stdoutLimit, stderrByteLimit: stderrLimit })}\n`
    if (Buffer.byteLength(frame) > STREAM_FRAME_LIMIT_BYTES) { poison(); throw new SubprocessSystemFailure("STDIO_CAP_EXCEEDED", "Container session request exceeded frame cap") }
    try {
      const raw = stream!.exchange(frame, { timeoutMilliseconds, maxBufferBytes: Math.min(STREAM_FRAME_LIMIT_BYTES, Math.max(stdoutLimit, stderrLimit) * 2 + CONTROL_BUFFER_BYTES) })
      if (raw.byteLength > STREAM_FRAME_LIMIT_BYTES || raw.at(-1) !== 10 || raw.subarray(0, -1).includes(10)) throw new SubprocessSystemFailure("MALFORMED_IPC", "Persistent response was not one frame")
      let parsed: unknown; try { parsed = JSON.parse(raw.subarray(0, -1).toString("utf8")) } catch { throw new SubprocessSystemFailure("MALFORMED_IPC", "Persistent response was malformed") }
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new SubprocessSystemFailure("MALFORMED_IPC", "Persistent response was invalid")
      const value = parsed as Record<string, unknown>
      if (!exactKeys(value, ["requestId", "status", "signal", "stdoutBase64", "stderrBase64"]) || value.requestId !== requestId || !(value.status === null || Number.isSafeInteger(value.status)) || !(value.signal === null || typeof value.signal === "string") || typeof value.stdoutBase64 !== "string" || typeof value.stderrBase64 !== "string" || !canonicalBase64(value.stdoutBase64) || !canonicalBase64(value.stderrBase64)) throw new SubprocessSystemFailure("MALFORMED_IPC", "Persistent response correlation failed")
      const stdout = Buffer.from(value.stdoutBase64, "base64"); const stderr = Buffer.from(value.stderrBase64, "base64")
      if (stdout.byteLength > stdoutLimit || stderr.byteLength > stderrLimit || stderr.byteLength !== 0) throw new SubprocessSystemFailure("STDIO_CAP_EXCEEDED", "Persistent response exceeded cap or emitted stderr")
      if (value.signal !== null) throw new SubprocessSystemFailure("SUBPROCESS_SIGNAL", "Container method was signalled")
      if (value.status !== 0) throw new SubprocessSystemFailure("SUBPROCESS_EXIT", "Container method exited nonzero")
      return { status: value.status as number, signal: value.signal as null, stdout, stderr }
    } catch (error) { poison(); throw error } finally { void request }
  }
  const adapter: StrategyExecutionAdapterV117 = {
    metadata: containerSubprocessStrategyExecutionAdapterMetadata,
    execute(request) { const stdoutLimit = request.outputByteLimit ?? SUBPROCESS_STDOUT_BYTES; const encoded = encodeSubprocessIpcRequest({ source: request.source, methodName: request.methodName, input: request.input, outputByteLimit: request.outputByteLimit }); return strictJsonResponse(runMethod(request, "legacy", request.timeoutMs ?? RUNTIME_TIMEOUT_MS, stdoutLimit, SUBPROCESS_STDERR_BYTES, encoded).stdout, stdoutLimit) },
    executeV117(request) { return executeStrategyRuntimeAbiV117({ requestBytes: request.requestBytes, executableSource: request.executableSource, signingIdentity: request.signingIdentity, invokeGuest(guest) {
      const observed = (observation: RuntimeGuestObservationV117) => createRuntimeGuestExecutionV117(observation, consumeCandidateEvidenceFixture(request, observeRuntimeGuestAccountingV117(observation, guest.outputByteLimit)))
      const input = JSON.stringify({ source: guest.executableSource, methodName: guest.methodName, input: guest.input, outputByteLimit: guest.outputByteLimit, methodWallMilliseconds: guest.timeoutMs, startupTimeoutMilliseconds: guest.startupTimeoutMs, cancellationGraceMilliseconds: guest.cancellationGraceMilliseconds })
      const launchStartedNanoseconds = process.hrtime.bigint(); const timeoutMilliseconds = guest.startupTimeoutMs + guest.timeoutMs + guest.cancellationGraceMilliseconds; const stdoutLimit = CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 + guest.stdoutByteLimit + 1
      let method: LeanContainerTransportResult; try { method = runMethod({ source: guest.executableSource, methodName: guest.methodName, input: guest.input }, "v117", timeoutMilliseconds, stdoutLimit, guest.stderrByteLimit, input) } catch { return observed({ kind: "system_failure", code: "TRANSPORT_CRASH", retryable: false }) }
      const observation = observeCandidateSubprocessV117({ result: { ...method, terminationReceiptPresent: true, stdoutEof: true, stderrEof: true, containerCleanupRequired: false }, launchStartedNanoseconds, receivedAtNanoseconds: process.hrtime.bigint(), startupTimeoutMilliseconds: guest.startupTimeoutMs, methodWallMilliseconds: guest.timeoutMs, cancellationGraceMilliseconds: guest.cancellationGraceMilliseconds, outputByteLimit: guest.outputByteLimit, stdoutByteLimit: guest.stdoutByteLimit, stderrByteLimit: guest.stderrByteLimit })
      if (observation.kind === "system_failure" || (observation.kind === "raw_frame" && String.fromCharCode(observation.bytes[0] ?? 0) === "D")) poison(); return observed(observation)
    } }) },
  }
  return { matchId: options.matchId, containerId, adapter, get state() { return state }, close() { if (state !== "poisoned") state = "closed"; return remove() } }
}

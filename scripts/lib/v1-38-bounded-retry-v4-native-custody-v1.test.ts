import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const moduleUrl = new URL("./v1-38-bounded-retry-v4-native-custody-v1.ts", import.meta.url).href
const repoRoot = fileURLToPath(new URL("../../", import.meta.url))

// Every native fixture has an independent, process-group supervisor: a blocked
// synchronous child cannot prevent the parent from enforcing the 55s deadline.
const fixture = (body: string): Promise<string> => new Promise((resolve, reject) => {
  const code = `
    import assert from 'node:assert/strict';
    import * as fs from 'node:fs';
    import path from 'node:path';
    import { tmpdir } from 'node:os';
    import { createHash } from 'node:crypto';
    import { createRequire, syncBuiltinESMExports } from 'node:module';
    const require = createRequire(import.meta.url);
    const cp = require('node:child_process');
    const originalSpawnSync = cp.spawnSync;
    const root = fs.mkdtempSync(path.join(tmpdir(), 'v138-v4-native-fixture-'));
    const leases = [];
    const pair = (id) => ({ transactionId:id, intentPath:id+'.intent', members:[
      {target:id+'-left',bytes:'left\\n'}, {target:id+'-right',bytes:'right\\n'}] });
    const sha = bytes => 'sha256:'+createHash('sha256').update(bytes).digest('hex');
    const native = await import(${JSON.stringify(moduleUrl)});
    const acquire = async () => { const lease = await native.acquireV138RetryV4NativeOwnerLease(root); leases.push(lease); return lease; };
    const publish = (lease,id) => native.publishV138RetryV4NativePair(root,pair(id),lease);
    try { ${body}; console.log('fixture-passed'); }
    finally {
      cp.spawnSync=originalSpawnSync; syncBuiltinESMExports();
      for (const lease of leases) { try { await lease.release(); } catch {} }
      fs.rmSync(root,{recursive:true,force:true});
    }
  `
  const child = spawn(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], {
    cwd: repoRoot, detached: true, stdio: ["ignore", "pipe", "pipe"],
  })
  let output = ""
  child.stdout.on("data", chunk => { output += chunk })
  child.stderr.on("data", chunk => { output += chunk })
  const killGroup = () => { if (child.pid) { try { process.kill(-child.pid, "SIGKILL") } catch {} } }
  const timer = setTimeout(() => { killGroup(); reject(new Error(`native fixture exceeded 55s: ${output}`)) }, 55_000)
  child.once("error", error => { clearTimeout(timer); killGroup(); reject(error) })
  child.once("close", code => {
    clearTimeout(timer)
    killGroup()
    if (code === 0) resolve(output)
    else reject(new Error(`native fixture failed (${code}): ${output}`))
  })
})

describe.skipIf(process.platform !== "darwin")("v4 retained native owner custody", () => {
  it("composes owner → PAIR → LIFE → PAIR with continuous exclusion", async () => {
    expect(await fixture(`
      const lease=await acquire();
      assert(Object.isFrozen(lease));
      assert.deepEqual(Object.keys(lease).sort(),['pid','release','waitForExit']);
      const excluded=()=>assert.rejects(acquire(),/OWNER_LOCK_ACTIVE/);
      await excluded();
      publish(lease,'bootstrap');
      await excluded();
      native.applyV138RetryV4NativeLifecycle(root,{
        transactionId:'append',intentPath:'append.intent',
        steps:[{id:'append',target:'bootstrap-left',beforeSha256:sha('left\\n'),afterBytes:'left\\nnext\\n'}],
        lifecycle:{target:'append.lifecycle',bytes:'appended\\n'}
      },lease);
      await excluded();
      publish(lease,'terminal');
      await excluded();
      assert.equal(fs.readFileSync(path.join(root,'bootstrap-left'),'utf8'),'left\\nnext\\n');
      assert.equal(fs.readFileSync(path.join(root,'terminal-right'),'utf8'),'right\\n');
      await lease.release();
      assert.throws(()=>publish(lease,'released'),/LEASE_INVALID/);
      const next=await acquire(); await next.release();
    `)).toContain("fixture-passed")
  }, 60_000)

  it("rejects fabricated, wrong-root, closed and reused descriptors before writes", async () => {
    expect(await fixture(`
      assert.throws(()=>publish(Object.freeze({}),'fabricated'),/LEASE_INVALID/);
      const lease=await acquire();
      const other=fs.mkdtempSync(path.join(root,'other-'));
      assert.throws(()=>native.publishV138RetryV4NativePair(other,pair('wrong'),lease),/LEASE_INVALID/);
      await lease.release();
      for (const reuse of [false,true]) {
        const active=await acquire();
        const identity=fs.statSync(root);
        const fd=fs.readdirSync('/dev/fd').map(Number).find(fd=>{
          try { const s=fs.fstatSync(fd); return s.dev===identity.dev&&s.ino===identity.ino } catch { return false }
        });
        assert.notEqual(fd,undefined);
        fs.closeSync(fd);
        let replacement;
        if (reuse) { replacement=fs.openSync(root,fs.constants.O_RDONLY); assert.equal(replacement,fd); }
        assert.throws(()=>publish(active,reuse?'reused':'closed'),/LEASE_INVALID|ROOT_LOCK_BUSY/);
        assert(!fs.existsSync(path.join(root,(reuse?'reused':'closed')+'-left')));
        if(replacement!==undefined) { try { fs.closeSync(replacement) } catch {} }
        try { await active.release() } catch {}
      }
    `)).toContain("fixture-passed")
  }, 60_000)

  it("invalidates on transaction timeout, waits for owner close and permits new ownership", async () => {
    expect(await fixture(`
      const lease=await acquire();
      let measured=false;
      cp.spawnSync=(file,args,options)=>{
        if (String(file).endsWith('/primary/native')) {
          assert.equal(options.timeout,10000); assert.equal(options.killSignal,'SIGKILL');
          measured=true;
          return originalSpawnSync(process.execPath,['-e','setInterval(()=>{},1000)'],{...options,stdio:['pipe','ignore','pipe']});
        }
        return originalSpawnSync(file,args,options);
      }; syncBuiltinESMExports();
      assert.throws(()=>publish(lease,'timeout'),/NATIVE_FAILED/);
      assert(measured);
      assert.throws(()=>publish(lease,'after-timeout'),/LEASE_INVALID/);
      cp.spawnSync=originalSpawnSync; syncBuiltinESMExports();
      try { await lease.release() } catch {}
      await lease.waitForExit();
      const next=await acquire(); await next.release();
    `)).toContain("fixture-passed")
  }, 60_000)

  it("cleans compiler failure descriptors/builds before owner launch", async () => {
    expect(await fixture(`
      const prefix='cowards-v138-retry-v4-owner-';
      const before=fs.readdirSync(tmpdir()).filter(x=>x.startsWith(prefix)).sort();
      const descriptors=fs.readdirSync('/dev/fd').length;
      cp.spawnSync=(file,args,options)=>{
        if(String(file).endsWith('/clang')) {
          assert.equal(options.timeout,30000); assert.equal(options.killSignal,'SIGKILL');
          return {status:1,signal:null,stderr:'fixture compiler failure'};
        }
        return originalSpawnSync(file,args,options);
      }; syncBuiltinESMExports();
      await assert.rejects(acquire(),/COMPILE_FAILED/);
      assert.equal(fs.readdirSync('/dev/fd').length,descriptors);
      assert.deepEqual(fs.readdirSync(tmpdir()).filter(x=>x.startsWith(prefix)).sort(),before);
      cp.spawnSync=originalSpawnSync; syncBuiltinESMExports();
      const next=await acquire(); await next.release();
    `)).toContain("fixture-passed")
  }, 60_000)
})

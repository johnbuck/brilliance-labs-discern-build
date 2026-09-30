// Parity test for the shared secret-leak-guard codebase.
//
// Gates (any mismatch exits non-zero, fails CI):
//   1. core (checkBash/checkRead) == canonical Claude bash hook, on every case.
//   2. each adapter (Claude CLI, OpenCode plugin, pi extension) == core, on every case.
//
// Hermetic: no network, no keys. Needs bash + jq + Node >= 22.6 (native TS stripping
// for the pi adapter). Run:  node --experimental-strip-types tests/parity.mjs
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkBash, checkRead } from "../core/rules.mjs";
import { bashCases, readCases } from "../core/cases.mjs";
import { PnkGuardrails } from "../adapters/opencode.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const BASH_HOOK = resolve(ROOT, "reference/secret-leak-guard.sh");
const CLAUDE_ADAPTER = resolve(ROOT, "adapters/claude.mjs");

// --- canonical bash hook (the reference the core must match) ---
function bashHookBash(command) {
  const r = spawnSync(BASH_HOOK, [], { input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }), encoding: "utf-8" });
  return denyFromHookJSON(r.stdout);
}
function bashHookRead(path) {
  const r = spawnSync(BASH_HOOK, [], { input: JSON.stringify({ tool_name: "Read", tool_input: { file_path: path } }), encoding: "utf-8" });
  return denyFromHookJSON(r.stdout);
}
function denyFromHookJSON(stdout) {
  const out = (stdout || "").trim();
  if (!out) return "ALLOW";
  try {
    const o = JSON.parse(out)?.hookSpecificOutput ?? JSON.parse(out);
    return o?.permissionDecision === "deny" ? "DENY" : "ALLOW";
  } catch { return "ALLOW"; }
}

// --- Claude adapter (spawn the node CLI) ---
function claudeAdapterBash(command) {
  const r = spawnSync("node", [CLAUDE_ADAPTER], { input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }), encoding: "utf-8" });
  return denyFromHookJSON(r.stdout);
}
function claudeAdapterRead(path) {
  const r = spawnSync("node", [CLAUDE_ADAPTER], { input: JSON.stringify({ tool_name: "Read", tool_input: { file_path: path } }), encoding: "utf-8" });
  return denyFromHookJSON(r.stdout);
}

// --- OpenCode adapter (invoke the plugin hook with a mock client) ---
const noop = async () => {};
const ocHooks = await PnkGuardrails({
  client: { tui: { showToast: noop }, app: { log: noop }, session: { prompt: noop } },
  $: () => ({ quiet: () => ({ text: async () => "" }) }),
  directory: ROOT,
});
const ocBefore = ocHooks["tool.execute.before"];
async function ocAdapterBash(command) {
  try { await ocBefore({ tool: "bash" }, { args: { command } }); return "ALLOW"; }
  catch { return "DENY"; }
}
async function ocAdapterRead(path) {
  try { await ocBefore({ tool: "read" }, { args: { path } }); return "ALLOW"; }
  catch { return "DENY"; }
}

// --- pi adapter (load via type-stripping, drive its tool_call handler) ---
const piMod = await import(pathToFileURL(resolve(ROOT, "adapters/pi.ts")).href);
const piHandlers = {};
const piMock = { on: (evt, fn) => { piHandlers[evt] = fn; } };
piMod.default(piMock);
async function piAdapterBash(command) {
  const r = await piHandlers["tool_call"]({ toolName: "bash", input: { command } }, {});
  return r?.block ? "DENY" : "ALLOW";
}
async function piAdapterRead(path) {
  const r = await piHandlers["tool_call"]({ toolName: "read", input: { path } }, {});
  return r?.block ? "DENY" : "ALLOW";
}

// --- run + compare ---
let fails = 0;
const dec = (b) => (b ? "DENY" : "ALLOW");

for (const [label, command] of bashCases) {
  const core = dec(checkBash(command));
  const hook = bashHookBash(command);
  const claude = claudeAdapterBash(command);
  const oc = await ocAdapterBash(command);
  const pi = await piAdapterBash(command);
  if (core !== hook) { fails++; console.log(`FAIL [core!=hook] ${label}: core=${core} hook=${hook} :: ${command}`); }
  if (claude !== core) { fails++; console.log(`FAIL [claude!=core] ${label}: claude=${claude} core=${core} :: ${command}`); }
  if (oc !== core) { fails++; console.log(`FAIL [opencode!=core] ${label}: oc=${oc} core=${core} :: ${command}`); }
  if (pi !== core) { fails++; console.log(`FAIL [pi!=core] ${label}: pi=${pi} core=${core} :: ${command}`); }
}
for (const [label, path] of readCases) {
  const core = dec(checkRead(path));
  const hook = bashHookRead(path);
  const claude = claudeAdapterRead(path);
  const oc = await ocAdapterRead(path);
  const pi = await piAdapterRead(path);
  if (core !== hook) { fails++; console.log(`FAIL [core!=hook] read ${label}: core=${core} hook=${hook} :: ${path}`); }
  if (claude !== core) { fails++; console.log(`FAIL [claude!=core] read ${label}: claude=${claude} core=${core} :: ${path}`); }
  if (oc !== core) { fails++; console.log(`FAIL [opencode!=core] read ${label}: oc=${oc} core=${core} :: ${path}`); }
  if (pi !== core) { fails++; console.log(`FAIL [pi!=core] read ${label}: pi=${pi} core=${core} :: ${path}`); }
}

const total = bashCases.length + readCases.length;
console.log(`\nCases: ${total} bash+read. Core==hook AND all adapters==core: ${fails === 0 ? "PASS ✅" : `FAIL ❌ (${fails} mismatches)`}`);
process.exit(fails === 0 ? 0 : 1);

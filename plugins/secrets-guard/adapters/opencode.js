// OpenCode plugin adapter for the shared secret-leak-guard core.
//
// Evolved from guardrails.js: the inline secret-leak rules are replaced by an
// import of the shared core (checkBash for bash, checkRead for read, bringing OC to
// full parity with Claude and pi). The OC-specific CATASTROPHIC blocklist and the
// post-tool nudges are kept (they are not part of the secret-leak guard proper).
//
// Loaded by OpenCode from ~/.config/opencode/plugins/ (or ~/.opencode/plugins/).
// Toggle with PNK_GUARDRAILS=on|nonudge|off.
import { checkBash, checkRead } from "../core/rules.mjs";

export const PnkGuardrails = async ({ client, $, directory }) => {
  const MODE = process.env.PNK_GUARDRAILS || "on"; // on | nonudge | off
  if (MODE !== "on") {
    try { await client.tui.showToast({ body: { message: `guardrails is in ${MODE} mode; protection is reduced.`, variant: "warning" } }) } catch {}
  }
  if (MODE === "off") return {};

  // OC-specific catastrophic commands (not part of the shared secret-leak guard).
  const CATASTROPHIC = [
    /\brm\b(?=[^\n|;]*(?:-\w*r|--recursive))(?=[^\n|;]*(?:-\w*f|--force))[^\n|;]*\s(?:\/\*?|~\/?|\$\{?HOME\}?\/?|\/home\/?)(?=\s|["';|]|$)/i,
    /\bfind\s+(?:\/|~\/?|\$\{?HOME\}?\/?|\/home\/?)(?=\s|$)[^\n]*(?:-delete|-exec\s+rm)\b/,
    /(?:>|>>|\btee\b|\bof=)\s*["']?\/dev\/(?:sd|nvme|vd|hd|mmcblk|disk|loop)/,
    /\b(?:wipefs|blkdiscard|shred|truncate|mkfs\S*|sgdisk)\b[^\n]*\/dev\/(?:sd|nvme|vd|mmcblk)/,
    /\bmv\b[^\n]*\s\/dev\/null\b/,
    /\bchown\b[^\n]*\s(?:-R|--recursive)\b[^\n]*\s\/(?:\s|$)/,
    /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    /\bgit\s+push\b[^\n]*(?:--force\b|\s-f\b|\s\+[\w./-]+(?::|\s|$))/,
    /\bchmod\b[^\n]*(?:-R|--recursive|-\w*R)\b[^\n]*(?:[0-7]*777|a\+?rwx)\b/,
    /\b(?:ba|z|k)?sh\b[^\n]*-c\s+["']?\$\((?:curl|wget)\b/,
    /\b(?:curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:(?:ba|z|k)?sh|python[\d.]*|perl|ruby|node)\b/,
  ];
  const SECRET_SHAPE = [
    /sk-(?:proj-|live-)?[A-Za-z0-9]{20,}/, /sk_live_[A-Za-z0-9]{20,}/,
    /gh[pousr]_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /glpat-[A-Za-z0-9_-]{20,}/,
    /AKIA[0-9A-Z]{16}/, /AIza[0-9A-Za-z_-]{30,}/, /xox[baprs]-[A-Za-z0-9-]{10,}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  ];

  const seen = new Map();
  const block = (rule) => { throw new Error(`guardrails stopped this action (rule: ${rule}). If it is really intended, ask the operator in plain words first.`) };
  const audit = async (outcome, rule) => {
    try { await client.app.log({ body: { service: "guardrails", level: "warn", message: `${outcome} ${rule}` } }) } catch {}
  };
  const nudge = async (sessionID, rule, humanMsg, modelNote, output) => {
    if (MODE === "nonudge") return;
    const s = seen.get(sessionID) || new Set();
    if (s.has(rule)) return;
    s.add(rule); seen.set(sessionID, s);
    output.output = `${output.output || ""}\n\n[guardrails] ${modelNote}`;
    try { await client.tui.showToast({ body: { message: humanMsg, variant: "warning" } }) } catch {}
  };

  return {
    "tool.execute.before": async (input, output) => {
      const tool = input.tool;
      const args = output.args || input.args || {};
      if (tool === "bash") {
        const cmd = args.command || "";
        if (CATASTROPHIC.some((r) => r.test(cmd))) { await audit("block", "catastrophic"); block("catastrophic-command") }
        const leak = checkBash(cmd);
        if (leak) { await audit("block", "secret-leak"); throw new Error(leak) }
      } else if (tool === "read") {
        const path = args.path || args.filePath || args.file_path || "";
        const leak = checkRead(path);
        if (leak) { await audit("block", "secret-leak"); throw new Error(leak) }
      }
    },
    "tool.execute.after": async (input, output) => {
      if (MODE === "nonudge") return;
      const sessionID = input.sessionID;
      const args = input.args || {};
      if (input.tool === "bash") {
        const cmd = args.command || "";
        const npmGlobal = /\bnpm\s+(?:i|install)\b[^\n]*(?:\s-g\b|--global)/.test(cmd);
        const pipBare = /\bpip[\d.]*\s+install\b/.test(cmd) && !/-r\s|\bvenv\b|\.venv/.test(cmd) && !process.env.VIRTUAL_ENV;
        if (npmGlobal || pipBare)
          await nudge(sessionID, "host-pollution",
            "That install may change the whole computer. Ask me to set it up inside the project instead.",
            "That install may land on the host. Prefer a container or a project-local environment.",
            output);
      } else if (["write", "edit", "apply_patch"].includes(input.tool)) {
        const content = args.content || args.newString || args.patchText || "";
        const target = args.filePath || (args.patchText || "").match(/^\*\*\* (?:Add|Update|Delete|Move to) File:\s*(.+)$/m)?.[1]?.trim() || "";
        const isEnvFile = /(^|\/)\.env(\.[^/]*)?$/.test(target);
        if (!isEnvFile && SECRET_SHAPE.some((r) => r.test(content)))
          await nudge(sessionID, "secret-shape",
            "A file looked like it holds a password or key. Keys should live in the secret store, not in code.",
            "A write looked secret-shaped. Keep keys in env or Infisical, never in code or git.",
            output);
      }
    },
    event: async ({ event }) => {
      if (event.type === "session.deleted") { seen.delete(event.properties?.sessionID); return }
      if (MODE === "nonudge" || event.type !== "session.idle") return;
      const sessionID = event.properties?.sessionID;
      if (!sessionID || seen.get(sessionID)?.has("commit")) return;
      let dirty = "";
      try { dirty = (await $`git -C ${directory} status --porcelain`.quiet().text()).trim() } catch { return }
      if (!dirty) return;
      const s = seen.get(sessionID) || new Set(); s.add("commit"); seen.set(sessionID, s);
      try { await client.tui.showToast({ body: { message: "Uncommitted changes: commit each change on its own with a clear message, or type /undo to roll back.", variant: "info" } }) } catch {}
      try { await client.session.prompt({ path: { id: sessionID }, body: { parts: [{ type: "text", text: "Guardrails note: there are uncommitted changes. Commit each logical change atomically with a short clear message before moving on." }], noReply: true } }) } catch {}
    },
  };
};

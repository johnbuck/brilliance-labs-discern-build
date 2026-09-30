#!/usr/bin/env node
// Claude Code PreToolUse adapter for the shared secret-leak-guard core.
//
// Invoked by Claude Code as an external hook command. Reads the tool call as JSON
// on stdin ({tool_name, tool_input}), calls the core, and prints the deny JSON on
// stdout (or nothing = allow). Exits 0 in every path: deny is signaled via the JSON
// payload, never via exit code (matches the bash hook contract).
//
// FAIL-OPEN: any error (missing core, bad JSON, thrown rule) -> exit 0, no deny
// output, a one-line stderr note. A disabled guard degrades to allow + warn rather
// than blocking the agent (operator decision, 2026-07-29).

let input = "";
for await (const chunk of process.stdin) input += chunk;

try {
  const { checkBash, checkRead } = await import("../core/rules.mjs");
  let payload = {};
  try { payload = JSON.parse(input || "{}"); } catch { /* unparseable -> allow */ }
  const tool = payload.tool_name ?? "";
  const ti = payload.tool_input ?? {};
  let reason = null;
  if (tool === "Bash") {
    reason = checkBash(typeof ti.command === "string" ? ti.command : "");
  } else if (tool === "Read") {
    const p = ti.file_path ?? ti.path;
    reason = checkRead(typeof p === "string" ? p : "");
  }
  if (reason) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }));
  }
} catch (e) {
  process.stderr.write(`secret-leak-guard: disabled (core load failed: ${e?.message ?? e}); failing open\n`);
}

process.exit(0);

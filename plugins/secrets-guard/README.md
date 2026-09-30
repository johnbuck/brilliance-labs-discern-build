# secrets-guard

One maintained codebase for the secret-leak guard, shared across Claude Code, OpenCode,
and pi. Edit a rule once in the core; all three harnesses update. Spec:
`homelab/backlog/2026-07-29-shared-secret-leak-guard-codebase.md`.

## Layout

```
secrets-guard/
├── core/rules.mjs        # the single source of truth: checkBash(cmd), checkRead(path)
├── core/cases.mjs        # the deny/allow case battery (shared by the parity test)
├── adapters/
│   ├── claude.mjs        # Claude Code: node CLI hook (JSON stdin -> deny JSON stdout)
│   ├── opencode.js       # OpenCode: plugin (tool.execute.before, throws on deny)
│   └── pi.ts             # pi: extension (tool_call -> {block:true,reason})
├── config/claude-hook.snippet.json   # settings.json PreToolUse entry install.sh merges
├── install.sh            # detects harnesses, deploys adapter + core to each
└── tests/parity.mjs      # CI gate: core == bash hook AND every adapter == core
```

The core is plain JS with no dependencies. The Claude adapter runs it directly with
`node`; the OpenCode plugin imports it (Bun); the pi extension imports it (jiti).

## Verify

```
node --experimental-strip-types tests/parity.mjs
```

Gates that the core agrees with the canonical Claude bash hook
(`../claude/hooks/secret-leak-guard.sh`) and that every adapter agrees with the core,
across the full case battery. Any mismatch exits non-zero.

## Deploy model (install.sh)

Each adapter imports the core via `../core/rules.mjs` for in-repo testing. At install
time, `install.sh` deploys the adapter as a top-level file in the harness's discovery
dir and deploys the core as a sibling named `secrets-guard-rules.mjs`, rewriting the
adapter's import to `./secrets-guard-rules.mjs`. One source, fanned out per harness:

| Harness | Adapter | Core | Wired by |
|---|---|---|---|
| Claude | `~/.claude/hooks/secrets-guard.mjs` | `~/.claude/hooks/secrets-guard-rules.mjs` | settings.json PreToolUse (jq merge) |
| OpenCode | `~/.config/opencode/plugins/secret-guard.js` | `…/secrets-guard-rules.mjs` | auto-loaded from plugins/ |
| pi | `~/.pi/agent/extensions/secret-leak-guard.ts` | `…/secrets-guard-rules.mjs` | auto-discovered from extensions/ |

Fail-open policy: if the core cannot load (or `node` is missing for Claude), the guard
degrades to allow with a one-line warning rather than blocking the agent.

## Retiring the old files

After `install.sh` deploys and the end-to-end checks pass, the three previous
implementations are removed: `claude/hooks/secret-leak-guard.sh`,
`opencode/plugins/guardrails.js` (its secret-leak body; the OC-specific
catastrophic list and nudges are preserved inside `adapters/opencode.js`), and the
inline rules in `pi/extensions/secret-leak-guard.ts`.

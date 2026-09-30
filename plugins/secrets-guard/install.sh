#!/usr/bin/env bash
# Deploy the shared secrets-guard adapters + core into each detected harness.
#
# For each harness present under $HOME, deploys the matching adapter as a top-level
# file in that harness's discovery dir, plus the core as a sibling named
# secrets-guard-rules.mjs, with the adapter's `../core/rules.mjs` import rewritten to
# `./secrets-guard-rules.mjs`. For Claude, also idempotently wires the PreToolUse hook
# in settings.json (jq). Overwrites are backed up. Never touches credentials/state.
#
# Usage: ./install.sh [--harness claude|opencode|pi|all]   (default: all detected)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP="$HOME/.secrets-guard-backups/import-$TS"

say() { printf '\033[36m==>\033[0m %s\n' "$1"; }

# Parse --harness (default: auto-detect all).
WANT="auto"
for arg in "$@"; do
  case "$arg" in
    --harness) : ;; # value handled below
    claude|opencode|pi|all|auto) WANT="$arg" ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

backup() {
  [ -e "$1" ] || return 0
  local rel="${1#$HOME/}"
  mkdir -p "$BACKUP/$(dirname "$rel")"
  cp -r "$1" "$BACKUP/$rel"
}

# deploy <adapter-rel> <dst-adapter> <dst-core>
# Copies core verbatim; copies adapter with its core import rewritten to the sibling.
deploy() {
  local adapter="$REPO/$1" dst_adapter="$2" dst_core="$3"
  [ -f "$adapter" ] || { echo "missing adapter: $adapter" >&2; exit 1; }
  mkdir -p "$(dirname "$dst_adapter")"
  backup "$dst_adapter"; backup "$dst_core"
  # core sibling first (so the adapter's import resolves the moment it lands)
  cp "$REPO/core/rules.mjs" "$dst_core"
  local core_bn; core_bn="$(basename "$dst_core")"
  sed "s#\.\./core/rules\.mjs#./$core_bn#g" "$adapter" > "$dst_adapter"
  say "deployed $(basename "$dst_adapter") + $core_bn -> $(dirname "$dst_adapter")"
}

deploy_claude() {
  local d="$HOME/.claude/hooks"
  deploy adapters/claude.mjs "$d/secrets-guard.mjs" "$d/secrets-guard-rules.mjs"
  chmod +x "$d/secrets-guard.mjs"
  # the old bash hook is superseded; remove it (it's backed up first).
  backup "$d/secret-leak-guard.sh"; rm -f "$d/secret-leak-guard.sh"
  merge_claude_settings
}

merge_claude_settings() {
  local s="$HOME/.claude/settings.json"
  [ -f "$s" ] || { say "no claude settings.json; leaving hook unwired"; return; }
  backup "$s"
  local cmd="node $HOME/.claude/hooks/secrets-guard.mjs"
  jq --arg cmd "$cmd" '
    .hooks = (.hooks // {})
    | .hooks.PreToolUse = (
        (.hooks.PreToolUse // [])
        | map(select([.hooks[]?.command] | any(test("secret.*guard")) | not))
      )
    | .hooks.PreToolUse += [{"matcher":"Bash|Read","hooks":[{"type":"command","command":$cmd}]}]
  ' "$s" > "$s.tmp" && mv "$s.tmp" "$s"
  say "claude settings.json PreToolUse wired -> $cmd"
}

deploy_opencode() {
  local base="$HOME/.config/opencode"; [ -d "$HOME/.config/opencode" ] || base="$HOME/.opencode"
  [ -d "$base" ] || { say "no opencode config dir; skipping"; return; }
  local d="$base/plugins"
  # overwrite the existing plugin name so OpenCode loads exactly one (core-backed) plugin.
  deploy adapters/opencode.js "$d/guardrails.js" "$d/secrets-guard-rules.mjs"
}

deploy_pi() {
  local d="$HOME/.pi/agent/extensions"
  [ -d "$HOME/.pi/agent" ] || { say "no ~/.pi/agent; skipping"; return; }
  # overwrite the existing extension name so pi discovers exactly one (core-backed) extension.
  deploy adapters/pi.ts "$d/secret-leak-guard.ts" "$d/secrets-guard-rules.mjs"
}

say "secrets-guard install (backups -> $BACKUP)"

run="no"
if [ "$WANT" = "all" ] || [ "$WANT" = "auto" ] || [ "$WANT" = "claude" ]; then
  if [ -d "$HOME/.claude" ]; then deploy_claude; run="yes"; elif [ "$WANT" = "claude" ]; then echo "no ~/.claude" >&2; fi
fi
if [ "$WANT" = "all" ] || [ "$WANT" = "auto" ] || [ "$WANT" = "opencode" ]; then
  if [ -d "$HOME/.config/opencode" ] || [ -d "$HOME/.opencode" ]; then deploy_opencode; run="yes"; elif [ "$WANT" = "opencode" ]; then echo "no opencode config" >&2; fi
fi
if [ "$WANT" = "all" ] || [ "$WANT" = "auto" ] || [ "$WANT" = "pi" ]; then
  if [ -d "$HOME/.pi/agent" ]; then deploy_pi; run="yes"; elif [ "$WANT" = "pi" ]; then echo "no ~/.pi/agent" >&2; fi
fi

[ "$run" = "yes" ] || { say "no harnesses detected; nothing deployed"; exit 0; }

cat <<EOF

Done. Overwrites backed up to $BACKUP.
- Claude: reload Claude Code to pick up the new hook.
- OpenCode: restart OpenCode to reload the plugin.
- pi: start a new session (or /reload) to pick up the extension.
EOF

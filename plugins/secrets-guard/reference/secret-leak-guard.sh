#!/usr/bin/env bash
# secret-leak-guard — PreToolUse guard (Bash + Read) that hard-blocks the highest-
# confidence "leak a secret value into context" commands. Companion to the
# `secret-hygiene` skill: the skill teaches the discipline, this is the backstop.
#
# Global install (recommended — never-leak is universal). In ~/.claude/settings.json:
#   { "hooks": { "PreToolUse": [ { "matcher": "Bash|Read",
#       "hooks": [ { "type": "command",
#         "command": "$HOME/.claude/hooks/secret-leak-guard.sh" } ] } ] } }
#
# Designed for PRECISION over coverage: only patterns that are almost always a leak
# are denied, so it rarely false-positives on legitimate work. It explicitly ALLOWS
# the safe forms the skill recommends (infisical run / export --output-file /
# `set … >/dev/null` / `grep -q` / `awk -F= '{print $1}'` / `… | wc -c`). The deny
# reason never echoes the command (which may itself contain a secret), only the rule.
#
# KNOWN LIMITATION: it scans the whole command string, so a command that merely
# CONTAINS a trigger phrase as quoted text — e.g. `git commit -m "...infisical
# secrets get..."` while documenting these very patterns — is also blocked. This is
# a safe-fail; distinguishing execution from a quoted literal by regex isn't
# reliable, and a carve-out would be a bypass hole. Workaround: put the text in a
# file (`git commit -F msg`) or use the Write tool — neither is matched.
#
# KNOWN RESIDUALS (by design — the skill covers these behaviorally; not denied here
# because a precise rule would break a recommended safe form or over-block):
#   - `awk '{print}' file` (awk must stay allowed for the safe `awk -F= '{print $1}'`)
#   - programmatic reads: `python -c "open('.env')…"`, `node -e`, `perl -e`
#   - `infisical run -- printenv` (dumps the injected env)
#   - shell read-loop `while read … < .env`
# Tested 105/105 deny+allow cases (evasion variants, false-positive checks, edge cases).
#
# 2026-07-20: added the Hermes/agent config.yaml rule (is_agent_config_path /
# touches_agent_config). Those files (…/data/config.yaml, /opt/data/config.yaml) mix
# plain settings with inline secrets — dashboard basic_auth.password, custom-provider
# API keys, bot tokens — but is_secret_file misses them by name. Scoped to an agent-data
# location or a read from inside a hermes-* container so generic config.yaml stays
# readable. +30 deny+allow cases green.

set -euo pipefail
set -f   # no globbing — the token loops iterate $cmd unquoted on purpose

input="$(cat)"
tool="$(printf '%s' "$input" | jq -r '.tool_name // ""')"

deny() {
  jq -n --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

# Is a (basename of a) path a credential/secret FILE? Excludes docs + templates so
# SECRETS.md, *.md, and *.env.example stay readable.
is_secret_file() {
  local bn; bn="$(basename "$1" | tr -d "\"'")"
  case "$bn" in
    *.example|*.sample|*.template|*.dist|*.md|*.markdown|*.rst|*.pub) return 1 ;;
  esac
  printf '%s' "$bn" | grep -Eq '(^\.env$|^\.env\.|\.env$)' && return 0
  printf '%s' "$bn" | grep -Eq '\.(pem|key|p12|pfx|jks|keystore|kdbx|asc|gpg)$' && return 0
  printf '%s' "$bn" | grep -Eq '^id_(rsa|ed25519|ecdsa|dsa)$' && return 0
  printf '%s' "$bn" | grep -Eq '^(\.netrc|\.npmrc|\.pgpass|\.git-credentials|auth\.json|credentials|credentials\.json|\.credentials\.json)$' && return 0
  printf '%s' "$bn" | grep -Eiq '(secret|credential).*\.(json|ya?ml|env|conf|cfg|ini|txt|properties|tfvars)$' && return 0
  return 1
}

# A Hermes/agent config.yaml embeds INLINE secrets (dashboard basic_auth.password,
# custom-provider API keys, bot tokens) yet is named plainly, so is_secret_file misses
# it. Match it by its agent-data location: <…>/data/config.yaml or /opt/data/config.yaml.
is_agent_config_path() {
  case "$(printf '%s' "$1" | tr -d "\"'")" in
    */data/config.yaml|*/data/config.yml|/opt/data/config.yaml|/opt/data/config.yml) return 0 ;;
  esac
  return 1
}

# --- Read tool: block reading a credential file (Read == cat for leak purposes) ---
if [ "$tool" = "Read" ]; then
  path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""')"
  if [ -n "$path" ] && is_secret_file "$path"; then
    deny "secret-leak-guard: reading a credential file surfaces its values into context. Don't read it — check presence/length instead (e.g. \`grep -q '^NAME=' file\`, \`… | wc -c\`), or inject the value with \`infisical run -- <cmd>\`. (Allowed for *.example/*.md.)"
  fi
  if [ -n "$path" ] && is_agent_config_path "$path"; then
    deny "secret-leak-guard: a Hermes/agent config.yaml embeds inline secrets (dashboard basic_auth password, provider API keys, bot tokens). Don't read the whole file — grep one key's presence (\`grep -q '^  password:' file\`), list top-level keys (\`grep -E '^[a-z]' file\`), or copy it and strip secret lines before reading."
  fi
  exit 0
fi

[ "$tool" = "Bash" ] || exit 0
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"
[ -n "$cmd" ] || exit 0

has() { printf '%s' "$cmd" | grep -Eq -- "$1"; }   # -- so patterns may start with '-'
# stdout redirect present (>, >>, 1>, &>) — NOT just 2>/&-to-stderr
has_stdout_redirect() { printf '%s' "$cmd" | grep -Eq '(&>|1>|(^|[^0-9&])>)'; }
# a non-printing grep flag (presence/count only — safe)
grep_is_safe() { printf '%s' "$cmd" | grep -Eq -- '(^|[[:space:]])-[A-Za-z]*[qlcL]|--quiet|--silent|--files-with-matches|--count'; }
# does any bare argument of the command name a credential file? (handles dd's if=FILE)
touches_secret_file() {
  local tok t
  for tok in $cmd; do
    t="${tok%\"}"; t="${t#\"}"; t="${t%\'}"; t="${t#\'}"; t="${t#if=}"
    case "$t" in -*|'') continue ;; esac
    is_secret_file "$t" && return 0
  done
  return 1
}
# does the command print a Hermes/agent config.yaml? (inline secrets — see
# is_agent_config_path). Matches an agent-config token, or a read from inside a
# hermes-* container / `-u hermes` exec that names a config.ya?ml.
touches_agent_config() {
  local tok t
  for tok in $cmd; do
    t="${tok%\"}"; t="${t#\"}"; t="${t%\'}"; t="${t#\'}"
    is_agent_config_path "$t" && return 0
  done
  if { has 'hermes-[A-Za-z0-9_-]+' || has '(^|[[:space:]])-u[[:space:]]+hermes([[:space:]]|$)'; } \
     && has '(^|[^[:alnum:]_-])config\.ya?ml'; then
    return 0
  fi
  return 1
}

# ── Infisical (the incident class) ───────────────────────────────────────────
if has 'infisical[[:space:]]+secrets[[:space:]]+get'; then
  deny "secret-leak-guard: \`infisical secrets get\` prints the value to stdout (context). Inject it with \`infisical run -- <cmd>\`, or export to a chmod-600 file with \`--output-file\`."
fi
# bare list: `infisical secrets` not followed by a write/folder subcommand
if has 'infisical[[:space:]]+secrets([[:space:]]+(--|$|-)|[[:space:]]*$)' \
   && ! has 'infisical[[:space:]]+secrets[[:space:]]+(set|delete|folders)'; then
  deny "secret-leak-guard: listing Infisical secrets prints every value to stdout (context). Read names only (\`infisical export --output-file=f && awk -F= '{print \$1}' f\`) or inject with \`infisical run\`."
fi
if has 'infisical[[:space:]]+export' && ! has '--output-file' && ! has_stdout_redirect; then
  deny "secret-leak-guard: \`infisical export\` dumps all values to stdout. Use \`--output-file=<chmod-600 file>\` (preferred) or redirect to a file — never to the terminal."
fi
if has 'infisical[[:space:]]+secrets[[:space:]]+(set|delete)' && ! has_stdout_redirect; then
  deny "secret-leak-guard: \`infisical secrets set/delete\` can echo a confirmation containing the value. Append \`>/dev/null 2>&1\` (the value goes via --file/stdin, never argv). \`--silent\` does NOT hide it."
fi
if has '\-\-plain' && has 'infisical[[:space:]]+(secrets|export)'; then
  deny "secret-leak-guard: \`--plain\` on infisical secrets/export prints clean machine-readable values to stdout. (\`--plain\` is fine on \`infisical login\` to capture a token.)"
fi
if has 'infisical[[:space:]]+secrets[[:space:]]+set' && has '--value([[:space:]]|=)'; then
  deny "secret-leak-guard: \`--value\` puts the secret in argv (ps/history). Use \`--file=<dotenv>\` or stdin instead."
fi

# ── curl against the secret API ──────────────────────────────────────────────
if has '\bcurl\b' && has '("?(secretValue|clientSecret)"?[[:space:]]*:)' && ! has '-d[[:space:]]*@' && ! has '--data[[:space:]]*@'; then
  deny "secret-leak-guard: a clientSecret/secretValue inline in \`-d '{...}'\` lands in argv (ps). Send the body from a chmod-600 file: \`-d @body.json\` (build it with \`jq -n --arg\`)."
fi
if has '\bcurl\b' && has '(secrets/raw|universal-auth/login)' \
   && ! has '\|' && ! has_stdout_redirect && ! has '-o[[:space:]]' && ! has '--output'; then
  deny "secret-leak-guard: this curl returns plaintext secrets/token to stdout (context). Pipe it through \`jq\` to extract only what you need, or write the body to a chmod-600 file."
fi

# ── shell tracing of an auth/secret flow ─────────────────────────────────────
if has '(set[[:space:]]+-[A-Za-z]*x|(bash|sh)[[:space:]]+-[A-Za-z]*x)' \
   && has '(infisical|client-?[Ss]ecret|secretValue|Authorization|Bearer|token=|clientSecret)'; then
  deny "secret-leak-guard: \`-x\`/\`set -x\` traces every command including secret args. Don't trace auth/secret flows; use controlled output instead."
fi

# ── cat-family / pagers reading a credential file ────────────────────────────
if has '(^|[^[:alnum:]_-])(cat|bat|tac|nl|head|tail|less|more|most|view|xxd|hexdump|od|strings)([[:space:]])' \
   && touches_secret_file; then
  deny "secret-leak-guard: printing a credential file dumps its values into context. Use \`awk -F= '{print \$1}' file\` (names), \`wc -l file\` (count), or \`grep -q '^NAME=' file\` (presence). (Allowed for *.example/*.md.)"
fi

# ── grep that would print value lines from a credential file ─────────────────
if has '(^|[^[:alnum:]_-])(grep|egrep|fgrep|rg|ag)([[:space:]])' && ! grep_is_safe && touches_secret_file; then
  deny "secret-leak-guard: grepping a credential file prints matching value lines into context. Use \`grep -q\`/\`-l\`/\`-c\` (presence/count only) or \`awk -F= '{print \$1}' file\` for names."
fi

# ── sed (without -i) / dd (without of=) reading a credential file to stdout ───
if has '(^|[^[:alnum:]_-])sed([[:space:]])' && ! has '(^|[[:space:]])-i' && touches_secret_file; then
  deny "secret-leak-guard: \`sed\` without \`-i\` prints the credential file to stdout (context). Edit in place with \`-i\`, or read names with \`awk -F= '{print \$1}' file\`."
fi
if has '(^|[^[:alnum:]_-])dd([[:space:]])' && ! has 'of=' && touches_secret_file; then
  deny "secret-leak-guard: \`dd\` reading a credential file with no \`of=\` prints it to stdout (context). Don't — check presence/length instead."
fi

# ── read-family printing a Hermes/agent config.yaml (inline secrets) ─────────
# A config.yaml under an agent data dir (or read from inside a hermes-* container)
# mixes non-secret settings with plaintext credentials. is_secret_file misses it
# (plain name), so match it here and block any read that would print its contents.
if touches_agent_config \
   && { has '(^|[^[:alnum:]_-])(cat|bat|tac|nl|head|tail|less|more|most|view|xxd|hexdump|od|strings)([[:space:]])' \
        || { has '(^|[^[:alnum:]_-])(grep|egrep|fgrep|rg|ag)([[:space:]])' && ! grep_is_safe; } \
        || { has '(^|[^[:alnum:]_-])sed([[:space:]])' && ! has '(^|[[:space:]])-i'; }; }; then
  deny "secret-leak-guard: a Hermes/agent config.yaml embeds inline secrets (dashboard basic_auth password, provider API keys, bot tokens). Don't print it into context. Check a key's presence with \`grep -q '^  password:' file\`, edit in place with \`sed -i\`, or copy the file and strip secret lines before reading non-secret values."
fi

# ── full env dump that includes secrets ──────────────────────────────────────
# `printenv`/`env` with NO args (whole environment) and not piped to a length check.
if has '(^|[;&][[:space:]]*)(printenv|env)([[:space:]]*$|[[:space:]]*[;&])'; then
  deny "secret-leak-guard: a bare \`printenv\`/\`env\` dumps every variable (incl. secrets) to context. Check one var's length instead: \`printenv NAME | wc -c\`."
fi
if has 'docker[[:space:]]+(exec|run)[^|]*[[:space:]](env|printenv)([[:space:]]*$|[[:space:]]*['"'"'"]?$)' && ! has 'wc[[:space:]]+-c'; then
  deny "secret-leak-guard: dumping a container's full environment surfaces its secrets. Check one var's length: \`docker exec <c> sh -c 'printenv NAME | wc -c'\`."
fi
# docker inspect dumps Config.Env (injected secrets) unless --format picks
# non-env fields. Added 2026-09-17 after an advisor leaked a live key this way.
if has 'docker[[:space:]]+inspect'; then
  fmt=$(printf '%s' "$cmd" | grep -oE -- '(--format|-f)([[:space:]]*=|[[:space:]]+).{0,200}' | head -1 || true)
  if [ -z "$fmt" ] || printf '%s' "$fmt" | grep -q 'Env'; then
    deny "secret-leak-guard: bare \`docker inspect\` prints the container's full Config.Env (injected secrets). Use \`--format\` with non-env fields, e.g. \`docker inspect -f '{{.State.Status}} {{.Name}}' <c>\`; for one env var: \`docker exec <c> sh -c 'printenv NAME | wc -c'\`."
  fi
fi
# ── process argv / environ dumps (the read side) ─────────────────────────────
# A running process's argv (`ps`/`pgrep -a`) or its /proc environ can hold a secret
# passed on a command line — an injected `infisical run --token=<JWT>`, a `--password=`,
# a curl `-d '{"clientSecret":…}'`. Listing them surfaces that value into context.
# Liveness checks that DON'T print args stay allowed: `pgrep NAME`, `pgrep -l`,
# `pidof`, `docker ps`, `ps -o pid,stat,comm`.
if has '(^|[^[:alnum:]_-])pgrep[[:space:]][^|;&]*(-[A-Za-z]*a[A-Za-z]*|--list-full)'; then
  deny "secret-leak-guard: \`pgrep -a\`/\`--list-full\` prints each process's full command line, which can hold a secret passed in argv (e.g. an injected \`--token=\`). Get PIDs only (\`pgrep NAME\`) or names (\`pgrep -l\`)."
fi
if has '(^|[^[:alnum:]_-])ps[[:space:]]+-?[A-Za-z]*a[A-Za-z]*x' \
   || has '(^|[^[:alnum:]_-])ps[[:space:]]+[^|;&]*-[A-Za-z]*([eA][A-Za-z]*[fF]|[fF][A-Za-z]*[eA])' \
   || has '(^|[^[:alnum:]_-])ps[[:space:]]+[^|;&]*-o[[:space:]]*[^|;&]*(args|command|cmd)([^A-Za-z]|$)'; then
  deny "secret-leak-guard: this \`ps\` shows other processes' full command lines (the args column), which can hold a secret passed in argv (e.g. an injected \`--token=\`). Use an args-free format (\`ps -o pid,stat,comm\`) or check a specific PID."
fi
if has '/proc/[^/[:space:]]+/environ' \
   || { has '/proc/[^/[:space:]]+/cmdline' && has '(^|[^[:alnum:]_-])(cat|bat|tac|nl|head|tail|less|more|most|view|xxd|hexdump|od|strings|tr|grep|egrep|fgrep|rg|ag|xargs)([[:space:]])'; }; then
  deny "secret-leak-guard: reading \`/proc/<pid>/environ\` or \`cmdline\` dumps that process's environment or arguments, which routinely include secrets. Don't read it; there is almost always a targeted check that doesn't."
fi

exit 0

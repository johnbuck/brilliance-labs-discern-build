// secrets-guard core — the single source of truth for secret-leak deny rules.
//
// Pure JS (no deps, no types) so it is: run directly by `node` as the Claude
// hook CLI, imported natively by the OpenCode plugin (Bun), and imported by the
// pi extension (jiti). All three adapters call checkBash()/checkRead() from here.
//
// Logic ported verbatim from the pi TS extension (verified equivalent to the
// Claude bash hook on an 84-case differential test). DESIGN notes carried over:
//  - PRECISION OVER COVERAGE: only near-certain leaks are denied; safe forms are
//    explicitly allowed (infisical run / --output-file / set >/dev/null / grep -q
//    / awk -F= '{print $1}' / | wc -c).
//  - The deny reason never echoes the command (it may contain a secret).
//  - KNOWN LIMITATION: the whole command string is scanned, so a trigger phrase
//    appearing as quoted text is also blocked (safe-fail).
//  - KNOWN RESIDUALS (behavioral, not denied): awk '{print}' file, programmatic
//    reads (python -c / node -e / perl -e), infisical run -- printenv, read-loops.

// Basename of a path with surrounding quotes stripped (port of the shell's tr -d).
function baseName(p) {
  const stripped = p.replace(/["']/g, "");
  const slash = stripped.lastIndexOf("/");
  return slash >= 0 ? stripped.slice(slash + 1) : stripped;
}

// True if a path's basename looks like a credential/secret FILE. Excludes docs +
// templates (*.example, *.md, *.pub, ...) so SECRETS.md / *.env.example stay readable.
export function isSecretFile(rawPath) {
  const bn = baseName(rawPath);
  if (/\.(example|sample|template|dist|md|markdown|rst|pub)$/.test(bn)) return false;
  if (/(^\.env$|^\.env\.|\.env$)/.test(bn)) return true;
  if (/\.(pem|key|p12|pfx|jks|keystore|kdbx|asc|gpg)$/.test(bn)) return true;
  if (/^id_(rsa|ed25519|ecdsa|dsa)$/.test(bn)) return true;
  if (/^(\.netrc|\.npmrc|\.pgpass|\.git-credentials|auth\.json|credentials|credentials\.json|\.credentials\.json)$/.test(bn)) return true;
  if (/(secret|credential).*\.(json|ya?ml|env|conf|cfg|ini|txt|properties|tfvars)$/i.test(bn)) return true;
  return false;
}

// A Hermes/agent config.yaml embeds INLINE secrets but is named plainly.
// Matches <...>/data/config.ya?ml (covers /opt/data/config.ya?ml too).
function isAgentConfigPath(rawPath) {
  return /\/data\/config\.ya?ml$/.test(rawPath.replace(/["']/g, ""));
}

// Strip one surrounding quote char from each end (port of the shell's
// ${tok%\"}${tok#\"}${tok%\'}${tok#\'}).
function stripQuotes(tok) {
  let t = tok;
  if (t.endsWith('"')) t = t.slice(0, -1);
  if (t.startsWith('"')) t = t.slice(1);
  if (t.endsWith("'")) t = t.slice(0, -1);
  if (t.startsWith("'")) t = t.slice(1);
  return t;
}

// Does any bare (non-flag) token name a credential file? Handles dd's `if=FILE`.
function touchesSecretFile(cmd) {
  for (const tok of cmd.split(/\s+/)) {
    const t = stripQuotes(tok).replace(/^if=/, "");
    if (t === "" || t.startsWith("-")) continue;
    if (isSecretFile(t)) return true;
  }
  return false;
}

// Does the command reference a Hermes/agent config.yaml (inline secrets)?
function touchesAgentConfig(cmd) {
  for (const tok of cmd.split(/\s+/)) {
    if (isAgentConfigPath(stripQuotes(tok))) return true;
  }
  if ((/hermes-[A-Za-z0-9_-]+/.test(cmd) || /(^|\s)-u\s+hermes(\s|$)/.test(cmd))
    && /(^|[^A-Za-z0-9_-])config\.ya?ml/.test(cmd)) {
    return true;
  }
  return false;
}

// Read tool: returns the deny reason, or null = allow.
export function checkRead(path) {
  if (!path) return null;
  if (isSecretFile(path)) {
    return "secret-leak-guard: BLOCKED (command did not run) — reading a credential file would put its values into context. The file may still be USED, just never displayed: `source <file>` loads it into env silently, `infisical run -- <cmd>` injects values, `grep -q '^NAME=' <file>` checks presence, `wc -c < <file>` checks length. Files ending in .example or .md are not blocked.";
  }
  if (isAgentConfigPath(path)) {
    return "secret-leak-guard: BLOCKED (command did not run) — a Hermes/agent config.yaml embeds inline secrets (dashboard basic_auth password, provider API keys, bot tokens), so reading the whole file leaks them into context. Instead: check one key's presence (`grep -q '^  password:' <file>`), list top-level keys (`grep -E '^[a-z]' <file>`), or copy the file and strip secret lines before reading.";
  }
  return null;
}

// Bash tool: returns the first matching deny reason, or null = allow.
// Rule order matches the shell hook (first match wins).
const CAT_FAMILY = /(^|[^A-Za-z0-9_-])(cat|bat|tac|nl|head|tail|less|more|most|view|xxd|hexdump|od|strings)(\s)/;
const GREP_FAMILY = /(^|[^A-Za-z0-9_-])(grep|egrep|fgrep|rg|ag)(\s)/;
const SED_PRESENT = /(^|[^A-Za-z0-9_-])sed(\s)/;
const DD_PRESENT = /(^|[^A-Za-z0-9_-])dd(\s)/;

export function checkBash(cmd) {
  if (!cmd) return null;
  const has = (re) => re.test(cmd);
  const stdoutRedirect = has(/(&>|1>|(^|[^0-9&])>)/);
  const grepSafe = has(/(^|\s)-[A-Za-z]*[qlcL]|--quiet|--silent|--files-with-matches|--count/);
  const catFamily = has(CAT_FAMILY);
  const grepFamily = has(GREP_FAMILY);
  const sedPresent = has(SED_PRESENT);
  const ddPresent = has(DD_PRESENT);

  // Infisical (the incident class)
  if (has(/infisical\s+secrets\s+get/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — `infisical secrets get` prints the secret value to stdout, which lands in context. The secret can still be USED, just never printed: `infisical run -- <cmd>` injects it as an env var, or `infisical export --output-file=<path>` writes it to a chmod-600 file you can use without displaying.";
  }
  if (has(/infisical\s+secrets(\s+(--|$|-)|\s*$)/) && !has(/infisical\s+secrets\s+(set|delete|folders)/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — listing Infisical secrets prints every value to stdout, which lands in context. For the NAMES only: `infisical export --output-file=f && awk -F= '{print $1}' f && rm f`. To use a value: `infisical run -- <cmd>`.";
  }
  if (has(/infisical\s+export/) && !has(/--output-file/) && !stdoutRedirect) {
    return "secret-leak-guard: BLOCKED (command did not run) — `infisical export` without `--output-file` dumps all values to stdout. Re-run the SAME command with `--output-file=<path>` added (the CLI creates it chmod 600), then use the file without printing it.";
  }
  if (has(/infisical\s+secrets\s+(set|delete)/) && !stdoutRedirect) {
    return "secret-leak-guard: BLOCKED (command did not run) — `infisical secrets set/delete` echoes a confirmation that can contain the value. Re-run the SAME command with `>/dev/null 2>&1` appended (`--silent` does NOT suppress it), and pass the value via `--file=<path>` or stdin, never on the command line.";
  }
  if (has(/--plain/) && has(/infisical\s+(secrets|export)/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — this guard matches the WHOLE command string, and this one contains both `--plain` and `infisical secrets/export`; `--plain` there prints raw secret values to stdout. `--plain` IS allowed on `infisical login` — but not in the same Bash call as a secrets/export invocation. Fix: split the login and the export into two separate Bash calls, or drop `--plain` and use `infisical export --output-file=<path>`.";
  }
  if (has(/infisical\s+secrets\s+set/) && has(/--value(\s|=)/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — `--value` puts the secret in the process argv, visible to `ps` and shell history. Re-run passing the value via `--file=<dotenv-file>` or stdin instead.";
  }

  // curl against the secret API
  if (has(/\bcurl\b/) && has(/("?(secretValue|clientSecret)"?\s*:)/) && !has(/-d\s+@/) && !has(/--data\s+@/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — a clientSecret/secretValue written inline in `-d '{...}'` lands in argv, visible to `ps`. Build the body in a chmod-600 file (`jq -n --arg k \"$VAR\" '{...}' > body.json`) and re-run with `-d @body.json`.";
  }
  if (has(/\bcurl\b/) && has(/(secrets\/raw|universal-auth\/login)/) && !has(/\|/) && !stdoutRedirect && !has(/-o\s/) && !has(/--output/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — this curl returns plaintext secrets/tokens to stdout, which lands in context. Re-run writing the response to a chmod-600 file (`-o resp.json` after `umask 077`), or pipe through `jq` to extract only non-secret fields.";
  }

  // shell tracing of an auth/secret flow
  if (has(/(set\s+-[A-Za-z]*x|(bash|sh)\s+-[A-Za-z]*x)/) && has(/(infisical|client-?[Ss]ecret|secretValue|Authorization|Bearer|token=|clientSecret)/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — `-x`/`set -x` traces every expanded command, including secret arguments, into output. Remove the trace flag and debug by echoing non-secret variables only. (This guard matches the whole command string — if the secret-related word only appears in quoted text, rephrase or split the command.)";
  }

  // cat-family / pagers reading a credential file
  if (catFamily && touchesSecretFile(cmd)) {
    return "secret-leak-guard: BLOCKED (command did not run) — displaying a credential file dumps its values into context. To USE the values without displaying them: `source <file>` or `infisical run -- <cmd>`. To inspect safely: `awk -F= '{print $1}' <file>` (names only), `grep -q '^NAME=' <file>` (presence), `wc -l <file>` (count). Files ending in .example or .md are not blocked.";
  }

  // grep that would print value lines from a credential file
  if (grepFamily && !grepSafe && touchesSecretFile(cmd)) {
    return "secret-leak-guard: BLOCKED (command did not run) — grepping a credential file prints the matching value lines into context. Re-run the SAME grep with `-q` (presence via exit code), `-c` (count) or `-l` (filenames only), or list key names with `awk -F= '{print $1}' <file>`.";
  }

  // sed (without -i) / dd (without of=) reading a credential file to stdout
  if (sedPresent && !has(/(^|\s)-i/) && touchesSecretFile(cmd)) {
    return "secret-leak-guard: BLOCKED (command did not run) — `sed` without `-i` prints the credential file to stdout, which lands in context. To edit it, re-run the SAME sed with `-i` (in place, no output). To read key names: `awk -F= '{print $1}' <file>`.";
  }
  if (ddPresent && !has(/of=/) && touchesSecretFile(cmd)) {
    return "secret-leak-guard: BLOCKED (command did not run) — `dd` reading a credential file with no `of=` writes its contents to stdout, which lands in context. Add `of=<destination>` if you are copying it, or check size/presence with `wc -c < <file>` instead.";
  }

  // read-family printing a Hermes/agent config.yaml (inline secrets)
  if (touchesAgentConfig(cmd) && (catFamily || (grepFamily && !grepSafe) || (sedPresent && !has(/(^|\s)-i/)))) {
    return "secret-leak-guard: BLOCKED (command did not run) — a Hermes/agent config.yaml embeds inline secrets (dashboard basic_auth password, provider API keys, bot tokens), so printing it leaks them into context. Instead: check a key's presence with `grep -q '^  password:' <file>`, edit in place with `sed -i`, or copy the file and strip secret lines before reading non-secret values.";
  }

  // full env dump that includes secrets
  if (has(/(^|[;&]\s*)(printenv|env)(\s*$|\s*[;&])/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — a bare `printenv`/`env` dumps every environment variable, including secrets, into context. Query one variable without showing it: `printenv NAME | wc -c` (length) or `test -n \"$NAME\" && echo set` (presence).";
  }
  if (has(/docker\s+(exec|run)[^|]*\s(env|printenv)(\s*$|\s*['"]?$)/) && !has(/wc\s+-c/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — dumping a container's full environment surfaces its secrets into context. Check one variable's presence/length instead: `docker exec <c> sh -c 'printenv NAME | wc -c'`.";
  }
  // docker inspect dumps Config.Env (injected secrets) unless --format
  // explicitly selects non-env fields. Added 2026-09-17 after a Paseo
  // advisor leaked a live API key this way.
  if (has(/docker\s+inspect\b/)) {
    const fmt = cmd.match(/(?:--format|-f)(\s+|=)\s*('([^']*)'|"([^"]*)")?/);
    const fmtStr = fmt ? (fmt[3] || fmt[4] || "") : "";
    if (!fmt || /Env/.test(fmtStr)) {
      return "secret-leak-guard: BLOCKED (command did not run) — bare `docker inspect` prints the container's full Config.Env (injected secrets) into context. Use `--format` selecting non-env fields, e.g. `docker inspect -f '{{.State.Status}} {{.Name}}' <c>`; for one env var use `docker exec <c> sh -c 'printenv NAME | wc -c'`.";
    }
  }

  // process argv / environ dumps (the read side)
  if (has(/(^|[^A-Za-z0-9_-])pgrep\s[^|;&]*(-[A-Za-z]*a[A-Za-z]*|--list-full)/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — `pgrep -a`/`--list-full` prints each process's full command line, which can hold a secret passed in argv (e.g. an injected `--token=`). Re-run as `pgrep NAME` (PIDs only) or `pgrep -l NAME` (PID + name, no args).";
  }
  if (has(/(^|[^A-Za-z0-9_-])ps\s+-?[A-Za-z]*a[A-Za-z]*x/)
    || has(/(^|[^A-Za-z0-9_-])ps\s+[^|;&]*-[A-Za-z]*([eA][A-Za-z]*[fF]|[fF][A-Za-z]*[eA])/)
    || has(/(^|[^A-Za-z0-9_-])ps\s+[^|;&]*-o\s*[^|;&]*(args|command|cmd)([^A-Za-z]|$)/)) {
    return "secret-leak-guard: BLOCKED (command did not run) — this `ps` form shows full command lines (the args column), which can hold a secret passed in argv (e.g. an injected `--token=`). Re-run with an args-free format: `ps -o pid,stat,comm` (add `-p <pid>` for one process).";
  }
  if (has(/\/proc\/[^/\s]+\/environ/)
    || (has(/\/proc\/[^/\s]+\/cmdline/) && has(/(^|[^A-Za-z0-9_-])(cat|bat|tac|nl|head|tail|less|more|most|view|xxd|hexdump|od|strings|tr|grep|egrep|fgrep|rg|ag|xargs)(\s)/))) {
    return "secret-leak-guard: BLOCKED (command did not run) — `/proc/<pid>/environ` and `cmdline` hold that process's environment and arguments, which routinely include secrets. For liveness/identity use `ps -o pid,stat,comm -p <pid>`; for one env var's presence, check by length inside the process's own shell/container (`printenv NAME | wc -c`).";
  }

  return null;
}

#!/usr/bin/env bash
# baton-guard — PreToolUse(Bash) guard enforcing feature-branch discipline.
#
# Install PER CONSUMER CODE-REPO (not user-global), because some repos
# (e.g. a docs repo synced to main) legitimately commit straight to main.
# Add to that repo's .claude/settings.json:
#
#   { "hooks": { "PreToolUse": [ { "matcher": "Bash",
#       "hooks": [ { "type": "command",
#         "command": "$HOME/.claude/hooks/baton-guard.sh" } ] } ] } }
#
# Denies: creating a commit while HEAD is main/master, and force-pushing to
# main/master. Allows `git merge --ff-only` (moves the ref, creates no commit)
# so the sanctioned ship step still works.

set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""')"
[ -n "$cwd" ] || cwd="$PWD"

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

branch="$(git -C "$cwd" branch --show-current 2>/dev/null || echo "")"

# force-push to a protected branch
if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+push' \
   && printf '%s' "$cmd" | grep -Eq -- '--force|--force-with-lease|-f([[:space:]]|$)' \
   && printf '%s' "$cmd" | grep -Eq '(main|master)'; then
  deny "baton-guard: force-push to a protected branch is blocked. Use a feature branch."
fi

# creating a commit while on main/master (allow ff-only merges)
if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+commit'; then
  case "$branch" in
    main|master)
      deny "baton-guard: direct commit to '$branch' is blocked. Create a feature branch first (git checkout -b <branch>)."
      ;;
  esac
fi

exit 0

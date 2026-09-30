#!/bin/bash
# Foundational developer setup for macOS: safe to run more than once.
#
#   bash setup-mac.sh [--check] [--no-python] [--no-node] [--no-react] [--no-vscode]
#                     [--git-name "Jane Doe"] [--git-email jane@example.org] [--dev-dir ~/dev] [--dry-run]
#
# Installs (skipping anything already there):
#   Xcode Command Line Tools + Homebrew (the Mac package manager)
#   Git, Node.js LTS + npm (+ common global tools), Python 3.13 via uv (+ common libraries
#   in an "everyday" environment that's switched on automatically), VS Code
#   Starter projects in ~/dev: react-starter (Vite + React + TypeScript + Tailwind),
#   python-starter (hello.py library check + app.py, a small Streamlit web app)
# Adds everything to PATH in ~/.zprofile / ~/.zshrc (and bash equivalents).
#
# Progress:  ~/dev-setup.log       Final report: ~/dev-setup-report.json
# When a password is needed, macOS shows a normal password box (never typed into a terminal).

set -uo pipefail

# ------------------------------------------------------------------- settings --
NODE_LTS_MAJOR=24
PYTHON_VERSION=3.13
NPM_GLOBALS=(typescript tsx nodemon serve prettier pnpm)
PY_LIBS=(requests python-dotenv pandas numpy matplotlib openpyxl beautifulsoup4 flask fastapi "uvicorn[standard]" jupyterlab ipykernel pytest anthropic streamlit watchdog)
# Never compile these from source: if no prebuilt package exists, fail fast with a clear message instead
BINARY_ONLY=(--only-binary pyarrow --only-binary numpy --only-binary pandas)
EVERYDAY_VENV="$HOME/.venvs/everyday"

CHECK_ONLY=0; DRY=0; DO_PY=1; DO_NODE=1; DO_REACT=1; DO_VSCODE=1
GIT_NAME=""; GIT_EMAIL=""; DEV_DIR="$HOME/dev"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK_ONLY=1 ;;
    --dry-run) DRY=1 ;;
    --no-python) DO_PY=0 ;;
    --no-node) DO_NODE=0; DO_REACT=0 ;;
    --no-react) DO_REACT=0 ;;
    --no-vscode) DO_VSCODE=0 ;;
    --git-name) GIT_NAME="$2"; shift ;;
    --git-email) GIT_EMAIL="$2"; shift ;;
    --dev-dir) DEV_DIR="${2/#\~/$HOME}"; shift ;;
    *) echo "Unknown option: $1"; exit 2 ;;
  esac
  shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$HOME/dev-setup.log"
REPORT="$HOME/dev-setup-report.json"
[[ $CHECK_ONLY -eq 0 && $DRY -eq 0 ]] && : > "$LOG"
say()  { echo "$(date '+%H:%M:%S')  $*" | tee -a "$LOG"; }
step() { echo "" | tee -a "$LOG"; say "==> $*"; }
run()  { if [[ $DRY -eq 1 ]]; then echo "   [dry-run] $*"; return 0; fi; echo "   \$ $*" >> "$LOG"; "$@" >> "$LOG" 2>&1; }
FAILED=()
fail() { say "   ✗ $*"; FAILED+=("$*"); }

# Append a line to a shell startup file once
add_line() {
  local file="$1" line="$2"
  [[ $DRY -eq 1 ]] && { echo "   [dry-run] add to $file: $line"; return; }
  touch "$file"
  grep -qxF "$line" "$file" || { printf '\n# added by dev-setup\n%s\n' "$line" >> "$file"; say "   + PATH/startup line added to ${file/#$HOME/~}"; }
}

# ------------------------------------------------------------------ checks ----
# DEVSETUP_TEST=1 + DEVSETUP_BREW_PREFIX let the script be exercised off a Mac (for testing only)
if [[ "$(uname -s)" != "Darwin" && $DRY -eq 0 && -z "${DEVSETUP_TEST:-}" ]]; then
  echo "This script is for macOS. On Windows use setup-windows.ps1."; exit 1
fi
ARCH="$(uname -m)"
BREW_PREFIX=/opt/homebrew; [[ "$ARCH" == "x86_64" ]] && BREW_PREFIX=/usr/local
[[ -n "${DEVSETUP_BREW_PREFIX:-}" ]] && BREW_PREFIX="$DEVSETUP_BREW_PREFIX"
BREW="$BREW_PREFIX/bin/brew"
# Make anything installed earlier visible to this run
export PATH="$BREW_PREFIX/bin:$BREW_PREFIX/sbin:$BREW_PREFIX/opt/node@$NODE_LTS_MAJOR/bin:$HOME/.local/bin:$PATH"

ver() { "$@" 2>/dev/null | head -1 | grep -Eo '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1; }
status_line() { printf '  %-22s %s\n' "$1" "${2:-not installed}"; }

report() {
  local clt brewv gitv nodev npmv pyv uvv codev
  clt=$(xcode-select -p >/dev/null 2>&1 && echo yes || echo "")
  brewv=$(ver brew --version); gitv=$(ver git --version); nodev=$(ver node --version); npmv=$(ver npm --version)
  pyv=$( [[ -x "$EVERYDAY_VENV/bin/python" ]] && ver "$EVERYDAY_VENV/bin/python" --version || ver python3 --version )
  uvv=$(ver uv --version); codev=$(command -v code >/dev/null && ver code --version || ([[ -d "/Applications/Visual Studio Code.app" ]] && echo installed))
  echo ""
  echo "What's on this Mac now:"
  status_line "Command Line Tools" "${clt:+installed}"
  status_line "Homebrew" "$brewv"; status_line "Git" "$gitv"
  status_line "Node.js" "$nodev"; status_line "npm" "$npmv"
  status_line "Python" "$pyv"; status_line "uv" "$uvv"; status_line "VS Code" "$codev"
  status_line "React starter" "$([[ -f "$DEV_DIR/react-starter/package.json" ]] && echo "$DEV_DIR/react-starter")"
  status_line "Python starter" "$([[ -f "$DEV_DIR/python-starter/hello.py" ]] && echo "$DEV_DIR/python-starter")"
  local fails=""; for f in "${FAILED[@]+"${FAILED[@]}"}"; do fails+="\"${f//\"/\'}\","; done
  cat > "$REPORT" <<EOF
{ "os": "macOS $(sw_vers -productVersion 2>/dev/null)", "arch": "$ARCH", "finished": "$(date '+%Y-%m-%d %H:%M')",
  "command_line_tools": "${clt}", "homebrew": "$brewv", "git": "$gitv", "node": "$nodev", "npm": "$npmv",
  "python": "$pyv", "uv": "$uvv", "vscode": "$codev", "dev_dir": "$DEV_DIR",
  "failed": [${fails%,}] }
EOF
}

if [[ $CHECK_ONLY -eq 1 ]]; then report; exit 0; fi

say "Developer setup for macOS ($ARCH) starting. Full details in $LOG"
if [[ $DRY -eq 0 && -z "${DEVSETUP_TEST:-}" ]] && ! id -Gn | grep -qw admin && [[ ! -x "$BREW" ]]; then
  say "This Mac account isn't an administrator, so Homebrew can't be installed."
  say "Ask whoever manages this Mac to make the account an admin (System Settings > Users & Groups), then run this again."
  exit 1
fi

# ------------------------------------------------------------ 1. Homebrew ----
# A tiny helper that asks for the Mac password in a normal macOS dialog box.
ASKPASS="$(mktemp "${TMPDIR:-/tmp}/devsetup-askpass.XXXXXX")"
cat > "$ASKPASS" <<'EOF'
#!/bin/bash
/usr/bin/osascript -e 'display dialog "Developer setup needs your Mac login password to install the developer tools (Homebrew). It is only used by your Mac and is not stored." default answer "" with hidden answer with title "Developer Setup" with icon caution buttons {"Cancel", "OK"} default button "OK"' -e 'text returned of result' 2>/dev/null
EOF
chmod 700 "$ASKPASS"
trap 'rm -f "$ASKPASS"' EXIT

if [[ -x "$BREW" ]]; then
  say "Homebrew already installed. Updating its package list…"
  run "$BREW" update || true
else
  step "Installing Homebrew and Apple's Command Line Tools (5–15 minutes). A password box will appear."
  if [[ $DRY -eq 1 ]]; then echo "   [dry-run] NONINTERACTIVE=1 SUDO_ASKPASS=… /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"";
  else
    installer="$(mktemp "${TMPDIR:-/tmp}/brew-install.XXXXXX")"
    if curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh -o "$installer"; then
      NONINTERACTIVE=1 SUDO_ASKPASS="$ASKPASS" /bin/bash "$installer" >> "$LOG" 2>&1 || fail "Homebrew install did not finish (see $LOG)"
    else
      fail "Couldn't download the Homebrew installer: check the internet connection"
    fi
    rm -f "$installer"
  fi
  [[ -x "$BREW" || $DRY -eq 1 ]] && say "   ✓ Homebrew installed"
fi
if [[ ! -x "$BREW" && $DRY -eq 0 ]]; then
  say "Stopping: Homebrew is required for the rest. See $LOG for details."; report; exit 1
fi
add_line "$HOME/.zprofile" "eval \"\$($BREW shellenv)\""
add_line "$HOME/.bash_profile" "eval \"\$($BREW shellenv)\""
[[ $DRY -eq 0 ]] && eval "$("$BREW" shellenv)"
export HOMEBREW_NO_ANALYTICS=1 HOMEBREW_NO_ENV_HINTS=1

brew_install() {  # formula-or-cask, friendly name
  local what="$1" name="$2" cask="${3:-}"
  if [[ -n "$cask" ]]; then
    "$BREW" list --cask "$what" >/dev/null 2>&1 && { say "   ✓ $name already installed"; return 0; }
    step "Installing $name…"; run "$BREW" install --cask "$what" && say "   ✓ $name installed" || { fail "$name install failed"; return 1; }
  else
    "$BREW" list --formula "$what" >/dev/null 2>&1 && { say "   ✓ $name already installed"; return 0; }
    step "Installing $name…"; run "$BREW" install "$what" && say "   ✓ $name installed" || { fail "$name install failed"; return 1; }
  fi
}

# ---------------------------------------------------------------- 2. Git -----
brew_install git "Git"
if [[ -n "$GIT_NAME" ]]; then run git config --global user.name "$GIT_NAME"; fi
if [[ -n "$GIT_EMAIL" ]]; then run git config --global user.email "$GIT_EMAIL"; fi
run git config --global init.defaultBranch main

# ------------------------------------------------------------- 3. Node.js ----
if [[ $DO_NODE -eq 1 ]]; then
  NODE_FORMULA="node@$NODE_LTS_MAJOR"
  "$BREW" info --formula "$NODE_FORMULA" >/dev/null 2>&1 || NODE_FORMULA="node"
  brew_install "$NODE_FORMULA" "Node.js ($NODE_FORMULA)"
  if [[ "$NODE_FORMULA" != "node" ]]; then
    add_line "$HOME/.zprofile" "export PATH=\"$BREW_PREFIX/opt/$NODE_FORMULA/bin:\$PATH\""
    add_line "$HOME/.bash_profile" "export PATH=\"$BREW_PREFIX/opt/$NODE_FORMULA/bin:\$PATH\""
    export PATH="$BREW_PREFIX/opt/$NODE_FORMULA/bin:$PATH"
  fi
  step "Installing common Node tools: ${NPM_GLOBALS[*]}"
  run npm install -g --no-fund --no-audit "${NPM_GLOBALS[@]}" && say "   ✓ Node tools installed" || fail "Some global npm tools failed"
fi

# --------------------------------------------------------------- 4. Python ---
if [[ $DO_PY -eq 1 ]]; then
  brew_install uv "uv (Python manager)"
  step "Installing Python $PYTHON_VERSION…"
  run uv python install "$PYTHON_VERSION" && say "   ✓ Python $PYTHON_VERSION installed" || fail "Python install failed"
  if [[ ! -x "$EVERYDAY_VENV/bin/python" ]]; then
    step "Creating your everyday Python environment ($EVERYDAY_VENV)…"
    run uv venv "$EVERYDAY_VENV" --python "$PYTHON_VERSION" --seed || fail "Couldn't create the everyday Python environment"
  fi
  step "Installing common Python libraries (a few minutes): ${PY_LIBS[*]}"
  run uv pip install --python "$EVERYDAY_VENV/bin/python" "${BINARY_ONLY[@]}" "${PY_LIBS[@]}" && say "   ✓ Python libraries installed" \
    || fail "Some Python libraries failed (a missing prebuilt package, or a network hiccup; see $LOG)"
  # Switch the everyday environment on in every new terminal, so `python` and `pip` just work
  for f in "$HOME/.zshrc" "$HOME/.bashrc"; do
    add_line "$f" "export VIRTUAL_ENV_DISABLE_PROMPT=1; [ -f \"$EVERYDAY_VENV/bin/activate\" ] && [ -z \"\${VIRTUAL_ENV:-}\" ] && source \"$EVERYDAY_VENV/bin/activate\""
  done
  add_line "$HOME/.zprofile" "export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

# -------------------------------------------------------------- 5. VS Code ---
if [[ $DO_VSCODE -eq 1 ]]; then
  if [[ -d "/Applications/Visual Studio Code.app" ]] && ! "$BREW" list --cask visual-studio-code >/dev/null 2>&1; then
    say "   ✓ VS Code already installed"
    CODE_BIN="/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
    add_line "$HOME/.zprofile" "export PATH=\"\$PATH:$CODE_BIN\""
  else
    brew_install visual-studio-code "VS Code" cask
  fi
fi

# ------------------------------------------------------ 6. Starter projects ---
run mkdir -p "$DEV_DIR"
if [[ $DO_REACT -eq 1 ]] && command -v npm >/dev/null; then
  if [[ -f "$DEV_DIR/react-starter/package.json" ]]; then
    say "   ✓ React starter already exists"
  else
    step "Creating a React starter project in $DEV_DIR/react-starter…"
    if [[ $DRY -eq 1 ]]; then echo "   [dry-run] npx create-vite@latest react-starter --template react-ts --no-interactive; npm install; npm install tailwindcss @tailwindcss/vite; npm run build"
    else ( cd "$DEV_DIR" && run npx --yes create-vite@latest react-starter --template react-ts --no-interactive ) \
      && ( cd "$DEV_DIR/react-starter" && run npm install --no-fund --no-audit && run npm install --no-fund --no-audit tailwindcss @tailwindcss/vite ) \
      || fail "React starter project couldn't be created"
    fi
    if [[ $DRY -eq 0 && -f "$DEV_DIR/react-starter/vite.config.ts" ]]; then
      cat > "$DEV_DIR/react-starter/vite.config.ts" <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
EOF
      printf '@import "tailwindcss";\n' | cat - "$DEV_DIR/react-starter/src/index.css" > "$DEV_DIR/react-starter/src/index.css.new" \
        && mv "$DEV_DIR/react-starter/src/index.css.new" "$DEV_DIR/react-starter/src/index.css"
      ( cd "$DEV_DIR/react-starter" && run npm run build ) && say "   ✓ React starter builds" || fail "React starter didn't build"
    fi
  fi
fi
if [[ $DO_PY -eq 1 ]]; then
  # hello.py (checks the libraries), app.py + giving.csv (a small Streamlit web app in the Brilliance style)
  run mkdir -p "$DEV_DIR/python-starter"
  for f in "$SCRIPT_DIR"/starter/python/*; do
    # hello.py and brand.py are ours and always refreshed; app.py / giving.csv are left alone once they exist (people edit them)
    case "$(basename "$f")" in hello.py|brand.py) run cp "$f" "$DEV_DIR/python-starter/" ;;
      *) [[ -f "$DEV_DIR/python-starter/$(basename "$f")" ]] || run cp "$f" "$DEV_DIR/python-starter/" ;; esac
  done
  # The Brilliance Labs theme for Streamlit (colors, fonts, square corners)
  [[ -f "$DEV_DIR/python-starter/.streamlit/config.toml" ]] || { run mkdir -p "$DEV_DIR/python-starter/.streamlit" && run cp "$SCRIPT_DIR/starter/python/.streamlit/config.toml" "$DEV_DIR/python-starter/.streamlit/"; }
  # Skip Streamlit's first-run "enter your email" question (it would otherwise wait in the terminal)
  if [[ $DRY -eq 0 && ! -f "$HOME/.streamlit/credentials.toml" ]]; then
    mkdir -p "$HOME/.streamlit" && printf '[general]\nemail = ""\n' > "$HOME/.streamlit/credentials.toml"
  fi
  say "   ✓ Python starter ready (hello.py, app.py)"
fi

# --------------------------------------------------------------- 7. Verify ---
step "Checking everything…"
if [[ $DRY -eq 0 && $DO_PY -eq 1 && -x "$EVERYDAY_VENV/bin/python" ]]; then
  "$EVERYDAY_VENV/bin/python" "$DEV_DIR/python-starter/hello.py" >> "$LOG" 2>&1
  grep -q "MISSING" "$LOG" && fail "Some Python libraries didn't import (see $LOG)"
fi
report
echo ""
if [[ ${#FAILED[@]} -eq 0 ]]; then
  say "ALL DONE. Open a NEW Terminal window (or restart Claude Code) so the new tools are found."
else
  say "FINISHED WITH ${#FAILED[@]} PROBLEM(S): ${FAILED[*]}"
fi

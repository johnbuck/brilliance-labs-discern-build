# Foundational developer setup for Windows 10/11 - safe to run more than once.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File setup-windows.ps1 [-Check] [-NoPython] [-NoNode]
#       [-NoReact] [-NoVSCode] [-GitName "Jane Doe"] [-GitEmail jane@example.org] [-DevDir C:\Users\me\dev] [-DryRun]
#
# Installs with winget (skipping anything already there):
#   Git, Node.js LTS + npm (+ common global tools), Python 3.13 (+ common libraries), uv, VS Code
#   Starter projects in %USERPROFILE%\dev: react-starter (Vite + React + TypeScript + Tailwind),
#   python-starter (hello.py library check + app.py, a small Streamlit web app)
# Adds everything to the user PATH and lets PowerShell run npm tools (execution policy RemoteSigned for this user).
#
# Progress: %USERPROFILE%\dev-setup.log      Final report: %USERPROFILE%\dev-setup-report.json
# Git and Node.js install for all users, so Windows shows a "Do you want to allow..." box: click Yes.
# (This file is plain ASCII on purpose: Windows PowerShell 5.1 misreads other characters.)

param(
  [switch]$Check, [switch]$DryRun, [switch]$NoPython, [switch]$NoNode, [switch]$NoReact, [switch]$NoVSCode,
  [string]$GitName = "", [string]$GitEmail = "", [string]$DevDir = ""
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ------------------------------------------------------------------ settings --
$PythonId     = "Python.Python.3.13"
$NpmGlobals   = @("typescript", "tsx", "nodemon", "serve", "prettier", "pnpm")
$PyLibs       = @("requests", "python-dotenv", "pandas", "numpy", "matplotlib", "openpyxl", "beautifulsoup4",
                  "flask", "fastapi", "uvicorn[standard]", "jupyterlab", "ipykernel", "pytest", "anthropic",
                  "streamlit", "watchdog")
# Never compile these from source: if no prebuilt package exists, fail fast with a clear message instead
$BinaryOnly   = @("--only-binary", "pyarrow", "--only-binary", "numpy", "--only-binary", "pandas")
# Windows on ARM (Snapdragon / Surface): pyarrow (needed by Streamlit) has no ARM64 build, so use x64 Python,
# which Windows runs through its built-in emulation.
$IsArmPC = ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64")
$HomeDir = $env:USERPROFILE
if (-not $HomeDir) { $HomeDir = $HOME }
if (-not $DevDir) { $DevDir = Join-Path $HomeDir "dev" }
$Log    = Join-Path $HomeDir "dev-setup.log"
$Report = Join-Path $HomeDir "dev-setup-report.json"
if ($NoNode) { $NoReact = $true }
$script:Failed = @()

if (-not $Check -and -not $DryRun) { Set-Content -Path $Log -Value "" -Encoding UTF8 }
function Say([string]$msg) {
  $line = "{0}  {1}" -f (Get-Date -Format "HH:mm:ss"), $msg
  Write-Host $line
  if (-not $DryRun) { Add-Content -Path $Log -Value $line -Encoding UTF8 }
}
function Step([string]$msg) { Say ""; Say "==> $msg" }
function Fail([string]$msg) { Say "   [x] $msg"; $script:Failed += $msg }
function Ok([string]$msg) { Say "   [ok] $msg" }

# Run a program, send its output to the log, return $true if it worked
function Run([string]$exe, [string[]]$argList) {
  if ($DryRun) { Write-Host "   [dry-run] $exe $($argList -join ' ')"; return $true }
  Add-Content -Path $Log -Value "   > $exe $($argList -join ' ')" -Encoding UTF8
  $out = & $exe @argList 2>&1
  $code = $LASTEXITCODE
  if ($out) { $out | ForEach-Object { "$_" } | Add-Content -Path $Log -Encoding UTF8 }
  return ($code -eq 0)
}

# Re-read PATH from the registry so newly installed tools are found in this window
function Update-SessionPath {
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user    = [Environment]::GetEnvironmentVariable("Path", "User")
  # Registry PATH first, then anything this window already had (kept, not lost)
  $parts = @(($machine, $user, $env:Path) -join ";" -split ";" | Where-Object { $_ })
  $env:Path = ($parts | Select-Object -Unique) -join ";"
}

# Add a folder to the user's PATH permanently (once)
function Add-UserPath([string]$dir) {
  if (-not $dir) { return }
  $user = [Environment]::GetEnvironmentVariable("Path", "User")
  $parts = @(); if ($user) { $parts = $user -split ";" | Where-Object { $_ } }
  if ($parts -contains $dir -or $parts -contains ($dir.TrimEnd('\'))) { return }
  if ($DryRun) { Write-Host "   [dry-run] add to user PATH: $dir"; return }
  [Environment]::SetEnvironmentVariable("Path", (($parts + $dir) -join ";"), "User")
  Say "   + added to PATH: $dir"
  Update-SessionPath
}

function Get-Version([string]$cmd, [string[]]$argList = @("--version")) {
  $c = Get-Command $cmd -ErrorAction SilentlyContinue
  if (-not $c) { return "" }
  if ($c.Source -like "*\WindowsApps\*") { return "" }   # Microsoft Store placeholder, not a real install
  try { $v = & $c.Source @argList 2>$null | Select-Object -First 1 } catch { return "" }
  $m = [regex]::Match("$v", "\d+\.\d+(\.\d+)?")
  if ($m.Success) { return $m.Value } else { return "installed" }
}

function Get-Report {
  $r = [ordered]@{
    os        = "Windows " + [Environment]::OSVersion.Version.ToString()
    finished  = (Get-Date -Format "yyyy-MM-dd HH:mm")
    winget    = (Get-Version "winget")
    git       = (Get-Version "git")
    node      = (Get-Version "node")
    npm       = (Get-Version "npm.cmd")
    python    = (Get-Version "python")
    uv        = (Get-Version "uv")
    vscode    = (Get-Version "code.cmd")
    react_starter  = $(if (Test-Path (Join-Path $DevDir "react-starter\package.json")) { Join-Path $DevDir "react-starter" } else { "" })
    python_starter = $(if (Test-Path (Join-Path $DevDir "python-starter\hello.py")) { Join-Path $DevDir "python-starter" } else { "" })
    dev_dir   = $DevDir
    failed    = @($script:Failed)
  }
  Write-Host ""
  Write-Host "What's on this PC now:"
  foreach ($k in @("winget", "git", "node", "npm", "python", "uv", "vscode", "react_starter", "python_starter")) {
    $v = $r[$k]; if (-not $v) { $v = "not installed" }
    Write-Host ("  {0,-16} {1}" -f $k, $v)
  }
  if (-not $DryRun) { $r | ConvertTo-Json | Set-Content -Path $Report -Encoding UTF8 }
}

# ---------------------------------------------------------------- checks -----
$onWindows = ($env:OS -eq "Windows_NT")
if (-not $onWindows -and -not $DryRun) { Write-Host "This script is for Windows. On a Mac use setup-mac.sh."; exit 1 }
Update-SessionPath
if ($Check) { Get-Report; exit 0 }

Say "Developer setup for Windows starting. Full details in $Log"
if ($onWindows -and -not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Say "winget (the Windows package installer) is missing."
  Say "Open the Microsoft Store, search for 'App Installer', click Update or Get, then run this again."
  if (-not $DryRun) { Get-Report; exit 1 }
}

# Let PowerShell run the small scripts npm installs (npm, pnpm, tsc...). Only affects this user.
try {
  $pol = Get-ExecutionPolicy -Scope CurrentUser
  if ($pol -eq "Undefined" -or $pol -eq "Restricted" -or $pol -eq "AllSigned") {
    if ($DryRun) { Write-Host "   [dry-run] Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" }
    else { Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; Ok "PowerShell can now run npm tools" }
  }
} catch { Say "   (Couldn't change the PowerShell script policy; this PC may be managed. npm still works in Command Prompt.)" }

# winget install that treats "already installed" as success
function Install-Package([string]$id, [string]$name, [string]$scope = "", [string]$override = "", [string]$arch = "") {
  Step "Installing $name..."
  $a = @("install", "--id", $id, "-e", "--source", "winget", "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity", "--silent")
  if ($scope) { $a += @("--scope", $scope) }
  if ($override) { $a += @("--override", $override) }
  if ($arch) { $a += @("--architecture", $arch) }
  $okRun = Run "winget" $a
  $code = $LASTEXITCODE
  # -1978335189 = no newer version, -1978335135 = already installed
  if ($okRun -or $code -eq -1978335189 -or $code -eq -1978335135) { Ok "$name installed"; Update-SessionPath; return $true }
  Fail "$name install failed (winget code $code; if a 'Do you want to allow' box appeared, it needs a Yes)"
  return $false
}

# ------------------------------------------------------------------ 1. Git ----
if (Get-Version "git") { Ok "Git already installed ($(Get-Version 'git'))" }
else { [void](Install-Package "Git.Git" "Git (a permission box will appear: click Yes)") }
if (Get-Command git -ErrorAction SilentlyContinue) {
  if ($GitName)  { [void](Run "git" @("config", "--global", "user.name", $GitName)) }
  if ($GitEmail) { [void](Run "git" @("config", "--global", "user.email", $GitEmail)) }
  [void](Run "git" @("config", "--global", "init.defaultBranch", "main"))
}

# --------------------------------------------------------------- 2. Node.js ---
if (-not $NoNode) {
  if (Get-Version "node") { Ok "Node.js already installed ($(Get-Version 'node'))" }
  else { [void](Install-Package "OpenJS.NodeJS.LTS" "Node.js LTS (a permission box will appear: click Yes)") }
  Add-UserPath "$env:APPDATA\npm"          # where global npm tools live
  if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
    Step "Installing common Node tools: $($NpmGlobals -join ', ')"
    if (Run "npm.cmd" (@("install", "-g", "--no-fund", "--no-audit") + $NpmGlobals)) { Ok "Node tools installed" } else { Fail "Some global npm tools failed" }
  } elseif (-not $DryRun) { Fail "npm not found after installing Node.js" }
}

# ---------------------------------------------------------------- 3. Python ---
if (-not $NoPython) {
  if (Get-Version "python") { Ok "Python already installed ($(Get-Version 'python'))" }
  else {
    $pyArch = ""; if ($IsArmPC) { $pyArch = "x64"; Say "   (ARM PC detected: installing the x64 version of Python so every library has a prebuilt package)" }
    [void](Install-Package $PythonId "Python 3.13" "user" "/quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1 InstallLauncherAllUsers=0 Include_test=0" $pyArch)
  }
  $py = Get-Command python -ErrorAction SilentlyContinue
  if ($py -and $py.Source -notlike "*\WindowsApps\*") {
    $pyDir = Split-Path $py.Source
    Add-UserPath $pyDir
    Add-UserPath (Join-Path $pyDir "Scripts")
    if ($IsArmPC -and -not $DryRun) {
      $machine = & $py.Source -c "import platform; print(platform.machine())" 2>$null
      if ("$machine" -match "ARM64") { Say "   (This Python is the ARM64 version. Streamlit's pyarrow has no ARM64 build, so that part may fail.)" }
    }
    Step "Installing common Python libraries (a few minutes): $($PyLibs -join ', ')"
    [void](Run $py.Source @("-m", "pip", "install", "--upgrade", "--quiet", "pip"))
    if (Run $py.Source (@("-m", "pip", "install", "--quiet", "--disable-pip-version-check", "--prefer-binary") + $BinaryOnly + $PyLibs)) { Ok "Python libraries installed" }
    else { Fail "Some Python libraries failed (a missing prebuilt package, or a network hiccup; see $Log). On an ARM PC with ARM64 Python: uninstall Python in Settings > Apps and rerun; setup will install the x64 version." }
  } elseif (-not $DryRun) {
    Fail "Python didn't install correctly. Turn off Settings > Apps > Advanced app settings > App execution aliases > python.exe, then run this again."
  }
  if (Get-Version "uv") { Ok "uv already installed" } else { [void](Install-Package "astral-sh.uv" "uv (Python project manager)" "user") }
}

# --------------------------------------------------------------- 4. VS Code ---
if (-not $NoVSCode) {
  if ((Get-Version "code.cmd") -or (Test-Path "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe")) { Ok "VS Code already installed" }
  else { [void](Install-Package "Microsoft.VisualStudioCode" "VS Code" "user" "/VERYSILENT /NORESTART /MERGETASKS=!runcode,addcontextmenufiles,addcontextmenufolders,addtopath") }
  Add-UserPath "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin"
}

# ------------------------------------------------------- 5. Starter projects ---
if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $DevDir | Out-Null }
if (-not $NoReact -and (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  $rs = Join-Path $DevDir "react-starter"
  if (Test-Path (Join-Path $rs "package.json")) { Ok "React starter already exists" }
  else {
    Step "Creating a React starter project in $rs..."
    Push-Location $DevDir
    $made = Run "npx.cmd" @("--yes", "create-vite@latest", "react-starter", "--template", "react-ts", "--no-interactive")
    Pop-Location
    if ($made -and -not $DryRun -and (Test-Path $rs)) {
      Push-Location $rs
      $ok = (Run "npm.cmd" @("install", "--no-fund", "--no-audit")) -and (Run "npm.cmd" @("install", "--no-fund", "--no-audit", "tailwindcss", "@tailwindcss/vite"))
      $cfg = @"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
"@
      [IO.File]::WriteAllText((Join-Path $rs "vite.config.ts"), $cfg)
      $cssPath = Join-Path $rs "src\index.css"
      if (Test-Path $cssPath) { [IO.File]::WriteAllText($cssPath, "@import `"tailwindcss`";`n" + [IO.File]::ReadAllText($cssPath)) }
      if ($ok -and (Run "npm.cmd" @("run", "build"))) { Ok "React starter builds" } else { Fail "React starter didn't build" }
      Pop-Location
    } elseif (-not $DryRun) { Fail "React starter project couldn't be created" }
  }
}
if (-not $NoPython) {
  # hello.py (checks the libraries), app.py + giving.csv (a small Streamlit web app in the Brilliance style)
  $ps = Join-Path $DevDir "python-starter"
  if (-not $DryRun) {
    New-Item -ItemType Directory -Force -Path $ps | Out-Null
    Get-ChildItem (Join-Path $PSScriptRoot "starter\python") -File | ForEach-Object {
      $dest = Join-Path $ps $_.Name
      # hello.py and brand.py are ours and always refreshed; app.py / giving.csv are left alone once they exist (people edit them)
      if ($_.Name -eq "hello.py" -or $_.Name -eq "brand.py" -or -not (Test-Path $dest)) { Copy-Item $_.FullName $dest -Force }
    }
    # The Brilliance Labs theme for Streamlit (colors, fonts, square corners)
    $stCfg = Join-Path $ps ".streamlit\config.toml"
    if (-not (Test-Path $stCfg)) {
      New-Item -ItemType Directory -Force -Path (Join-Path $ps ".streamlit") | Out-Null
      Copy-Item (Join-Path $PSScriptRoot "starter\python\.streamlit\config.toml") $stCfg
    }
  }
  # Skip Streamlit's first-run "enter your email" question (it would otherwise wait in the terminal)
  $stDir = Join-Path $HomeDir ".streamlit"; $stCred = Join-Path $stDir "credentials.toml"
  if (-not $DryRun -and -not (Test-Path $stCred)) {
    New-Item -ItemType Directory -Force -Path $stDir | Out-Null
    [IO.File]::WriteAllText($stCred, "[general]`nemail = `"`"`n")
  }
  Ok "Python starter ready (hello.py, app.py)"
}

# ---------------------------------------------------------------- 6. Verify ---
Step "Checking everything..."
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $NoPython -and -not $DryRun -and $py -and $py.Source -notlike "*\WindowsApps\*") {
  $out = & $py.Source (Join-Path $DevDir "python-starter\hello.py") 2>&1
  $out | ForEach-Object { "$_" } | Add-Content -Path $Log -Encoding UTF8
  if ("$out" -match "MISSING") { Fail "Some Python libraries didn't import (see $Log)" }
}
Get-Report
Write-Host ""
if ($script:Failed.Count -eq 0) { Say "ALL DONE. Close this window and open a NEW terminal (or restart Claude Code) so the new tools are found." }
else { Say ("FINISHED WITH {0} PROBLEM(S): {1}" -f $script:Failed.Count, ($script:Failed -join "; ")) }

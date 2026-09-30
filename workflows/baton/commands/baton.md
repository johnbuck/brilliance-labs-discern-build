---
description: Run a spec through the baton multi-agent build pipeline (plan → test → build → review → optional validate)
argument-hint: <spec-path> --env <staging|prod> [--validate] [--base <branch>] [--ssh <user@host>] [--worktree <path>] [--require-roadmap] [--north-star <path>] [--roadmap <path>] [--test-repair-budget <n>] [--validate-code-cycles <n>]
---

Run the **baton** build pipeline on the spec/task at: `$ARGUMENTS`

## HARD RULE — never destroy or redo completed work (operator, emphatic)

A baton run that BLOCKS / fails validation / fails integration has still **built a complete, self-tested
feature on its branch**. The failure means it could not *merge* — NOT that the work is wrong. Therefore:

- **NEVER delete the worktree or branch of a failed/blocked run** (`git worktree remove`, `git branch -D`).
  That throws away hours of work and hundreds of thousands of tokens. The branch is the salvage point.
- **NEVER rebuild a phase from scratch when a build already exists.** Reuse the completed work:
  1. If the block is a PRE-EXISTING / unrelated / concurrent-churn failure (another epic's breakage on
     `base`, not this branch's code) — surface it and get that shared blocker resolved properly by its
     owner; never delete or weaken tests to force a green. Once `base` is healthy, **merge the existing
     branch** (it built green; only the merge gate tripped on something not ours).
  2. If a real finding must change the code — **fix-forward on the existing branch**, or re-run with
     `Workflow({ scriptPath, resumeFromRunId })` so completed agent stages return cached results instead of
     re-running. Do NOT launch a fresh run on a fresh worktree that ignores the prior build.
  3. Only start clean if there is genuinely no prior build to reuse.
- A branch/worktree is removed ONLY after its work is safely merged to `base`, or the operator explicitly
  says to abandon it. Even then prefer keeping the branch.
- **Recovery:** a deleted branch's commits survive in git until GC (~2 weeks). Recover with
  `git branch <name> <sha>` (sha from the "Deleted branch X (was <sha>)" line, or `git reflog` /
  `git fsck --lost-found`).

Steps:
1. Resolve inputs:
   - `spec` = the spec/task path from the arguments (the first non-flag token). If the user passed a description instead of a file, treat the whole argument string as the task text.
   - `repo` = the git repository root. **Local (default):** `git rev-parse --show-toplevel` of the current working directory. **Remote (`--ssh`):** the repository root path ON the remote host — do NOT run a local `git` for it; resolve/confirm it over ssh.
   - `env` = **REQUIRED — no default.** The value after `--env`, which must be `staging` or `prod`. This declares the target environment for the run and is mandatory: if `--env` is absent (or not one of `staging`/`prod`), do NOT launch — ask the operator which environment this run targets, then proceed. It drives four things: (a) the validator/builder exercise infra against that environment; (b) **prod makes real-infrastructure validation mandatory** — it always runs and must report PASS (a SKIPPED/absent validation blocks the ship), whereas staging keeps validation optional; (c) the drift-checker is told the target, so a prod-targeted change with no staging precedent is flagged as drift; (d) **the merge target** — when merge is enabled, an `--env staging` run lands on the `staging` integration branch (a `--no-ff` merge commit, never on main; override the name with `--staging-branch <name>` → `stagingBranch`), while `--env prod` fast-forwards `base`/main. Staging-first promotion to main stays a separate deliberate step.
   - `validate` = true only if `--validate` is present in the arguments. (Ignored for `--env prod`, which always validates.)
   - `base` = the value after `--base` if present, else `main`.
   - `ssh` = the value after `--ssh` if present (e.g. `user@host`), else omit. When set, EVERY pipeline stage operates on the repo **on that host over ssh** — repo/worktree/files/git/tests all live there, nothing is copied locally.
   - `worktree` = the value after `--worktree` if present — the absolute path for the per-run worktree. Use this with `--ssh` to place the worktree where the remote test harness can see it (e.g. under the repo, if the test container mounts the repo). Else omit (defaults to a sibling `.baton-worktrees/` dir).
   - `requireRoadmap` = true only if `--require-roadmap` is present. When set, a missing canonical roadmap is a hard failure; default is warn-and-continue.
   - `northStar` = the value after `--north-star` if present — an explicit path to the project's North Star/vision doc. Else omit (the drift-checker auto-discovers it).
   - `roadmap` = the value after `--roadmap` if present — an explicit path to the canonical roadmap. Else omit (auto-discovered).
   - `testRepairBudget` = the value after `--test-repair-budget` if present, else omit (default 1). How many times the test-author may ADJUDICATE a claimed test/harness defect. The builder cannot edit tests, so a defective test is otherwise unfixable inside the run; this lane lets one agent judge the claim (and REFUSE it) instead of the run grinding every remaining attempt against a target no correct code can satisfy. Raise it only for a spec whose harness is genuinely expected to need more than one correction.
   - `validateCodeCycles` = the value after `--validate-code-cycles` if present, else omit (default 1). How many times a real-infrastructure validation FAIL whose fault is the branch's own CODE may re-enter the build cycle (fix → re-test → re-review → re-validate) rather than discarding an already fully-paid-for pipeline. Set 0 to make any validation failure terminal.
2. **PRE-FLIGHT: spec quality check — do NOT launch a spec that would fail the rubric.** When `spec`
   is a file, read it (over ssh when `--ssh` is set) and judge it against the same rubric the Align
   gate scores, BEFORE spending a workflow run (catching it here is free). Judge quality, not the
   presence of headings — a section that exists but is vague or prose-only fails:
   - **grounded-in-code** — a Current behavior (as-is) inventory with file:line refs when modifying an
     existing surface (a brand-new surface must say so explicitly).
   - **change-map** — KEEP/CHANGE/REMOVE dispositions covering the as-is elements.
   - **north-star-values** — the specific governing canon rules quoted verbatim with file paths (or an
     explicit "none — no North Star rule governs this surface"). Spot-check one quote against the
     cited file. Rules with no canonical source do not count.
   - **code-examples** — the actual code (query / function body / config / schema-with-example) for
     every non-trivial change; a technical section that only *describes* behavior in prose is not
     build-ready. Prototype-derived work embeds the prototype's real code.
   - **build-guidance** — ordered, specific build steps; if you can name a decision the builder would
     have to make alone, the spec isn't ready.
   - **testable-acceptance** — criteria with named verification and at least one error path.
   - **clarity** — no statement a builder could read two ways.
   If any criterion fails, STOP — do not invoke Workflow. Tell the operator exactly which criteria
   failed and why, and offer to run the **spec** skill to bring the spec up to standard (or fix it
   directly if the gap is mechanical), then re-run this skill. A raw task description (no spec file)
   skips this check — but for anything non-trivial, offer spec first.
3. **DURABILITY PRE-CHECK — if this session is Paseo-hosted, launch baton in a DEDICATED agent, not inline.**
   Detect with `[ -n "$PASEO_AGENT_ID" ]` (backstop: process ancestry shows `claude` → `Paseo Daemon`).
   **Why:** a Workflow's subagents run *inside the calling session's process*. In a Paseo-hosted session
   any interrupt to the parent conversation — the user pressing stop, rejecting/aborting a tool call, or
   Paseo restarting the agent — propagates into the in-flight baton subagent and kills it. It dies
   mid-stage with `[Request interrupted by user]` in its transcript while `TaskOutput` still cheerfully
   reports `status: running`, so the run looks alive and is not. This has silently destroyed multiple
   multi-hour builds. Holding the turn open with blocking polls does NOT fix it (it makes an interrupt
   *more* likely); only process isolation does.
   **So when `PASEO_AGENT_ID` is set, do this instead of calling Workflow yourself:**
   - Confirm the target worktree/branch is either absent or provably workless
     (`git merge-base --is-ancestor <branch> <base>`); per the HARD RULE, NEVER clear one holding work.
   - Spawn a dedicated agent via `mcp__paseo__create_agent` — `provider: claude/claude-opus-5[1m]`
     (all-Opus; never downgrade a baton stage), `notifyOnFinish: true`, a title naming the spec — whose
     initial prompt tells it to invoke `/baton` with the *exact* resolved inputs (spec, repo, env,
     base, validate, ssh, worktree) and to run until baton returns a terminal status.
   - That prompt MUST also carry: the HARD RULE above (never delete/reset a branch holding work; never
     hand-edit code or tests — everything goes through baton), the DRIFT-HALT protocol from step 4
     (fix the *spec*, commit, relaunch — the spec is not code), the stale-worktree caveat (if findings
     quote spec text already fixed, compare the worktree HEAD to base before re-running), the concrete
     acceptance criteria the run must satisfy, and an explicit "do NOT merge and do NOT enable any
     flag — the operator ships it".
   - Then report the spawned agent to the user and continue other work; do not poll it, and do not also
     launch the same spec inline (two runs collide on one worktree). Note that from then on, an
     interrupt to *your* conversation no longer harms the build.
   Resume caveat: `resumeFromRunId` is **same-session only**, so a dedicated agent always starts a fresh
   run. Cached-stage replay is not available across the handoff — prefer spawning the dedicated agent
   from the start rather than after an inline run has already died.
4. Invoke the **Workflow** tool with `name: "baton"` and `args: { spec, repo, env, base, validate, ssh, worktree, requireRoadmap, northStar, roadmap, testRepairBudget, validateCodeCycles }` (omit any optional flag not provided; `env` is required and must always be passed). The workflow itself hard-fails if `env` is missing or not `staging`/`prod`. *(In a Paseo-hosted session this call is made by the dedicated agent from step 3, not by you.)*
5. When it returns, relay the result concisely: the feature branch name, the **target environment**, the gate outcomes (plan criteria count, alignment pre/post-build, tests, review PASS/REJECT, validation), and the exact merge command from the `note` field. Do NOT merge automatically — baton produces a reviewed branch; the user ships it.

If the workflow returns `status: "BLOCKED"` or `"VALIDATION-FAILED"`, surface the outstanding findings and stop — do not paper over them. **Per the HARD RULE above, keep the branch and reuse its build** (merge-after-fixing-the-shared-blocker, fix-forward, or resume); do not delete it or rebuild from scratch. If it returns `"DRIFT-HALT"` (pre-build) or `"DRIFT-BLOCKED"` (post-build), surface the alignment findings from the `findings`/`drift` fields and stop — the work has drifted from the spec/roadmap/North Star and the operator must reconcile scope before it ships; if the drift is that the work isn't on the roadmap or the spec itself is the problem, offer to run the **roadmap** or **spec** skill to reconcile, then re-run baton (it re-integrates). If it returns `"ROADMAP-MISSING"`, report that no canonical roadmap was found and `--require-roadmap` was set; the branch is built but unmerged pending a roadmap — offer to run the **roadmap** skill to create one, then re-run baton.

Three statuses mean **the run stopped early on purpose to stop spending**, and each carries its own diagnosis — relay it rather than re-launching:

- `"NO-PROGRESS"` — two consecutive attempts left exactly the same tests failing, so further attempts provably cannot help. Read `failing` and `attemptsUsed`. Triage by hand: either the code needs a decision the spec does not settle (amend the spec, re-run), or a test is defective and the builder did not recognise it (fix the harness, re-run). Do NOT simply re-run with a higher `maxRetries` — the signature says more attempts change nothing.
- `"TEST-DEFECT-HALT"` — a further test/harness defect was claimed after `testRepairBudget` was spent. Read `defect`. Either adjudicate it yourself (the claim may be wrong) or fix the harness, then resume. Raising `--test-repair-budget` is only correct when the harness genuinely needs multiple corrections.
- `"VALIDATION-FAILED"` with a `faultDomain` field — the triage already happened. `code` means the bounded fix cycles are spent and the branch's own code is wrong (fix-forward on the branch). `harness` means the CODE may well be correct and the validation harness is what needs fixing — check that before touching production code. `environment` means the infrastructure itself is the problem and nothing in the pipeline can fix it.

The `testRepairs` field on any terminal result reports how many defect claims were adjudicated. A run that spent repairs and still failed is a signal about the SPEC's expectations (usually a value pinned to the wrong environment), not about the builder.

This is the consumer half of a producer→consumer pair: the **plan** plugin (skills `spec`, `roadmap`, `scaffold`) produces the spec + roadmap artifacts that baton builds and the drift-checker enforces.

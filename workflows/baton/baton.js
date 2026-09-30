export const meta = {
  name: 'baton',
  description: 'Multi-agent build/review pipeline in an isolated worktree: plan -> test-first -> build -> integrate -> adversarial review (parallel dimensions) -> optional validate -> auto-merge. Single writer; author != reviewer.',
  whenToUse: 'A non-trivial build, fix, or refactor you want run through plan/test/build/review gates with context kept out of the main session. Safe to run several at once — each gets its own worktree.',
  phases: [
    { title: 'Setup', detail: 'create an isolated per-run git worktree' },
    { title: 'Plan', detail: 'planner turns the spec into a testable design' },
    { title: 'Align', detail: 'drift-checker: pre-build alignment vs North Star / principles / spec / roadmap' },
    { title: 'Test', detail: 'test-author writes failing tests (red) + reconciles tests obsoleted by the change' },
    { title: 'Baseline', detail: 'capture pre-existing failures on base so the gate judges NEW failures only' },
    { title: 'Build', detail: 'builder makes tests pass (green); loops with review' },
    { title: 'Repair', detail: 'bounded test-author adjudication of a claimed test/harness defect (may REFUSE)' },
    { title: 'Integrate', detail: 'merge latest base into the branch' },
    { title: 'Review', detail: 'independent reviewers, one per dimension, in parallel' },
    { title: 'Validate', detail: 'optional real-infrastructure end-to-end check (before Accept — its measurements are gate evidence)' },
    { title: 'Accept', detail: 'drift-checker: post-build UAT of the diff vs roadmap / North Star, with the validation record in evidence' },
    { title: 'Document', detail: 'record as-built + lessons into the spec' },
    { title: 'Merge', detail: 'fast-forward base to the branch (local, no push); clean up worktree' },
  ],
}

// ---- inputs ----------------------------------------------------------------
// The runtime delivers `args` as a JSON STRING (or undefined) — parse defensively.
const A = (typeof args === 'string' && args.length)
  ? JSON.parse(args)
  : (args && typeof args === 'object' ? args : {})
const spec = A.spec
const repo = (A.repo || '').replace(/\/+$/, '')
if (!spec || !repo) {
  throw new Error('baton requires args.spec (path to spec/task) and args.repo (repository path)')
}
const base = A.base || 'main'
const dimensions = A.dimensions || ['correctness', 'security', 'performance/observability']
const validate = A.validate ?? false
const wantMerge = A.merge ?? true
const maxRetries = A.maxRetries ?? 2
// Bounded repair lanes. A test or live harness can itself be defective (asserts what the
// spec never required, or pins an expectation that only holds in the OTHER environment).
// The builder is forbidden to touch tests, so without these the run grinds every remaining
// attempt against an unsatisfiable target and dies with the whole pipeline spent.
// `testRepairBudget`  — how many claimed test/harness defects the TEST-AUTHOR may adjudicate
//                       (it may REFUSE; a refusal is not a repair and still costs the budget).
// `validateCodeCycles` — how many times a real-infra validation FAIL whose fault is the
//                       branch's own CODE may go back to the builder (re-test, re-review,
//                       re-validate) instead of discarding a fully-paid-for pipeline.
const testRepairBudget = A.testRepairBudget ?? 1
const validateCodeCycles = A.validateCodeCycles ?? 1

// Target environment — REQUIRED, no default (every run must declare staging|prod).
// Drives: which infra the validator/builder exercise, whether validation is mandatory
// (prod => always, and must PASS to ship), and a signal the drift-checker enforces
// (a prod target with no staging precedent is drift).
const env = String(A.env || A.environment || '').trim().toLowerCase()
if (env !== 'staging' && env !== 'prod') {
  throw new Error("baton requires args.env = 'staging' or 'prod' (no default — every run must declare its target environment)")
}
const isProd = env === 'prod'
const envNote = `\n\n=== TARGET ENVIRONMENT: ${env.toUpperCase()} ===\nThis run targets the ${env} environment. Exercise EVERY infrastructure- or data-touching test and validation against the ${env} target. NEVER read or mutate production data/infrastructure unless the target is explicitly prod.${isProd ? '\nThis is a PRODUCTION-targeted run: real-infrastructure validation is MANDATORY (it cannot be skipped or SKIPPED-away), and a change reaching prod with no prior staging pass is DRIFT — confirm a staging precedent exists before accepting.' : ''}`

// Merge target depends on env: a staging run lands on the STAGING integration branch
// (default 'staging', override via A.stagingBranch) with a --no-ff merge commit — NEVER on
// main. A prod run lands on `base` (main) with the legacy fast-forward. This keeps the
// staging-first flow automatic: validated work accumulates on `staging`, and only a
// deliberate prod run (or manual promotion) advances main.
const stagingBranch = String(A.stagingBranch || 'staging').trim()
const mergeTarget = isProd ? base : stagingBranch

// Drift / alignment gate inputs. `requireRoadmap` makes a missing roadmap a hard halt
// (default: warn-and-continue). `northStar` / `roadmap` are optional path overrides; when
// absent the drift-checker auto-discovers them by convention.
const requireRoadmap = A.requireRoadmap ?? false
const northStarPath = (A.northStar || '').trim() || null
const roadmapPath = (A.roadmap || '').trim() || null
const driftNote = `Artifact locations:\n- North Star: ${northStarPath ? `use ${northStarPath}` : 'auto-discover (NORTH-STAR.md / VISION.md / a North Star section in AGENTS.md/CLAUDE.md/README)'}\n- Roadmap: ${roadmapPath ? `use ${roadmapPath}` : 'auto-discover (ROADMAP.md / backlog index / epics doc / spec frontmatter roadmap|epic field)'}\n- Always read the repo AGENTS.md/CLAUDE.md for the project's "how we do things" principles.\nRoadmap policy this run: ${requireRoadmap ? 'REQUIRED — a missing roadmap is a hard failure.' : 'a missing roadmap is reported but not blocking.'}`

// Remote target (optional). When set (e.g. "user@host"), the repo,
// worktree, every source/test file, git, and the test command live on that host —
// NOT on this machine. Every stage reaches it over ssh. `repo`, `base`, `branch`,
// `spec`, and the worktree are all paths/refs ON the remote host.
const sshHost = (A.ssh || A.remote || '').trim() || null
const remoteNote = sshHost ? `

=== REMOTE TARGET — all work happens over SSH ===
The repository, your worktree, every source/test file, git, and the test command live on a REMOTE host, NOT this machine. Reach it with: \`ssh ${sshHost}\`. Every path below (repository, worktree, spec) is a path ON that host.
Hard rules:
- Run EVERY git, file, and test command on the remote by wrapping it: \`ssh ${sshHost} '<command>'\`. Quote the WHOLE command so pipes / && / redirects run remotely, not on this machine.
- The Read / Edit / Write / Grep / Glob tools act on THIS machine and CANNOT see the remote tree. Read a file with \`ssh ${sshHost} 'cat <path>'\` (or \`sed -n\`, \`grep\`). To create or replace a file, write it to a LOCAL temp first, then pipe it over: \`ssh ${sshHost} 'cat > <remote-path>' < /tmp/local\`. To edit in place, fetch → change locally → pipe back.
- The remote login shell may be fish: for ANY bash syntax (loops, \`$(...)\`, heredocs, \`[[ ]]\`) use \`ssh ${sshHost} bash -lc '<script>'\` or pipe a script: \`ssh ${sshHost} bash -s < /tmp/script.sh\`.
- Do your git work via \`ssh ${sshHost} git -C <path> ...\`. Keep the worktree, commits, and tests entirely on the remote — never copy the tree to this machine.
` : ''

// branch + per-run worktree path (no Date/random allowed in scripts; keep deterministic)
const specName = String(spec).split('/').pop().replace(/\.md$/, '').replace(/[^a-zA-Z0-9._-]/g, '-')
const branch = A.branch || `baton/${specName}`
const branchSlug = branch.replace(/\//g, '-')
const repoParent = repo.split('/').slice(0, -1).join('/') || '/'
// Worktree location is overridable (`A.worktree`) — e.g. to place it where a remote
// test container can see it (under the repo). Default: a sibling .baton-worktrees dir.
const workdir = (A.worktree || `${repoParent}/.baton-worktrees/${branchSlug}`).replace(/\/+$/, '')

// If the spec is a tracked file under the repo, its worktree copy is the one to document
// (so the doc commit lands with the branch); otherwise it's an external file edited in place.
const specRel = spec.startsWith(repo + '/') ? spec.slice(repo.length + 1) : null
const specInWorktree = specRel ? `${workdir}/${specRel}` : spec

// Build agents work IN the isolated worktree; merge/cleanup act on the original repo.
const fields = `Repository (your isolated worktree): ${workdir}\nBase branch: ${base}\nFeature branch: ${branch}\nSpec: ${spec}\nTarget environment: ${env.toUpperCase()}${remoteNote}`

// ---- schemas ---------------------------------------------------------------
const SETUP = {
  type: 'object', additionalProperties: false,
  properties: { status: { enum: ['READY', 'ERROR'] }, detail: { type: 'string' } },
  required: ['status'],
}
const PLAN = {
  type: 'object', additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    goal: { type: 'string' },
    approach: { type: 'string' },
    successCriteria: { type: 'array', items: { type: 'string' } },
    validationNeeded: { type: 'boolean' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'goal', 'approach', 'successCriteria', 'validationNeeded'],
}
const TESTS = {
  type: 'object', additionalProperties: false,
  properties: {
    testFiles: { type: 'array', items: { type: 'string' } },
    runCommand: { type: 'string' },
    allFail: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['testFiles', 'runCommand', 'allFail'],
}
const BASELINE = {
  type: 'object', additionalProperties: false,
  properties: {
    failures: { type: 'array', items: { type: 'string' } },
    ran: { type: 'boolean' },
    note: { type: 'string' },
  },
  required: ['failures', 'ran'],
}
const BUILD = {
  type: 'object', additionalProperties: false,
  properties: {
    testsPass: { type: 'boolean' },
    summary: { type: 'string' },
    flagged: { type: 'array', items: { type: 'string' } },
    // Identifiers of tests still failing — the input to no-progress detection.
    failingTests: { type: 'array', items: { type: 'string' } },
    // The builder's ONLY channel for "this test cannot be satisfied by correct code".
    // Populated => triage routes to the test-author for adjudication instead of grinding.
    defect: {
      type: ['object', 'null'], additionalProperties: false,
      properties: {
        file: { type: 'string' },
        testId: { type: 'string' },
        problem: { type: 'string' },
        evidence: { type: 'string' },
        proposedFix: { type: 'string' },
      },
      required: ['file', 'problem', 'evidence'],
    },
  },
  required: ['testsPass', 'summary'],
}
const VERDICT = {
  type: 'object', additionalProperties: false,
  properties: {
    dimension: { type: 'string' },
    status: { enum: ['PASS', 'REJECT'] },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          severity: { enum: ['Critical', 'High', 'Medium', 'Low', 'Optional'] },
          location: { type: 'string' },
          problem: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'problem'],
      },
    },
  },
  required: ['dimension', 'status', 'findings'],
}
const VALID = {
  type: 'object', additionalProperties: false,
  properties: {
    status: { enum: ['PASS', 'FAIL', 'SKIPPED'] },
    evidence: { type: 'string' },
    reproduction: { type: 'string' },
    // Required on FAIL — decides the next move: 'code' goes back to the builder,
    // 'harness' to the test-author, 'environment' halts for the operator.
    faultDomain: { enum: ['code', 'harness', 'environment', 'none'] },
  },
  required: ['status', 'evidence'],
}
// Verdict of the test-author acting as INDEPENDENT ADJUDICATOR of a claimed defect.
// REFUSED is the anti-gaming guarantee: the writer of the code never gets to edit its
// own contract just by asserting the contract is wrong.
const TESTFIX = {
  type: 'object', additionalProperties: false,
  properties: {
    verdict: { enum: ['REPAIRED', 'REFUSED'] },
    rationale: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    contractPreserved: { type: 'boolean' },
    detail: { type: 'string' },
  },
  required: ['verdict', 'rationale'],
}
const DRIFT = {
  type: 'object', additionalProperties: false,
  properties: {
    mode: { enum: ['pre-build', 'post-build'] },
    status: { enum: ['ALIGNED', 'DRIFT', 'ROADMAP-MISSING'] },
    northStarFound: { type: 'boolean' },
    roadmapFound: { type: 'boolean' },
    artifacts: {
      type: 'object', additionalProperties: false,
      properties: {
        northStar: { type: ['string', 'null'] },
        roadmap: { type: ['string', 'null'] },
        principles: { type: ['string', 'null'] },
      },
    },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          severity: { enum: ['Critical', 'High', 'Medium', 'Low', 'Optional'] },
          axis: { enum: ['project-north-star', 'baton-principles', 'how-we-do-things', 'spec', 'roadmap'] },
          problem: { type: 'string' },
          evidence: { type: 'string' },
          recommendation: { type: 'string' },
        },
        required: ['severity', 'axis', 'problem', 'evidence'],
      },
    },
    roadmapAlignment: { type: 'string' },
    canonStale: { type: 'array', items: { type: 'string' } },
    specRubric: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          criterion: { enum: ['grounded-in-code', 'change-map', 'north-star-values', 'code-examples', 'build-guidance', 'testable-acceptance', 'clarity'] },
          verdict: { enum: ['PASS', 'FAIL', 'N/A'] },
          evidence: { type: 'string' },
        },
        required: ['criterion', 'verdict', 'evidence'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['mode', 'status', 'roadmapFound', 'findings', 'summary'],
}
const INTEG = {
  type: 'object', additionalProperties: false,
  properties: {
    status: { enum: ['CLEAN', 'CONFLICT'] },
    testsPass: { type: 'boolean' },
    baseMoved: { type: 'boolean' },
    newFailures: { type: 'array', items: { type: 'string' } },
    detail: { type: 'string' },
  },
  required: ['status', 'testsPass'],
}
const MERGE = {
  type: 'object', additionalProperties: false,
  properties: {
    status: { enum: ['MERGED', 'NOT_FF', 'ERROR'] },
    baseCommit: { type: 'string' },
    detail: { type: 'string' },
  },
  required: ['status'],
}

// ---- Setup: isolated worktree ----------------------------------------------
phase('Setup')
const setup = await agent(
  `You are the baton SETUP step. Create an isolated git worktree so this run cannot collide with other concurrent baton runs.${remoteNote}\nOriginal repository: ${repo}\nBase branch: ${base}\nFeature branch: ${branch}\nWorktree path to create: ${workdir}\n\nSteps:\n0. PRESERVE COMPLETED WORK — NEVER wipe a build. If branch ${branch} already exists, check \`git -C ${repo} rev-list --count ${base}..${branch}\`. If that count is > 0, the branch holds UNMERGED completed work from a prior run: do NOT remove the worktree, do NOT delete or force-reset the branch. Report ERROR with detail "lingering unmerged work on ${branch} (N commits ahead of ${base}); reuse/salvage it — do NOT rebuild from scratch" and STOP. (The caller will resume or merge that branch instead of starting over.)\n1. Only when ${branch} does NOT exist, or has ZERO commits ahead of ${base} (nothing to lose): clear any stale worktree at ${workdir} — \`git -C ${repo} worktree remove --force ${workdir}\` (ignore errors if absent), \`rm -rf ${workdir}\` if the directory remains, \`git -C ${repo} worktree prune\`.\n2. Create the worktree: if ${branch} exists (and step 0 allowed continuing), reuse it — \`git -C ${repo} worktree add ${workdir} ${branch}\`; otherwise create it fresh off ${base} — \`git -C ${repo} worktree add -B ${branch} ${workdir} ${base}\`. Never \`-B\` over an existing branch that has commits.\n3. Verify \`git -C ${workdir} branch --show-current\` is ${branch}.\nReport READY on success, or ERROR with the exact failure.`,
  { agentType: 'baton-integrator', phase: 'Setup', label: 'setup:worktree', schema: SETUP, model: 'opus' },
)
if (setup.status !== 'READY') {
  return { status: 'SETUP-FAILED', branch, base, worktree: workdir, reason: setup.detail || 'could not create worktree' }
}
log(`Setup: isolated worktree at ${workdir} on ${branch}`)

// ---- Plan ------------------------------------------------------------------
phase('Plan')
const plan = await agent(
  `You are the baton PLANNER.\n${fields}\n\nRead the spec, ground the design in the actual code, and produce a testable plan. Identify the smallest change that satisfies the requirement.\n\nProduce a \`goal\` statement (2-4 plain sentences): the problem, the outcome the operator wants, and why it matters — drawn from the spec's own one-sentence summary, its "Why this exists", and its North Star check. This statement is shown verbatim to EVERY downstream agent (test-author, builder, reviewers, validator) as the fixed point they judge their decisions against — write it so an agent seeing nothing else still understands what this work is FOR. Do not restate the approach in it; state the goal.\n\nCarry the spec's NORTH STAR CHECK into the plan: include each North Star / canonical-reference rule the spec quotes (its "North Star check" section) as its own success criterion prefixed "north-star:" (testable as stated there), so every downstream stage — tests, reviewers, validator — enforces the North Star alongside the feature. Honor the spec's change map: anything it marks KEEP is off-limits to the design; only its REMOVE lines authorize deleting existing behavior. If the spec modifies an existing surface but lacks an as-is inventory / change map / North Star check, verify the current behavior against the code yourself and list what's missing in openQuestions — do not fill the gap by silent assumption.`,
  { agentType: 'baton-planner', phase: 'Plan', schema: PLAN, model: 'opus' },
)
log(`Plan: ${plan.summary} (${plan.successCriteria.length} success criteria; validationNeeded=${plan.validationNeeded})`)
log(`Goal: ${plan.goal}`)
log(`Target environment: ${env.toUpperCase()}${isProd ? ' — production: real-infra validation MANDATORY and must PASS to ship' : ''}`)

// The goal statement rides at the top of every judgment-making stage's prompt: local
// decisions get resolved toward THE GOAL, not toward whatever is locally convenient.
const goalNote = `\n\n=== THE GOAL — why this work exists; judge every decision against it ===\n${plan.goal}`

// Told to the validator: on a FAIL, WHOSE fault it is decides what the pipeline does next.
const faultNote = `\n\n=== FAULT DOMAIN — REQUIRED WHEN YOU REPORT FAIL ===\nA FAIL must also set \`faultDomain\`, because it routes the run:\n- **code** — the production code on this branch is wrong; the observed behaviour genuinely violates a success criterion or THE GOAL. Routed back to the BUILDER for one bounded fix cycle.\n- **harness** — the code behaved CORRECTLY and the VALIDATION HARNESS is what is wrong: its expected value is unsatisfiable in ${env} (measured on another corpus/environment), it asserts something the spec never required, or it is simply broken (bad fixture, wrong invocation, missing env var). Routed to the test-author for a bounded ADJUDICATED repair, then re-validated. Quote the specific assertion and give observed-vs-expected as evidence.\n- **environment** — neither: the infrastructure is down, unreachable or misconfigured, so no verdict on the feature is possible. Halts for the operator. Do not use this to excuse a real failure — if the infra is merely unavailable, report SKIPPED instead.\nBe precise and honest. 'harness' is not a way to make a real failure disappear: an independent adjudicator reviews the claim and can refuse it, which sends the fault straight back to the code.`

// Prod targets ALWAYS validate (and must PASS — see validationOk below); staging keeps
// the validator optional (run if requested or the planner deems it needed).
const wantValidate = isProd || validate || plan.validationNeeded

// Format a drift verdict's findings for logs / feedback / the final report.
const fmtDrift = (d) => (d.findings || [])
  .map((f) => `- [${f.severity}/${f.axis}] ${f.problem}${f.evidence ? ` (${f.evidence})` : ''}${f.recommendation ? ` -> ${f.recommendation}` : ''}`)
  .join('\n')

// Threshold is enforced in CODE, not just the prompt: Critical/High/Medium block, and a
// blocking-severity finding must carry concrete cited evidence (else it's vibes — ignore it).
// A verdict drifts if the agent said DRIFT, OR any evidence-backed blocking finding exists.
const blockingFindings = (d) => (d.findings || []).filter(
  (f) => (f.severity === 'Critical' || f.severity === 'High' || f.severity === 'Medium') && f.evidence && String(f.evidence).trim(),
)
const isDrift = (d) => d.status === 'DRIFT' || blockingFindings(d).length > 0

// ---- Align: pre-build drift gate (cheap; catch drift before any code) -------
phase('Align')
const align = await agent(
  `You are the baton DRIFT-CHECKER in **pre-build** mode. No code exists yet — judge the SPEC and the PLANNER's design for alignment before any build tokens are spent.\n${fields}\n\n${driftNote}${envNote}\n\nPlanner summary: ${plan.summary}\nPlanner approach:\n${plan.approach}\nSuccess criteria:\n${plan.successCriteria.map((c, n) => `${n + 1}. ${c}`).join('\n')}\n\nFIRST, gate the SPEC's QUALITY against the spec rubric — score every criterion in \`specRubric\` with PASS / FAIL / N/A plus concrete evidence (quote the spec or its gap). This is where drift enters the pipeline: judge quality, not the mere presence of headings — a section that exists but is vague, prose-only, or unverifiable FAILS its criterion. Any FAIL is a High finding (axis: spec) and DRIFT. Scale to the work (a genuinely trivial change satisfies criteria with less — say so in evidence; N/A only when the criterion truly does not apply, with the reason):\n1. **grounded-in-code** — the spec inventories the touched surface's CURRENT behavior from the actual code (each filter/limit/guard/gate/fallback/branch with file:line). Spot-check against the code: an element on the path missing from the inventory FAILS (the build would guess its fate). New-surface work: N/A only if the spec says so explicitly.\n2. **change-map** — every as-is element dispositioned KEEP/CHANGE/REMOVE; REMOVE lines are the only authorized deletions.\n3. **north-star-values** — the SPECIFIC North Star / canonical-reference rules governing this surface are quoted verbatim with file paths + how the change complies + a testable condition per rule. Read the North Star for this surface YOURSELF: an omitted governing principle FAILS; a spec-invented \"rule\" with no canonical source FAILS (it has no authority and can enshrine a bug — a missing-but-needed rule is a North Star update for the operator); every quote must match its cited file (fabricated canon is the worst drift vector). An explicit \"none — no North Star rule governs this surface\" passes only if actually true.\n4. **code-examples** — actual code where applicable: the exact query / function body / config / schema-with-example-record for every non-trivial change, at plan-mode specificity (a build-ready appendix for long code). A technical section that only DESCRIBES behavior in prose FAILS — prose is where builders invent. Where the spec comes from a prototype, the prototype's real code must be embedded, not summarized.\n5. **build-guidance** — specific, ordered instructions a builder can execute without inventing a single decision: exact surfaces/files touched, the order of operations, rollout/flag/migration steps. If YOU can name a decision the builder would have to make alone, the spec FAILS this criterion — name it in evidence.\n6. **testable-acceptance** — acceptance criteria with named verification (test/command/expected output), one assertion each, at least one error path. Any expected VALUE derived from live data (a count, a pinned id, a ranking position, an exact set) must state WHICH environment it was measured in and hold in this run's target (${env}) — an expectation measured on one corpus and asserted against another is a manufactured failure that no correct code can satisfy, and it FAILS this criterion. Prefer invariant assertions (a behaviour, an ordering, a relationship) over corpus-specific magnitudes; where a magnitude is genuinely required, the spec must say how to re-derive it in the target environment.\n7. **clarity** — plain, unambiguous language; terms defined; no statement a reasonable builder could read two ways (quote any you find).\n\nTHEN audit alignment across project-north-star, baton-principles, how-we-do-things, spec, and roadmap. Locate the North Star and roadmap (report exactly what you found). Judge neutrally. DRIFT on genuine Critical/High/MEDIUM misalignment (scope creep, direction change, rule violation, off-roadmap work, any silent data loss / destructive action / skipped-staging risk) — but every blocking finding MUST cite concrete evidence (file/section + quoted intent) or be downgraded to Optional. ROADMAP-MISSING only when the absence of a roadmap is the sole blocking issue; otherwise ALIGNED. Do not over-block a correct, minimal, on-roadmap plan, and do not rubber-stamp drift.`,
  { agentType: 'baton-drift-checker', phase: 'Align', label: 'align:pre-build', schema: DRIFT, model: 'opus' },
)
const rubricLine = (align.specRubric || []).map((r) => `${r.criterion}=${r.verdict}`).join(' ')
log(`Align: ${align.status} (northStar=${align.northStarFound}, roadmap=${align.roadmapFound}); ${blockingFindings(align).length} blocking / ${(align.findings || []).length} total finding(s)${rubricLine ? `; rubric: ${rubricLine}` : ''}`)

if (isDrift(align)) {
  const rubricFails = (align.specRubric || []).filter((r) => r.verdict === 'FAIL')
  return { status: 'DRIFT-HALT', branch, base, worktree: workdir, when: 'pre-build', reason: 'Pre-build alignment drift — operator must reconcile scope/direction (or bring the spec up to the rubric) before building.', findings: fmtDrift(align), specRubric: align.specRubric, rubricFails: rubricFails.map((r) => `${r.criterion}: ${r.evidence}`), drift: align, plan }
} else if (align.status === 'ROADMAP-MISSING') {
  if (requireRoadmap) {
    return { status: 'ROADMAP-MISSING', branch, base, worktree: workdir, when: 'pre-build', reason: 'No roadmap found and --require-roadmap is set. Create or point to a canonical roadmap, then re-run.', drift: align, plan }
  }
  log('Align: no roadmap found — WARNING (not blocking; pass --require-roadmap to enforce). Continuing.')
}

// ---- Test (red) ------------------------------------------------------------
phase('Test')
const tests = await agent(
  `You are the baton TEST-AUTHOR.\n${fields}${goalNote}\n\nYou are already on branch ${branch} in a dedicated worktree — do NOT create or switch branches. Write failing tests that encode these success criteria, then confirm they all fail for the right reason.\n\nNORTH STAR TESTS (as important as the feature tests): read the spec's "North Star check" section — the North Star / canonical-reference rules this change must not violate (also carried in the plan as "north-star:" criteria). Write a regression test for EACH testable rule so that if the builder violates the North Star while making the feature tests pass, a test goes red. Unlike the feature tests these may already PASS on the current code (the rule currently holds) — that is correct and expected; report them separately from the red set. Test ONLY rules the spec quotes from the North Star / canonical docs — never a rule the spec invented locally. If the spec touches an existing surface but has no North Star check section, flag that in notes.\n\nRECONCILE OBSOLETE TESTS (part of the red phase — you are the ONLY stage allowed to touch test files): if this change REMOVES or REPLACES existing behavior, pre-existing tests that assert the now-removed contract will fail once the builder lands the change, and the builder is FORBIDDEN to fix them — so YOU must delete or repoint them in this same commit. Read the spec/plan for anything it deletes or replaces (a response field, a payload shape, a helper, a whole surface), grep the test suite for tests asserting that removed contract, and delete or rewrite them to the new contract now. If the spec names specific test files to delete/repoint, do exactly that. Only reconcile tests made obsolete by THIS change — never weaken or delete unrelated tests to force green.\n\nSuccess criteria:\n${plan.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nPlan approach:\n${plan.approach}\n\nGROUND EVERY EXPECTED VALUE IN THE TARGET ENVIRONMENT (${env}). If an expected value comes from live data — a count, a pinned id, an exact set, a ranking position — MEASURE it against ${env} before you assert it; never carry a number measured in another environment into this run. An expectation that only holds on the other corpus is a defect that no correct production code can satisfy, and it will stall the pipeline. Prefer assertions that are invariant across corpora (a behaviour, an ordering, a relationship, a before/after direction) over a magnitude that only one dataset produces; where the spec genuinely demands a magnitude, re-derive it here and say in \`notes\` how it was derived.\n\nCommit the tests on ${branch} with a message: test: ${specName} (red).`,
  { agentType: 'baton-test-author', phase: 'Test', schema: TESTS, model: 'opus' },
)
log(`Tests: ${tests.testFiles.length} file(s); run with \`${tests.runCommand}\`; allFail=${tests.allFail}`)

// ---- Baseline: pre-existing failures on `base` (so the gate judges NEW failures only) --------
// A test that ALREADY fails on `base` is unrelated debt — not this branch's fault. Without this
// baseline the Build<->Integrate loop false-fails (and eventually false-BLOCKS) whenever `base`
// carries any red test: the integrator re-runs the whole suite, sees the pre-existing red, reports
// testsPass=false, and the builder — correctly refusing to touch non-epic code — can never converge.
// Placed once here (the baseline doesn't change across build attempts). Falls back to absolute
// gating if it genuinely can't run against `base`.
const workdirParent = workdir.split('/').slice(0, -1).join('/') || '/'
const baselineWorktree = `${workdirParent}/baseline-${branchSlug}`
phase('Baseline')
const baseline = await agent(
  `You are the baton INTEGRATOR establishing a TEST BASELINE on ${base}. Capture which tests ALREADY FAIL on a clean ${base} — pre-existing debt this branch is NOT responsible for and must never be blamed for.\n${fields}\n\nSteps:\n1. Remove any stale baseline worktree, then create a fresh worktree of ${base} where the test harness can see it — use the SAME parent directory as the feature worktree (${workdirParent}) so a test container that mounts the repo also mounts it: \`git -C ${repo} worktree remove --force ${baselineWorktree}\` (ignore errors), \`git -C ${repo} worktree prune\`, \`git -C ${repo} worktree add ${baselineWorktree} ${base}\`.\n2. In ${baselineWorktree}, run the SAME gate the branch uses — \`${tests.runCommand}\` — with the SAME environment/setup (run it byte-for-byte identically so env-driven failures are captured in the baseline too). The branch's NEW test files do not exist on ${base}, so everything that fails here is pre-existing debt.\n3. Collect the exact FAILING test identifiers (pytest node ids \`path::Class::test\`, vitest test names, or the tool's equivalent — enough to match them against the branch run). Report them in \`failures\` and set ran=true.\n4. Clean up: \`git -C ${repo} worktree remove --force ${baselineWorktree} && git -C ${repo} worktree prune\`.\nIf the gate genuinely cannot run against ${base} (infra down, command errors before collecting), report ran=false with an empty failures list and the reason in note — the run will fall back to absolute gating.`,
  { agentType: 'baton-integrator', phase: 'Baseline', label: 'baseline:base-failures', schema: BASELINE, model: 'opus' },
)
const baselineFailures = (baseline.failures || []).filter(Boolean)
log(`Baseline: ${baseline.ran ? `${baselineFailures.length} pre-existing failure(s) on ${base}` : `could not run on ${base} — absolute gating`}${baseline.note ? ` (${baseline.note})` : ''}`)
const baselineNote = baselineFailures.length
  ? `\n\n=== PRE-EXISTING TEST FAILURES ON ${base} (baseline) ===\nThese tests ALREADY FAIL on ${base} — pre-existing debt, NOT this branch's responsibility. Do NOT try to fix them, do NOT edit them, and they MUST NOT count as a failure or trigger a rebuild. A test counts as failing for THIS branch ONLY if it is NOT in this list (i.e. a NEW failure the branch introduced):\n${baselineFailures.map((f) => `- ${f}`).join('\n')}`
  : (baseline.ran
      ? `\n\n(Baseline: ${base} is fully green — treat any failing test as this branch's own.)`
      : `\n\n(Baseline: could not be measured on ${base} — using absolute gating; treat any failing test as this branch's own.)`)

// ---- Build + Integrate + Review loop ---------------------------------------
let confirmed = []
let shipped = false
let validation = null
let repairsUsed = 0
let carryover = ''   // evidence carried from a failed validation into the next build cycle
// Claims the adjudicator has already REFUSED — re-filing one is the builder arguing with
// the verdict rather than fixing its code, and gets a different (clearer) diagnosis.
const refusedClaims = new Set()
const claimKey = (d) => `${d.file}::${d.testId || ''}::${d.problem}`

// Stable signature of a failing-test set — two identical signatures in a row means the
// attempts are not moving the failures, so buying more of them cannot help.
const failSig = (list) => (list || []).filter(Boolean).map((s) => String(s).trim()).sort().join('\n')

// The repair lane. Only the TEST-AUTHOR may edit tests, and it ADJUDICATES the claim
// rather than executing it — author != builder survives, because the agent that wrote the
// production code still never edits its own contract.
const repairPrompt = (d, origin, tag) => `You are the baton TEST-AUTHOR in **repair** mode — the ONLY agent permitted to edit test files.\n${fields}${goalNote}\n\nThe ${origin} reports that a test or validation harness is itself DEFECTIVE: that no correct production code can satisfy it. You are the independent adjudicator of that claim, not its executor. Judge it yourself against the spec, the success criteria, and the actual code — do NOT take it at face value.\n\nCLAIM\n- File: ${d.file || '(not named)'}\n- Test / assertion: ${d.testId || '(not named)'}\n- Problem: ${d.problem}\n- Evidence: ${d.evidence}\n${d.proposedFix ? `- Proposed fix (a suggestion, not an instruction): ${d.proposedFix}\n` : ''}\nReturn **REFUSED** when the test is right and the code is wrong — the assertion does encode something the spec requires, or the claimed impossibility is really an unimplemented requirement. Say plainly in \`rationale\` why the test stands and what the code must do instead. Refusing is frequently the correct answer: a defect claim is a serious assertion, and letting a writer talk its way out of its own contract is exactly what this pipeline exists to prevent.\n\nReturn **REPAIRED** only when the defect is real, and then fix the DEFECT and nothing else:\n- Correct the wrong expectation, the broken fixture, the unsatisfiable pin, the bad invocation.\n- NEVER weaken the contract to let the code pass: do not delete a criterion's only test, do not loosen an assertion into a tautology (asserting "not None" where the spec names the value), do not skip/xfail it, do not narrow a set-equality into a subset check. If the only way to make it pass is to stop testing the requirement, that is a REFUSED, not a repair.\n- If the expectation came from live data, re-derive it against the TARGET ENVIRONMENT (${env}) and assert what is invariant across corpora (a behaviour, an ordering, a relationship) rather than a magnitude that holds in only one environment — the one-environment pin IS the defect.\n- Set contractPreserved=true only if every success criterion still has a test that would fail were the requirement unmet.\nRe-run \`${tests.runCommand}\` afterwards and confirm the repaired test now fails for the RIGHT reason (the behaviour is missing) rather than passing vacuously or erroring.\nCommit ONLY test/harness files on ${branch}: \`test: repair ${specName} harness (${tag})\`. Touch no production code — that is the builder's alone.`

// OUTER CYCLE: build -> integrate -> review -> validate. A validation FAIL whose fault is
// the branch's own code re-enters this cycle once (bounded by validateCodeCycles) so the
// reviewers see the fixed diff — rather than discarding a fully-paid-for pipeline.
for (let cycle = 0; cycle <= validateCodeCycles; cycle++) {
 const cyc = `c${cycle + 1}`
 let priorFindings = carryover
 let lastFailSig = null
 let needCodeCycle = false
 shipped = false
 carryover = ''

 for (let attempt = 0; attempt <= maxRetries; attempt++) {
  const tag = `${cyc}-a${attempt + 1}`
  phase('Build')
  const build = await agent(
    `You are the baton BUILDER (the single writer).\n${fields}${goalNote}\n\nWhen a local implementation decision arises that the spec/plan does not settle, choose the option that serves THE GOAL above; if the goal does not settle it either, make the safest minimal choice and list it in \`flagged\` — never silently pick what is locally convenient.\n\nMake these tests pass with the minimum correct code. Run \`${tests.runCommand}\`. DO NOT modify any test file. Stay on ${branch} in this worktree. Commit on the feature branch: feat: ${specName}.${baselineNote}\n\nReport testsPass=true when your target tests pass AND the branch introduces NO NEW failures vs the baseline above — a test that also fails on ${base} (in the baseline list) is pre-existing debt, is NOT yours to fix, and does NOT keep testsPass from being true. Never edit a test to silence it. If your only remaining failures are pre-existing baseline ones, report testsPass=true and list them in \`flagged\` as pre-existing.\n\n=== IF A TEST OR HARNESS IS ITSELF DEFECTIVE: STOP AND FILE IT, DO NOT GRIND ===\nYou may not edit test files — that stands. But you may not keep burning attempts against a test that NO correct production code can satisfy either. If, after genuinely trying, you conclude a test or live harness is itself wrong — it asserts something the spec never required, its expected value is unsatisfiable in the target environment (${env}) because it was pinned to another corpus, its fixture/mock bypasses or contradicts the code path under test, or it contradicts another test — then STOP on that attempt and FILE it: set testsPass=false, list the still-failing ids in \`failingTests\`, and populate \`defect\` with the file, the test id, the precise problem, and CONCRETE EVIDENCE (quote the assertion, give actual vs expected, and cite the spec line showing the assertion is not required). The TEST-AUTHOR — the only agent allowed to touch tests — will adjudicate independently and may REFUSE, in which case the fault is yours and you fix the code. Do not file a defect to dodge hard work: an unevidenced claim is ignored and a refused claim costs you an attempt. If the failure is your code's fault, leave \`defect\` empty and report testsPass=false with \`failingTests\`.\n\n**Final report:** your StructuredOutput MUST set \`testsPass\` (boolean) FIRST, then a \`summary\` of AT MOST 3 sentences — do not write a long essay, the committed diff is the record. Always populate \`failingTests\` when testsPass is false.\n\nPlan approach:\n${plan.approach}\n` +
      (priorFindings ? `\nThe reviewers REJECTED the previous attempt. Address every Critical, High, and Medium finding below, then re-run the tests:\n${priorFindings}` : ''),
    { agentType: 'baton-builder', phase: 'Build', label: `build:${tag}`, schema: BUILD, model: 'opus' },
  )
  if (!build) {
    return { status: 'INFRA-FAILED', branch, base, worktree: workdir, reason: `Builder agent died (API error / session limit) on attempt ${attempt + 1} — no build result. The branch may hold partial work; resume this run rather than relaunching fresh.`, plan }
  }
  log(`Build ${tag}: testsPass=${build.testsPass}${build.flagged?.length ? ` (flagged: ${build.flagged.join('; ')})` : ''}`)

  // --- FAULT TRIAGE, before paying for Integrate ------------------------------
  // Integrate re-runs the entire suite; running it on a build that never reached green
  // buys nothing. Route by fault instead: a defective test goes to its author, a code
  // failure goes back to the builder, and a failure that has not moved goes to the operator.
  if (!build.testsPass) {
    const buildSig = failSig(build.failingTests)
    const d = build.defect
    if (d && d.file && d.evidence && String(d.evidence).trim()) {
      const reFiled = refusedClaims.has(claimKey(d))
      if (reFiled || repairsUsed >= testRepairBudget) {
        return { status: 'TEST-DEFECT-HALT', branch, base, worktree: workdir, reFiled, reason: reFiled
          ? `The builder RE-FILED a defect claim the test-author already REFUSED, instead of fixing the code — halting rather than letting it argue with the verdict. The adjudicator's ruling stands: the test is correct and the production code is what is wrong. Fix the code on the branch (or, if you disagree with the adjudicator, fix the test yourself), then resume.`
          : `A further test/harness defect was claimed after the repair budget (${testRepairBudget}) was spent — halting rather than grinding. Adjudicate it yourself, or re-run with a larger testRepairBudget.`,
          defect: d, failing: build.failingTests || [], repairsUsed, plan }
      }
      repairsUsed++
      phase('Repair')
      const fix = await agent(
        repairPrompt(d, `BUILDER (attempt ${tag})`, tag),
        { agentType: 'baton-test-author', phase: 'Repair', label: `repair:build-${tag}`, schema: TESTFIX, model: 'opus' },
      )
      if (!fix) {
        return { status: 'INFRA-FAILED', branch, base, worktree: workdir, reason: `Test-author repair agent died (API error) at ${tag}. Branch intact — resume rather than relaunching fresh.`, plan }
      }
      log(`Repair ${tag}: ${fix.verdict} — ${fix.rationale}`)
      if (fix.verdict === 'REPAIRED') {
        priorFindings = `The test-author ADJUDICATED your defect claim and REPAIRED the harness: ${fix.rationale}${fix.filesChanged?.length ? `\nFiles changed: ${fix.filesChanged.join(', ')}` : ''}\nThe contract has moved. Re-run \`${tests.runCommand}\` and satisfy the corrected tests with PRODUCTION CODE ONLY.`
        lastFailSig = null   // the target moved; the no-progress counter restarts
      } else {
        refusedClaims.add(claimKey(d))
        priorFindings = `Your defect claim was REFUSED by the test-author (the independent adjudicator): ${fix.rationale}\nThe test stands as written, so the fault is in the PRODUCTION CODE — fix the code. Do NOT re-file this claim: re-filing it ends the run.`
        lastFailSig = buildSig
      }
      if (attempt === maxRetries) {
        return { status: 'BLOCKED', branch, base, worktree: workdir, reason: `Out of build attempts (${maxRetries + 1}) after the harness claim was ${fix.verdict === 'REPAIRED' ? 'REPAIRED' : 'REFUSED'}.`, failing: build.failingTests || [], repairsUsed, plan }
      }
      continue
    }
    if (buildSig && buildSig === lastFailSig) {
      return { status: 'NO-PROGRESS', branch, base, worktree: workdir, reason: `Two consecutive build attempts left exactly the SAME tests failing and no test-defect claim was filed — further attempts provably cannot help, so the run stops here instead of buying more. Triage by hand: either the code needs a decision the spec does not settle, or a test is defective and the builder did not recognise it.`, failing: build.failingTests || [], attemptsUsed: attempt + 1, plan }
    }
    lastFailSig = buildSig
    priorFindings = `Your previous attempt did not reach green.${build.failingTests?.length ? `\nStill failing:\n${build.failingTests.map((f) => `- ${f}`).join('\n')}` : ''}\nFix the production code. If you now believe one of these tests is itself defective, FILE it via \`defect\` with concrete evidence rather than trying again blindly.`
    log(`Build ${tag}: not green -> retry (Integrate skipped, nothing to integrate)`)
    if (attempt === maxRetries) {
      return { status: 'BLOCKED', branch, base, worktree: workdir, reason: `Builder could not reach green in ${maxRetries + 1} attempts and filed no test-defect claim.`, failing: build.failingTests || [], plan }
    }
    continue
  }

  phase('Integrate')
  const integ = await agent(
    `You are the baton INTEGRATOR.\n${fields}\n\nIntegrate the latest ${base} into ${branch} (in this worktree) so the branch stays mergeable and the review diff is clean. Refresh ${base}, then \`git merge --no-ff ${base}\` into ${branch} (do NOT rebase). A large incoming changeset or many deletions coming from ${base} is EXPECTED — that is other people's work that has landed on ${base}, never something for you to undo or worry about. On a clean merge: re-run \`${tests.runCommand}\`. On conflict: \`git merge --abort\` and report CONFLICT with the conflicting paths; do NOT resolve it yourself.${baselineNote}\n\ntestsPass means NO NEW failures vs ${base}, NOT an all-green suite: after re-running, compute newFailures = (tests failing now) MINUS (the baseline list above), matching by test identifier. Report testsPass=true iff newFailures is empty. Pre-existing baseline failures do NOT count and must NEVER trigger a rebuild (the builder cannot fix non-branch code — looping on base debt is the bug this guards against). Put any NEW failures in \`newFailures\` and \`detail\`; if there are none, report CLEAN + testsPass=true even when the raw suite still shows baseline reds.`,
    { agentType: 'baton-integrator', phase: 'Integrate', label: `integrate:${tag}`, schema: INTEG, model: 'opus' },
  )
  if (!integ) {
    return { status: 'INFRA-FAILED', branch, base, worktree: workdir, reason: `Integrator agent died (API error / session limit) on attempt ${attempt + 1} — no integrate result. Resume this run rather than relaunching fresh.`, plan }
  }
  if (integ.status === 'CONFLICT') {
    return { status: 'CONFLICT-HALT', branch, base, worktree: workdir, reason: `Merging ${base} into ${branch} conflicts — operator must resolve`, detail: integ.detail, plan }
  }
  if (!integ.testsPass) {
    const newFails = (integ.newFailures || []).filter(Boolean)
    const integSig = failSig(newFails)
    if (integSig && integSig === lastFailSig) {
      return { status: 'NO-PROGRESS', branch, base, worktree: workdir, reason: `Integrating ${base} produced exactly the SAME new failures two attempts running — further attempts provably cannot help. Triage by hand: if these are TEST files asserting behaviour this change removed, the test-author must reconcile them (the builder cannot edit tests).`, newFailures: newFails, attemptsUsed: attempt + 1, plan }
    }
    lastFailSig = integSig
    const newFailList = newFails.length ? `\nNEW failures the branch introduced (baseline debt already excluded):\n${newFails.map((f) => `- ${f}`).join('\n')}` : ''
    priorFindings = `Integrating ${base} introduced NEW test failures (pre-existing ${base} debt already excluded — do NOT touch those). Fix them with production code only (do not edit tests).${newFailList}${integ.detail ? `\n${integ.detail}` : ''}`
    log(`Integrate attempt ${attempt + 1}: ${newFails.length || 'some'} NEW failure(s) vs ${base} -> rebuild`)
    if (attempt === maxRetries) {
      return { status: 'BLOCKED', branch, base, worktree: workdir, reason: `Branch still introduces NEW test failures vs ${base} after ${maxRetries + 1} attempts (pre-existing baseline debt excluded)${newFails.length ? `: ${newFails.join(', ')}` : ''}. If these are TEST files asserting behavior this change removed, the test-author must reconcile them (the builder cannot edit tests) — re-run after the spec names them.`, newFailures: newFails, plan }
    }
    continue
  }
  log(`Integrate attempt ${attempt + 1}: CLEAN (baseMoved=${integ.baseMoved})`)

  phase('Review')
  const reviews = await parallel(
    dimensions.map((d, i) => () =>
      agent(
        `You are the baton REVIEWER. Your assigned DIMENSION is: ${d}.\n${fields}${goalNote}\n\nReview ONLY the changes this branch introduces — run \`git diff $(git merge-base ${base} HEAD)..HEAD\`. ${base} has just been integrated, so its history is an ancestor: incoming ${base} commits and deletions are NOT this branch's change and must never be reviewed or "fixed". Assume the branch's own changes contain bugs. ` +
          (i === 0
            ? `Additionally confirm the BUILDER did not modify any test file — the single-writer guarantee. Check it by COMMIT, not by whole-branch diff: test files may legitimately change in commits whose subject starts with \`test:\` (the test-author's red phase, and any \`test: repair ...\` commit where the test-author adjudicated a claimed harness defect), but a test file touched by a \`feat:\` (builder) commit is a violation — REJECT. Run \`git log --format='%h %s' $(git merge-base ${base} HEAD)..HEAD\` and \`git show --stat <sha>\` per commit rather than assuming. If a \`test: repair\` commit exists, ALSO verify it did not weaken the contract: it must not delete a criterion's only test, loosen an assertion into a tautology, skip/xfail it, or narrow a set-equality into a subset — a repair that stops testing a requirement is a REJECT (the adjudicator that wrote it cannot be the only judge of it). `
            : '') +
          `Flag only gaps that affect correctness or the stated requirements; mark anything else Optional.\n\nSuccess criteria:\n${plan.successCriteria.map((c, n) => `${n + 1}. ${c}`).join('\n')}`,
        // label carries the attempt: review verdicts are per-diff, and the resume
        // cache keys on (prompt, opts) — without the attempt, round N replays
        // round 1's stale verdict against a new diff and the loop never converges.
        { agentType: 'baton-reviewer', phase: 'Review', label: `review:${d}:${tag}`, schema: VERDICT, model: 'opus' },
      ),
    ),
  )

  const good = reviews.filter(Boolean)
  if (good.length < dimensions.length) {
    // A null review = the reviewer agent died (terminal API error, e.g. 529) — an
    // absent verdict is NOT a pass. End cleanly; resume re-runs the dead agents.
    return { status: 'INFRA-FAILED', branch, base, worktree: workdir, reason: `${dimensions.length - good.length} reviewer agent(s) died on API errors (no verdict). Branch intact — resume with resumeFromRunId to re-run them.`, plan }
  }
  const rejects = good.filter((r) => r.status === 'REJECT')
  confirmed = good.flatMap((r) => (r.findings || []).filter((f) => f.severity === 'Critical' || f.severity === 'High' || f.severity === 'Medium'))

  if (rejects.length === 0) {
    log(`Review PASS on all ${good.length} dimension(s) at attempt ${attempt + 1}`)
    shipped = true
    break
  }

  priorFindings = confirmed
    .map((f) => `- [${f.severity}] ${f.location || '?'}: ${f.problem}${f.fix ? ` -> fix: ${f.fix}` : ''}`)
    .join('\n')
  log(`Review REJECT (${rejects.map((r) => r.dimension).join(', ')}); ${confirmed.length} Critical/High finding(s). Retry ${attempt + 1}/${maxRetries}.`)

  if (attempt === maxRetries) {
    return { status: 'BLOCKED', branch, base, worktree: workdir, reason: `Reviewers still rejecting after ${maxRetries + 1} build attempts`, outstanding: confirmed, plan }
  }
}

  // ---- Validate (inside the cycle, BEFORE the Accept drift gate: a spec criterion
  // demanding a "recorded live check" is judged against THIS stage's measured output).
  // A FAIL is triaged, not simply fatal: 'harness' goes to the test-author for a bounded
  // adjudicated repair and re-validates (production code unchanged, so no re-review is
  // owed); 'code' re-enters the outer cycle once so the reviewers see the fixed diff.
  if (!shipped) {
    return { status: 'BLOCKED', branch, base, worktree: workdir, reason: 'Build/review loop ended without a shipped diff.', outstanding: confirmed, plan }
  }
  if (wantValidate) {
    for (let vTry = 0; ; vTry++) {
      phase('Validate')
      validation = await agent(
        `You are the baton VALIDATOR (pre-merge pass).\n${fields}${goalNote}${envNote}\n\nRun the feature end-to-end against the ${env} infrastructure on ${branch}. Judge output against the success criteria — wrong data with exit 0 is a FAIL, and output that satisfies the letter of a criterion while missing THE GOAL is a FAIL (say which).\n\nYour report IS the run's recorded live check: the Accept gate judges "recorded live measurement" criteria against it, and the Document stage persists it into the spec's as-built. So put the CONCRETE MEASURED NUMBERS in \`evidence\` (counts, latencies, coverage X/Y, before-vs-after) — "it works" is not a measurement.\n\nALSO validate the spec's NORTH STAR CHECK live (the spec's "North Star check" section / criteria prefixed "north-star:"): the North Star rules governing this surface must hold on the REAL output, not just in unit tests — e.g. if the North Star says every item carries its real source links, count citation-less items in the actual response; one violation is a FAIL exactly like a failed success criterion. Report each rule's observed-vs-expected alongside the criteria.${isProd ? ' This is a PRODUCTION-targeted run: validation is MANDATORY — SKIPPED is NOT acceptable (a SKIP blocks the ship). Only PASS clears it.' : ' If the infrastructure is genuinely unavailable, report SKIPPED with the reason; do not fake a pass.'}\n\nSuccess criteria:\n${plan.successCriteria.map((c, n) => `${n + 1}. ${c}`).join('\n')}${faultNote}`,
        { agentType: 'baton-validator', phase: 'Validate', label: `validate:${cyc}-t${vTry + 1}`, schema: VALID, model: 'opus' },
      )
      if (!validation) {
        return { status: 'INFRA-FAILED', branch, base, worktree: workdir, reason: 'Validator agent died on an API error (no verdict). Branch intact — resume with resumeFromRunId to re-run validation.', plan }
      }
      log(`Validation ${cyc}-t${vTry + 1}: ${validation.status}${validation.faultDomain ? ` (fault: ${validation.faultDomain})` : ''}`)
      if (validation.status !== 'FAIL') break

      let fd = String(validation.faultDomain || 'unspecified').toLowerCase()
      if (fd === 'harness') {
        if (repairsUsed >= testRepairBudget) {
          return { status: 'VALIDATION-FAILED', branch, base, worktree: workdir, faultDomain: 'harness', reason: `Validation FAILED on a harness defect but the repair budget (${testRepairBudget}) is spent. The CODE may well be correct — fix the harness by hand, or re-run with a larger testRepairBudget. Branch left intact.`, validation, repairsUsed, plan }
        }
        repairsUsed++
        phase('Repair')
        const vfix = await agent(
          repairPrompt(
            { file: 'the live validation harness named in the evidence below', testId: '', problem: 'the validator reports the CODE behaved correctly and the HARNESS assertion is what is wrong', evidence: `${validation.evidence}${validation.reproduction ? `\nReproduction: ${validation.reproduction}` : ''}` },
            `VALIDATOR (${cyc}-t${vTry + 1})`,
            `${cyc}-v${vTry + 1}`,
          ),
          { agentType: 'baton-test-author', phase: 'Repair', label: `repair:validate-${cyc}-t${vTry + 1}`, schema: TESTFIX, model: 'opus' },
        )
        if (!vfix) {
          return { status: 'INFRA-FAILED', branch, base, worktree: workdir, reason: `Test-author repair agent died (API error) during validation triage at ${cyc}-t${vTry + 1}. Branch intact — resume rather than relaunching fresh.`, validation, plan }
        }
        log(`Repair validate-${cyc}-t${vTry + 1}: ${vfix.verdict} — ${vfix.rationale}`)
        if (vfix.verdict === 'REPAIRED') continue   // re-validate only: no production code changed
        // Refused: the harness stands, so the fault is the code after all.
        fd = 'code'
        carryover = `The harness-defect reading was REFUSED by the test-author: ${vfix.rationale}\n`
      }
      if (fd === 'code' && cycle < validateCodeCycles) {
        carryover += `Real-infrastructure validation FAILED on ${env} and the fault is in THIS BRANCH'S PRODUCTION CODE, not the tests. Fix the code; do not touch test files.\nValidator evidence:\n${validation.evidence}${validation.reproduction ? `\nReproduction:\n${validation.reproduction}` : ''}`
        needCodeCycle = true
        break
      }
      return { status: 'VALIDATION-FAILED', branch, base, worktree: workdir, faultDomain: fd, reason: `Real-infrastructure validation FAILED (fault: ${fd})${fd === 'code' ? `; the ${validateCodeCycles} bounded code-fix cycle(s) are spent` : fd === 'environment' ? '; the infrastructure itself is the problem — nothing the pipeline can fix' : ''}. Branch left intact for fix-forward — do not delete it.`, validation, repairsUsed, plan }
    }
    if (needCodeCycle) {
      log(`Validation FAILED on branch code — spending one bounded fix cycle: builder, re-test, re-review, re-validate.`)
      continue
    }
  }
  break
}

// ---- Accept: post-build drift gate (UAT the finished diff before shipping) --
let accept = null
if (shipped) {
  phase('Accept')
  const validationEvidence = validation
    ? `\n\nVALIDATION RECORD (this run's live check — it already ran, BEFORE this gate; the Document stage persists it into the spec's as-built):\n${JSON.stringify(validation)}\n\nA spec acceptance criterion that requires a live/recorded measurement is judged against THIS record: if it contains the required measurement and it passed, the criterion is SATISFIED — do NOT flag the absence of an impl-log/as-built file (the Document stage writes that AFTER this gate, and it embeds this record). Flag drift only if this record is missing the required measurement or shows it failing.`
    : (wantValidate
        ? '\n\nNOTE: a validation stage was requested but produced no record. Treat spec criteria that require a recorded live check as UNMET.'
        : '\n\nNOTE: no validation stage was requested for this run (staging without --validate and the plan did not demand one). If the spec\'s acceptance criteria REQUIRE a recorded live check, report that as a finding recommending a re-run with --validate — do not demand an artifact no stage of this run configuration produces.')
  accept = await agent(
    `You are the baton DRIFT-CHECKER in **post-build** mode. The work is built, tested, and the adversarial reviewers PASSED. Perform user-acceptance-style alignment validation on the ACTUAL diff before it ships.\n${fields}${goalNote}\n\n${driftNote}${envNote}\n\nRead the branch's own change: \`git -C ${workdir} diff $(git -C ${workdir} merge-base ${base} HEAD)..HEAD\`. ${base} is integrated, so incoming ${base} commits/deletions are NOT this branch's change — never judge them.\n\nSpec being implemented: ${spec}\nPlanner summary: ${plan.summary}\nSuccess criteria:\n${plan.successCriteria.map((c, n) => `${n + 1}. ${c}`).join('\n')}\n\nRun these four MANDATORY audits (each produces explicit output, not a holistic impression):\n1. **Deletion audit** — from the diff, list EVERY behavior-shaping element the change removed or weakened: each deleted/bypassed filter, limit, guard, gate, predicate, fallback, or check (look at removed lines, not just added ones — removals are where silent scope change lives). Match each against the spec's change-map REMOVE lines. A removal with no authorizing REMOVE line in the spec is DRIFT (axis: spec, severity High minimum), no matter how good the builder's reason was — cite the removed code and the spec's silence as evidence.\n2. **Principle checklist** — for the surface this change touches, enumerate the governing North Star principles/rules ONE BY ONE and verdict each individually (holds / violated, with evidence from the diff or, where checkable, the running behavior). Do not compress this into one overall judgment — a checklist cannot skip an item; a judgment can.\n3. **Harness-repair audit** — run \`git log --format='%h %s' $(git -C ${workdir} merge-base ${base} HEAD)..HEAD\` and look for any \`test: repair ...\` commit. Such a commit means the builder or validator claimed a test/harness was itself defective and the test-author ADJUDICATED that claim mid-run. It is the one place in this pipeline where the contract itself moved after being written, so audit it directly: \`git show <sha>\`. Confirm the repair fixed a genuine defect (a wrong expectation, a broken fixture, a pin that only held in another environment) and did NOT weaken the contract — every success criterion must still have a test that would fail if the requirement were unmet. A repair that deletes a criterion's only test, loosens an assertion into a tautology, skips/xfails it, or narrows a set-equality into a subset is DRIFT (axis: spec, High minimum), because the code was then made to pass by moving the target. If there is no such commit, say so and move on.\n4. **Canon staleness** — does the shipped behavior make any sentence of the North Star / canonical references stale (the code now rightly does something the canon doesn't say, or says differently)? List each stale sentence in \`canonStale\` (quote + file) so the operator can update the canon deliberately. Staleness alone is not DRIFT — silent divergence is; reporting it here is what keeps it non-silent.\n\nTHEN confirm the SHIPPED work still aligns: did it drift from the plan/spec during build? Does the completed change actually deliver a roadmap item (acceptance), or solve something adjacent? Did it silently lose data, take a destructive/irreversible action, or skip staging? Honor project-north-star, baton-principles, how-we-do-things, spec, roadmap. Judge neutrally. DRIFT on genuine Critical/High/MEDIUM misalignment, every blocking finding citing concrete evidence (or downgrade to Optional); ROADMAP-MISSING only when a missing roadmap is the sole blocking issue; otherwise ALIGNED. Do not over-block correct, minimal, on-roadmap work, and do not rubber-stamp drift.${validationEvidence}`,
    { agentType: 'baton-drift-checker', phase: 'Accept', label: 'accept:post-build', schema: DRIFT, model: 'opus' },
  )
  log(`Accept: ${accept.status} (roadmap=${accept.roadmapFound}); ${blockingFindings(accept).length} blocking / ${(accept.findings || []).length} total finding(s)`)

  if (isDrift(accept)) {
    return { status: 'DRIFT-BLOCKED', branch, base, worktree: workdir, when: 'post-build', reason: 'Post-build acceptance drift — the shipped work diverges from spec/roadmap/North Star. Not merged; branch left for operator.', findings: fmtDrift(accept), drift: accept, plan }
  } else if (accept.status === 'ROADMAP-MISSING') {
    if (requireRoadmap) {
      return { status: 'ROADMAP-MISSING', branch, base, worktree: workdir, when: 'post-build', reason: 'No roadmap found and --require-roadmap is set. Branch is built+reviewed but not merged; add a roadmap and re-run (it will re-integrate).', drift: accept, plan }
    }
    log('Accept: no roadmap found — WARNING (not blocking). Continuing to ship.')
  }
}

// ---- Document: capture as-built + lessons into the spec (lands with merge) --
let documented = null
if (shipped) {
  phase('Document')
  documented = await agent(
    `You are the baton DOCUMENTER. The work is complete and reviewed. Update the spec to be an accurate as-built record.\n${fields}${goalNote}\n\nThe spec file to update is: ${specInWorktree}\n${specRel ? `This is the spec's copy INSIDE your worktree — edit it (NOT the original at ${spec}) so the documentation lands with the branch.` : `This spec is NOT tracked in this repo; update it in place and report SKIPPED (it can't ride the branch).`}\n\nAppend an "Implementation log / as-built" section: what actually changed (files + essence of \`git diff $(git merge-base ${base} HEAD)..HEAD\`), key decisions and any deviation from the plan, how each planner open question was resolved, lessons learned, and how to verify.${validation ? ` EMBED the validation record VERBATIM as the recorded live check (measured numbers included): ${JSON.stringify(validation)}` : ''} Preserve the original spec; ADD the record. ${specRel ? `Commit on ${branch}: docs(spec): as-built ${specName} and report DOCUMENTED.` : ''}\n\nPlanner open questions to resolve:\n${(plan.openQuestions || []).map((q, n) => `${n + 1}. ${q}`).join('\n') || '(none)'}`,
    {
      agentType: 'baton-documenter',
      phase: 'Document',
      label: 'document',
      model: 'opus',
      schema: {
        type: 'object', additionalProperties: false,
        properties: { status: { enum: ['DOCUMENTED', 'SKIPPED'] }, specPath: { type: 'string' }, summary: { type: 'string' } },
        required: ['status'],
      },
    },
  )
  log(`Document: ${documented.status}${documented.specPath ? ' -> ' + documented.specPath : ''}`)
}

// ---- Merge (default on; local fast-forward only, never push) ---------------
// Staging: OK to ship unless validation explicitly FAILed (SKIPPED/absent is tolerated).
// Prod: validation is MANDATORY and must be PASS — a SKIPPED/absent validation blocks the ship.
const prodValidationMissing = isProd && !(validation && validation.status === 'PASS')
const validationOk = isProd
  ? (validation && validation.status === 'PASS')
  : (!validation || validation.status === 'PASS')
let merge = null
if (shipped && wantMerge && validationOk) {
  phase('Merge')
  const mergePrompt = isProd
    ? `You are performing the baton MERGE (PROD target). All gates passed. Land ${branch} onto ${base} with a LOCAL fast-forward in the ORIGINAL repository, then clean up the per-run worktree. Do NOT push to any remote.${remoteNote}\nOriginal repository: ${repo}\nBase branch: ${base}\nFeature branch: ${branch}\nPer-run worktree: ${workdir}\n\n1. In ${repo}, confirm ${base} is an ancestor of ${branch}: \`git -C ${repo} merge-base --is-ancestor ${base} ${branch}\`.\n2. If YES, fast-forward base to the branch tip:\n   - if ${base} is the checked-out branch of ${repo}: \`git -C ${repo} merge --ff-only ${branch}\`;\n   - if ${base} is checked out in another worktree: \`git -C ${repo} update-ref refs/heads/${base} ${branch}\`.\n   Report MERGED with the new ${base} commit sha.\n3. If ${base} is NOT an ancestor (it moved): do NOT force, report NOT_FF and stop.\n4. On MERGED only, remove the per-run worktree: \`git -C ${repo} worktree remove --force ${workdir} && git -C ${repo} worktree prune\`.\nNever push. Never --force a merge. Never rebase. Never modify code or tests.`
    : `You are performing the baton STAGING MERGE. All gates passed and this is an --env staging run, so land ${branch} on the STAGING integration branch '${stagingBranch}' — NOT on ${base}/main. Do NOT push to any remote, and NEVER touch ${base}/main.${remoteNote}\nOriginal repository: ${repo}\nFeature branch: ${branch}\nStaging branch: ${stagingBranch}\nPer-run feature worktree: ${workdir}\n\n1. Ensure the staging branch exists: if \`git -C ${repo} show-ref --verify --quiet refs/heads/${stagingBranch}\` fails, create it off ${base}: \`git -C ${repo} branch ${stagingBranch} ${base}\`.\n2. A --no-ff merge needs a working tree. Find an existing worktree for ${stagingBranch} in \`git -C ${repo} worktree list\` and use it; otherwise add a temporary one: \`git -C ${repo} worktree add /tmp/staging-merge ${stagingBranch}\` (reuse if it already exists).\n3. In that staging worktree, merge the feature with an explicit merge commit: \`git -C <staging-worktree> merge --no-ff ${branch} -m "merge: ${branch} into ${stagingBranch} (staging-validated, env=staging)"\`. If it CONFLICTS: \`git -C <staging-worktree> merge --abort\` and report NOT_FF with the conflicting paths in detail; do NOT resolve.\n4. On a clean merge report MERGED with the new ${stagingBranch} commit sha (as baseCommit).\n5. On MERGED only, remove the per-run FEATURE worktree: \`git -C ${repo} worktree remove --force ${workdir} && git -C ${repo} worktree prune\`. LEAVE the ${stagingBranch} branch and its worktree in place.\nNever push. Never --force a merge. Never rebase. Never modify code or tests. Never advance ${base}/main.`
  merge = await agent(
    mergePrompt,
    { agentType: 'baton-merger', phase: 'Merge', label: 'merge', schema: MERGE, model: 'opus' },
  )
  log(`Merge: ${merge.status}${merge.baseCommit ? ` -> ${mergeTarget} @ ${merge.baseCommit}` : ''}`)
}

// ---- Report ----------------------------------------------------------------
const merged = merge && merge.status === 'MERGED'
return {
  status: (validation && validation.status === 'FAIL') || prodValidationMissing ? 'VALIDATION-FAILED'
    : merged ? 'MERGED'
    : 'READY',
  branch,
  base,
  environment: env,
  mergeTarget,
  worktree: merged ? '(removed after merge)' : workdir,
  plan,
  tests: { files: tests.testFiles, run: tests.runCommand },
  review: 'PASS (all dimensions)',
  alignment: {
    preBuild: align ? align.status : 'skipped',
    postBuild: accept ? accept.status : 'skipped',
    roadmapFound: accept ? accept.roadmapFound : align.roadmapFound,
    roadmap: (accept || align).artifacts ? (accept || align).artifacts.roadmap : null,
  },
  integrated: base,
  documented: documented ? documented.status : 'skipped',
  testRepairs: repairsUsed,
  validation: validation ? validation.status : (wantValidate ? 'unavailable' : 'not-requested'),
  merge: merge ? merge.status : (!wantMerge ? 'disabled' : (!validationOk ? 'skipped (validation not PASS)' : 'skipped')),
  mergedCommit: merged ? merge.baseCommit : undefined,
  note: merged
    ? (isProd
        ? `Merged ${branch} into ${base} (main) locally (${merge.baseCommit}); worktree cleaned up. Push when ready: git push origin ${base}.`
        : `Merged ${branch} into the STAGING branch '${stagingBranch}' locally (${merge.baseCommit}); main NOT touched, feature worktree cleaned up. Push when ready: git push origin ${stagingBranch}. Promote to main in a separate deliberate step.`)
    : (merge && merge.status === 'NOT_FF')
      ? (isProd
          ? `${base} moved; not fast-forwardable. Re-run baton (it will re-integrate) or integrate+merge manually from worktree ${workdir}.`
          : `Staging merge into '${stagingBranch}' conflicted; aborted. Branch left intact at ${workdir} — reconcile '${stagingBranch}' manually.`)
      : prodValidationMissing
        ? `PROD target: real-infrastructure validation did not PASS (status: ${validation ? validation.status : 'unavailable'}). A prod-targeted change must pass validation before it can ship — not merged; branch left intact at ${workdir}. Re-run after validation passes.`
        : `Branch ${branch} is built, tested, and reviewed (${env}) in worktree ${workdir}. Merge target would be ${mergeTarget}: git -C ${repo} merge ${branch}.`,
}

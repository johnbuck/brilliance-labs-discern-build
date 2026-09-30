# Recommended skills elsewhere

Skills here follow the SKILL.md format (a folder with a `SKILL.md` — YAML frontmatter plus markdown instructions), which is the shared agent-skills convention. Everything below was checked and actively maintained as of September 2026.

## Skill collections

### anthropics/skills

https://github.com/anthropics/skills

The official Anthropic collection. Start here for reference implementations of the format and for document tooling (pdf, docx, pptx, xlsx). `skill-creator` is the keeper: it is the meta-skill about writing and maintaining skills.

### obra/superpowers

https://github.com/obra/superpowers

The canonical agentic engineering-process collection: writing plans, executing plans, test-driven development, systematic debugging, requesting and receiving code review, verification before completion, subagent-driven development. Pure SKILL.md drops — no install risk.

### mattpocock/skills

https://github.com/mattpocock/skills

A large single-author engineering collection: to-spec, implement, code-review, diagnose, domain modeling, codebase design, git guardrails, writing for agents, claude handoff. Skim the list and take the handful that fit how you work rather than adopting the whole set.

## Specification creation

Frameworks for writing what you want before an agent builds it. Each is heavier than the `plan` plugin in this repo (see `plugins/plan/`); they suit teams and larger projects, while the plan plugin suits a single backlog spec and a build pipeline.

### github/spec-kit

https://github.com/github/spec-kit

GitHub's spec-driven development toolkit: constitution → specify → plan → tasks → implement → converge, plus bug-fix and idea-assessment extensions. Ships as agent skills (`/speckit-*` commands). Thorough but ceremony-heavy.

### Fission-AI/OpenSpec

https://github.com/Fission-AI/OpenSpec

Spec-driven development centered on a living `openspec/` directory of change proposals that stay in sync with the code. Lighter than spec-kit; good when you want the spec to evolve alongside the project instead of being a one-time artifact.

### bmad-code-org/BMAD-METHOD

https://github.com/bmad-code-org/BMAD-METHOD

The Breakthrough Method for Agile AI-Driven Development: a full agile framework of agent personas (analyst, PM, architect, dev, QA) that carry an idea through PRD, architecture, epics, stories, and implementation. The heavyweight option — worth it when a project genuinely needs the whole lifecycle, overkill for a single feature.

## Agent memory

Layers that give a long-lived agent memory across sessions, beyond what the harness provides. Both expose MCP servers, so they work with any MCP-capable agent.

### plastic-labs/honcho

https://github.com/plastic-labs/honcho

A memory library for stateful agents from Plastic Labs: user modeling and dialogue-aware retrieval, so the agent remembers who it is talking to and what they care about, not just raw facts. Strong fit for persona-style or long-running companion agents.

### vectorize-io/hindsight

https://github.com/vectorize-io/hindsight

An agent memory engine that learns: captures experience, distills it into high-level guidance, and recalls the right lesson at the right moment. Good when you want the agent to accumulate lessons from its own history instead of re-making the same mistakes.

## Before installing anything

Read the SKILL.md and the scripts it ships. A skill is instructions your agent will follow and code it may run: check for network calls, credential access, and prompt text that tells the agent to ignore its own rules. The `secrets-guard` plugin in this repo (see `plugins/secrets-guard/`) is one backstop, not a substitute for reading.

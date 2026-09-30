# Recommended skills elsewhere

Skills here follow the SKILL.md format (a folder with a `SKILL.md` — YAML frontmatter plus markdown instructions), which is the shared agent-skills convention. These repositories are worth browsing before writing a new skill from scratch. All three were checked and actively maintained as of September 2026.

## anthropics/skills

https://github.com/anthropics/skills

The official Anthropic collection. Start here for reference implementations of the format and for document tooling (pdf, docx, pptx, xlsx). `skill-creator` is the keeper: it is the meta-skill about writing and maintaining skills.

## obra/superpowers

https://github.com/obra/superpowers

The canonical agentic engineering-process collection: writing plans, executing plans, test-driven development, systematic debugging, requesting and receiving code review, verification before completion, subagent-driven development. Pure SKILL.md drops — no install risk.

## mattpocock/skills

https://github.com/mattpocock/skills

A large single-author engineering collection: to-spec, implement, code-review, diagnose, domain modeling, codebase design, git guardrails, writing for agents, claude handoff. Skim the list and take the handful that fit how you work rather than adopting the whole set.

## Before installing anything

Read the SKILL.md and the scripts it ships. A skill is instructions your agent will follow and code it may run: check for network calls, credential access, and prompt text that tells the agent to ignore its own rules. The `secrets-guard` plugin in this repo (see `plugins/secrets-guard/`) is one backstop, not a substitute for reading.

# Roadmap template

The structure for `ROADMAP.md`. The roadmap is the epic index: each epic is a section with a
short charter and its specs. Human-readable names only — never `M2`, `C1`, `Step0`. Delete this
guidance from the output.

```markdown
# Roadmap — <project name>

**North Star:** one line pointing at what this project is ultimately for (link NORTH_STAR.md /
the vision doc if one exists). Every epic below should serve this.

_Last updated: <YYYY-MM-DD>_

## How to read this
Epics are the themes of work, in rough priority order. Under each epic are its specs with a
status. Status: `done` · `in-progress` · `next` · `later`.

---

## Epic: <readable-epic-name>
**Charter:** one or two sentences — what this epic is for.
**Out of scope:** what this epic deliberately does not cover.

| Spec | Status | Notes |
|---|---|---|
| [<readable-spec-name>](backlog/<file>.md) | next | one-line description |
| [<readable-spec-name>](backlog/<file>.md) | in-progress | |
| [<readable-spec-name>](backlog/<file>.md) | done | landed <date> |

## Epic: <readable-epic-name>
**Charter:** ...
**Out of scope:** ...

| Spec | Status | Notes |
|---|---|---|
| ... | later | |

---

## Recently done
A short rolling list of what landed recently, newest first — so the roadmap shows momentum
without the epic tables filling with completed rows.

- <YYYY-MM-DD> — <readable-spec-name>: one line on what shipped.
```

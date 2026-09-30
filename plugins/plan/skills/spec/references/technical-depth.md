# Technical depth — how deep the Technical approach should go

Distilled from years of TRD practice. This is the bar for the "Technical approach" section of a
spec when the work is **non-trivial**. The test of "deep enough": someone (or baton's
builder) could implement it from the spec without having to ask. Scale to the work — a one-line
fix needs none of this; a new service or a multi-file feature needs most of it. Don't
manufacture depth a small change doesn't warrant.

Every technical choice should already have been confirmed with the operator during the
interview — the spec documents the reasoning, it doesn't decide unilaterally.

## Depth standards (include the ones that apply)

- **Architecture / request-flow trace.** Don't write "the frontend talks to the backend" —
  trace the actual path. ASCII where it clarifies. Example:
  ```
  1. Browser loads the SPA from FastAPI static serving
  2. App polls GET /api/images every 5s via TanStack Query
  3. Full-res images load on demand when placed in a frame
  4. Save/load goes through POST/GET/PUT/DELETE /api/projects
  ```

- **Library table.** Library | Version (ranges like `5.x` / `>=0.115` are fine) | Purpose.
  A one-line "why this over the alternative" for any non-obvious choice.

- **Data / state shapes.** Show the real shape, not field names. For a store, a tree; for a
  record, a realistic JSON example with field constraints noted:
  ```json
  { "id": "b_1710500000000_xk2m9f", "title": "The Name of the Wind",
    "status": "done", "rating": 5, "dateAdded": "2026-01-10" }
  ```
  Annotate non-obvious fields ("coordinates normalized 0–1 relative to page; pixels computed at
  render time").

- **API design.** Endpoint table (method, path, description). For the primary endpoints, the
  request AND response schema with a concrete JSON example.

- **Error handling.** How errors propagate: what's logged (format, level, destination), the
  error response schema, and how the user sees it:
  ```json
  { "error": "not_found", "message": "Project abc123 does not exist", "status": 404 }
  ```

- **Data storage.** Schema + a concrete stored record. For a DB: table structure and the
  migration strategy (Alembic / Prisma / raw SQL) — additive and reversible (see data
  stewardship). For files: the file schema.

- **Background processing.** If work happens outside request handling (timers, watchers,
  queues), the mechanism and lifecycle.

- **Configuration.** Env-var table: Variable | Default | Description. Every variable has a
  default and a description; secrets come from Infisical, never committed.

- **Project structure.** For new code, an annotated directory tree — every file with a one-line
  purpose, comprehensive enough to create the files from.

- **Key technical risks.** Risk | Impact | Mitigation. Only risks specific to THIS work's
  technical choices, not generic software risks.

## Deployment (when it ships somewhere)
- Docker: image strategy (multi-stage, slim base, non-root USER), compose service definition,
  volumes, healthcheck, graceful shutdown. Never copy `.env`/secrets into image layers.
- CLI: install method, dependency management, distribution.
- Static: hosting, build steps.
- Always: env config, secrets handling, healthcheck endpoint if applicable.

## Writing
- Be specific about versions. Show realistic data, not placeholders. Explain "why this library"
  for non-obvious choices. Put performance notes inline with the component they affect, not in a
  separate section. Document non-trivial logic at the implementation level, not "the system does X".

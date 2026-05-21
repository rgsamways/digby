# OpenSpec

Spec-driven development for Digby. Agents read specs before coding; changes go through a proposal → design → tasks workflow before implementation begins.

## Structure

```
openspec/
  specs/       # Evergreen capability specs — source of truth for how things work
  changes/     # Per-feature proposal folders — one subfolder per in-flight change
```

## Workflow

1. **New feature or change** → create a folder under `changes/FEATURE_NAME/` with:
   - `proposal.md` — what and why
   - `design.md` — technical decisions and approach
   - `tasks.md` — implementation checklist with acceptance criteria
   - `delta-spec.md` — which specs this change updates

2. **Agent reads** the relevant `specs/` file(s) before touching code

3. **After shipping** → update the affected `specs/` file, delete or archive the `changes/` folder

## Agent Instructions

Before starting any implementation work:
1. Check `openspec/changes/` for an active proposal matching the task
2. If found, read `design.md` and `tasks.md` first
3. Read the relevant `specs/` file(s) for the capability being changed
4. Update `tasks.md` checkboxes as you complete each item (`[ ]` → `[x]`)

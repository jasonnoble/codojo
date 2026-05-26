# Phase 1 Data Model: Onboarding Background — Sharing Options

This feature is content-centric; the only structured data is the learner profile
contract and the `profile.md` scaffold shape.

## Entity: LearnerProfile (`src/types/index.ts`)

The documented contract for the learner data that lives in `profile.md`. `init`
does not populate it; the mentor does, during onboarding. This feature changes one
field.

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `name` | `string` | unchanged | |
| `knownLanguages` | `KnownLanguage[]` | unchanged | |
| `targetLanguage` | `string` | unchanged | |
| `learningGoals` | `string` | unchanged | |
| ~~`linkedInUrl`~~ | ~~`string?`~~ | **removed** | LinkedIn fetch is unworkable (login wall) — FR-014 |
| `websiteUrl` | `string?` | **added** | Optional public URL (site/portfolio/blog) — FR-014 |
| `resumePath` | `string?` | unchanged | Path *inside* the workspace (sandbox) |
| `githubUsername` | `string?` | unchanged | |
| `onboarded` | `boolean` | unchanged | Gates the interview (FR-016) |

**Validation / rules**:
- All three background-source fields (`websiteUrl`, `resumePath`, `githubUsername`)
  are optional and independent — a learner may set zero, one, or several
  (FR-003/004/005).
- `resumePath` must point inside the workspace (Constitution Principle VIII);
  unchanged from today.
- No field is populated by `init`; the scaffold ships with `onboarded: false`.

## Entity: Background Source (conceptual)

A way the learner conveys professional background to the mentor. Not a stored
record — it maps onto the profile fields above plus free-form text folded into the
profile's Background note.

| Source | Captured in | Mentor action (instruction) |
|--------|-------------|------------------------------|
| Resume | `resumePath` + Background note | Ask to paste, or hand the learner a `!cp` command to copy it into the workspace; then parse (FR-006) |
| GitHub | `githubUsername` + Background note | Analyze public repos (FR-007) |
| Website | `websiteUrl` + Background note | Fetch & read; paste fallback if blocked (FR-008) |
| Something else | Background note | Free-form description, incorporated (FR-009) |

## Artifact: `profile.md` scaffold (`src/templates/profile.ts`)

The shipped, not-yet-populated scaffold. Two regions change:

- **Links section**: currently `LinkedIn:` / `GitHub:` / `Resume:`. After this
  feature: `GitHub:` / `Website:` / `Resume:` — no LinkedIn (FR-012).
- **Background note** (the HTML comment guiding what the mentor summarizes):
  drop "LinkedIn profile"; reference resume, GitHub, website, and the learner's own
  description (FR-013).

All other scaffold regions (front matter incl. `onboarded: false`, Name, Known
languages, Learning target, Goals) are unchanged (FR-015).

## State transition (unchanged, for context)

`profile.md` front matter `onboarded: false` → onboarding runs → mentor confirms
final contents → sets `onboarded: true`. This feature does **not** alter the
transition; it only changes what the background step collects while `onboarded:
false`. Already-onboarded profiles are never revisited (FR-016).

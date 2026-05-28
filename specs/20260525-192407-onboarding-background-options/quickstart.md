# Quickstart & Test Map: Onboarding Background — Sharing Options

How to build/verify, and the FR/SC → test mapping that satisfies Constitution
Principle IX (every claimed behavior is tested, or explicitly logged as manual
review where it is LLM runtime behavior codojo cannot execute).

## Build & test

```bash
npm test          # Jest (ts-jest ESM) — extend src/__tests__/templates.test.ts
npm run build     # tsc strict — must be clean (renaming linkedInUrl → websiteUrl)
```

## TDD order

1. **Red** — add a `describe('onboarding background step', …)` block and extend the
   profile assertions in `src/__tests__/templates.test.ts` for C1–C15 below; run
   `npm test` and watch them fail.
2. **Green** — edit `src/templates/claude.ts` (onboarding section) and
   `src/templates/profile.ts` (Links + Background note) to pass.
3. **Type change** — rename `linkedInUrl` → `websiteUrl` in `src/types/index.ts`;
   `npm run build` is the test (strict `tsc`).
4. **Refactor/tidy** — normalize "menu-driven" → "checklist" wording in spec
   Assumptions (Decision 5).

## FR → test map

| FR | Behavior | Verification |
|----|----------|--------------|
| FR-001 | No LinkedIn ask | Assert `rootClaudeMd()` does **not** match `/linkedin/i` |
| FR-002 | Background framing after Name | Assert script contains the framing sentence; Name precedes Background |
| FR-003 | Four options as a checklist | Assert script contains resume, GitHub username, website, "something else" labels |
| FR-004 | Optional (none) | Assert script states the learner may skip / share none |
| FR-005 | Multi-select (any/all) | Assert script states any combination / more than one is allowed |
| FR-006 | Resume → paste, or path → `!cp` into workspace; then parse | Assert script instructs paste **and** the learner-run copy command, then parse |
| FR-007 | GitHub → analyze public repos | Assert script instructs analyzing public repositories |
| FR-008 | Website → fetch + paste fallback | Assert script instructs fetch and the blocked-fetch paste fallback |
| FR-009 | Something else → free-form | Assert script invites a free-form description |
| FR-010 | Repeat back / confirm | Assert confirm-after-step instruction present |
| FR-011 | Brief clarifying follow-ups | Assert script permits light follow-up questions with an exit |
| FR-012 | Profile Links: GitHub/Website/Resume, no LinkedIn | Assert `profileMd()` Links lines; not match `/linkedin/i` |
| FR-013 | Background note: no LinkedIn | Assert Background note references supported sources, not LinkedIn |
| FR-014 | Contract: `websiteUrl`, no `linkedInUrl` | Strict `tsc` build clean after rename |
| FR-015 | Other steps unchanged | Assert script still contains Name, languages, target, goals steps |
| FR-016 | No re-interview of onboarded | Assert script keeps the `onboarded: false` gate; `profileMd()` still ships `onboarded: false` |

## SC → verification

| SC | Verification |
|----|--------------|
| SC-001 | FR-001 test (zero LinkedIn asks in the script) |
| SC-002 | FR-003/004/005 tests (four paths + skip all reachable) |
| SC-003 | FR-010 test (confirm-back present) |
| SC-004 | FR-001 + FR-012 + FR-013 tests (no LinkedIn in any shipped artifact) |
| SC-005 | Full `npm test` green + `npm run build` clean before done |

## Manual review (LLM runtime behavior — not unit-testable)

Per the Principle IX honesty note in plan.md, these are verified by reading the
generated `CLAUDE.md` and a real onboarding dry-run, not by assertion. Each row
carries a repeatable PASS criterion so the check does not rest on reviewer
judgment:

- **Sources folded in (FR-006–008 runtime half)** — the mentor fetches a supplied
  website / analyzes a supplied GitHub / parses a pasted-or-copied resume and folds
  it into the profile. **PASS** if, for every source the learner supplied, the
  resulting `profile.md` Background note carries at least one concrete detail
  traceable to that source (a named technology, role, or project) and no supplied
  source is silently dropped.
- **Recap / confirm after the background step (C8 / FR-010 runtime half)** — the
  mentor repeats back what it understood before moving on. **PASS** if the recap
  names at least two of the sources the learner selected (or all of them when fewer
  than two were given) and introduces no new factual claim about the learner's
  background that the learner did not provide.
- **Clarifying follow-ups stay light (C9 / FR-011 runtime half)** — **PASS** if
  follow-up questions total three or fewer, each is answerable in a single
  sentence, and the script offers an explicit exit ("or skip this") at least once.
- **Confirm before writing (Principle III)** — the mentor confirms `profile.md`
  contents before writing. **PASS** if it shows the proposed `profile.md` (or its
  substantive changes) and waits for an explicit go-ahead before the Write/Edit,
  with no write on an ambiguous or absent reply.

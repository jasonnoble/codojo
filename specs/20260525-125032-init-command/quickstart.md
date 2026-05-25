# Quickstart: `codojo init` — Build & Verify

This is the developer-facing checklist for implementing and validating the
feature. Per Constitution Principle IX, each behavior gets a **failing test
first**, then the code that makes it pass.

## Prerequisites

```bash
mise install          # Node ≥ 20 toolchain
npm install
```

## Build & test loop

```bash
npm run build         # tsc strict — MUST be clean (Principle VI)
npm test              # jest (ESM) — MUST be clean (Principle IX)
npm run dev           # tsc --watch, optional during development
```

## Manual smoke (after green tests)

```bash
node dist/cli.js init /tmp/codojo-demo     # happy path → exit 0, 10 files
node dist/cli.js init /tmp/codojo-demo     # 2nd run → non-empty abort, exit ≠ 0
ls /tmp/codojo-demo                        # confirm tree; nothing clobbered
```

## Requirement → test map (the SC-006 coverage contract)

Every row MUST have a passing test before the feature is "done". Suggested
home file in parentheses.

| Req | Behavior | Test |
|-----|----------|------|
| FR-001 | Path arg skips the prompt | runInit with arg writes to that path, no prompt (`init.test.ts`) |
| FR-002 | No arg → prompt with default `~/workspace/codojo` | mocked `input` invoked with that default (`init.test.ts`) |
| FR-003 | `~`, bare `~`, relative resolution | `expandHome` cases (`smoke.test.ts`, present) |
| FR-004 | Non-empty target aborts, writes nothing, non-zero | pre-seed file → runInit → no manifest files, `process.exitCode ≠ 0` (`init.test.ts`) |
| FR-004 (clarified) | Hidden-only dir (`.DS_Store`) counts as non-empty | pre-seed `.DS_Store` → abort (`init.test.ts`) |
| FR-005 | Full tree + all 10 files written | runInit into temp dir → every manifest path exists (`init.test.ts`) |
| FR-006 | No file is empty | each written file size > 0 (`init.test.ts`); manifest content non-empty (`smoke.test.ts`, present) |
| FR-007 | settings.json valid JSON + permission rules | parse + allow/deny globs (`templates.test.ts`; partial in `smoke.test.ts`) |
| FR-007 (behavioral) | CLAUDE.md says confirm before editing profile/goals | `rootClaudeMd()` contains the confirm instruction (`templates.test.ts`) |
| FR-008 | profile.md `onboarded: false` | content assertion (`smoke.test.ts`, present) |
| FR-009 | Success output content & order | console.log spy, ordered assertions (`output.test.ts`) |
| FR-010 | No network, no onboarding, no identity writes | profile/goals ship as blank scaffolds; no net calls in code path (`init.test.ts` / review) |
| FR-011 | Ctrl-C → exit 130, nothing written | `exitCodeForError(ExitPromptError) === 130`; mocked cancel writes no files (`cli.test.ts`, `init.test.ts`) |
| FR-012 | Uncreatable path → OS error, non-zero | `exitCodeForError(other) === 1`; unwritable target surfaces error (`cli.test.ts`) |
| FR-013 | Path exists but not a directory → clear abort, non-zero | pre-create a file at target → runInit → distinct message, `exitCode ≠ 0`, nothing written (`init.test.ts`) |

| Success criterion | Verification |
|-------------------|--------------|
| SC-001 (<30 s) | manual smoke completes instantly; no perf test needed |
| SC-002 (100% manifest present) | FR-005 test |
| SC-003 (zero data loss) | FR-004 + FR-013 "writes nothing" assertions |
| SC-004 (every error actionable, correct codes) | FR-004/011/012/013 exit-code + message tests |
| SC-005 (output is self-sufficient) | FR-009 ordered-output test |
| SC-006 (every behavior tested, suite green) | this whole table + `npm test` clean |

## Definition of done

- [ ] All rows above have a passing test.
- [ ] FR-013 implemented (was a behavior gap).
- [ ] `exitCodeForError` extracted and unit-tested.
- [ ] `npm run build` clean (strict), `npm test` clean.
- [ ] No new runtime dependencies; ESM-only; no CommonJS in shipped code.

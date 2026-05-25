# Phase 0 Research: `codojo init`

No `NEEDS CLARIFICATION` markers remained after `/speckit-clarify`. The open
questions here are all about *how to test* an existing CLI command faithfully
under the ESM + ts-jest toolchain, plus the one behavior gap (FR-013).

## Decision 1 — How to assert exit codes (FR-004, FR-011, FR-012, FR-013)

**Decision**: Keep the existing split — `runInit` signals failure by setting
`process.exitCode` (never calls `process.exit`), and `cli.ts` maps thrown errors
to a code in its top-level `.catch`. Extract that mapping into a pure helper
`exitCodeForError(err): number` so it is unit-testable in isolation. Tests assert
`process.exitCode` for the abort cases and assert `exitCodeForError` returns 130
for an `ExitPromptError` and 1 otherwise.

**Rationale**: In-process assertions are deterministic and fast and need no build
step. `process.exit` cannot be observed by a Jest test without monkey-patching;
`process.exitCode` can be read directly. The error→code mapping is the only logic
behind the 130 path, and isolating it makes the Ctrl-C contract testable without
actually sending a signal.

**Alternatives considered**:
- *Subprocess integration tests* (spawn `dist/cli.js`, assert exit code + stdout):
  most faithful, but slow, requires a prior `tsc` build, and makes simulating a
  Ctrl-C at the prompt non-deterministic. Rejected as the primary approach; may
  be added later as a thin smoke check.
- *Mocking `process.exit` to throw*: works but is brittle and couples tests to a
  global. Rejected in favor of the pure helper.

## Decision 2 — Mocking the interactive prompt under ESM (FR-001, FR-002, FR-011)

**Decision**: Use `jest.unstable_mockModule('@inquirer/prompts', …)` followed by a
dynamic `await import(...)` of the module under test, inside the test files that
exercise the prompt. The mock's `input` resolves a chosen path (prompt-shown
path) or rejects with an `ExitPromptError`-shaped error (cancellation).

**Rationale**: The project is pure ESM (`type: module`, NodeNext). Jest's classic
`jest.mock` hoisting does not work for ESM; `unstable_mockModule` + dynamic import
is the supported pattern under `ts-jest/presets/default-esm` with
`--experimental-vm-modules` (already configured). The CLI-arg path (FR-001) needs
no mock at all — passing `argv[0]` skips the prompt — so most filesystem tests
avoid mocking entirely.

**Alternatives considered**:
- *Dependency injection of the prompt fn into `runInit`*: cleaner for testing but
  changes the public signature for a single test seam. Deferred — only adopt if
  module mocking proves flaky.
- *Stubbing stdin*: too low-level and platform-sensitive. Rejected.

## Decision 3 — Filesystem isolation (FR-005, FR-006, FR-004, SC-003)

**Decision**: Each filesystem test creates a unique temp dir via
`fs.mkdtemp(path.join(os.tmpdir(), 'codojo-'))`, runs `runInit([tmpPath/...])`,
asserts on disk, and removes the dir in `afterEach`. The "non-empty" and
"not-a-directory" abort tests pre-seed the temp location accordingly (including a
hidden-only `.DS_Store` case for the clarified FR-004 rule).

**Rationale**: Real temp dirs exercise the actual `fs-extra` writes (no mock drift)
while never touching the learner's real home directory — itself a nod to
Principle VIII. `mkdtemp` guarantees isolation across parallel tests.

**Alternatives considered**:
- *`memfs`/in-memory fs mock*: faster but risks diverging from real `fs-extra`
  semantics (e.g., `ensureDir`, `readdir` on a file). Rejected; the writes are
  tiny and real I/O is cheap here.

## Decision 4 — FR-013 detection (target exists but is not a directory)

**Decision**: Before the emptiness check, stat the resolved target; if it exists
and `!isDirectory()`, print a clear "path exists and is not a directory" error and
set a non-zero `process.exitCode`, writing nothing. Reuse the same early-return
shape as the non-empty guard so behavior and tests are symmetric.

**Rationale**: The current `isNonEmptyDir` calls `fs.readdir` on the path; for a
regular file that throws `ENOTDIR`, which bubbles up as an opaque stack rather
than the actionable message FR-013 requires. An explicit `stat`/`lstat` check
turns it into a first-class, testable abort consistent with the "never clobber"
posture.

**Alternatives considered**:
- *Catch `ENOTDIR` and rewrite the message*: works but couples to an errno string
  and is harder to read than an explicit type check. Rejected.

## Decision 5 — Asserting success-output content & order (FR-009)

**Decision**: Spy on `console.log` (and `console.error` for the abort cases),
capture the call sequence, and assert: a scaffolding line naming the path → one
`+ <file>` line per manifest entry → a readiness line → the `cd … && claude`
instruction, in that order. Strip ANSI with a small helper since `chalk` is on.

**Rationale**: Order and presence are the observable contract; a console spy
captures both without a subprocess. `chalk` auto-detects non-TTY and may already
disable color under Jest, but stripping ANSI defensively keeps assertions stable.

**Alternatives considered**:
- *Snapshot testing the whole output*: brittle against path/format tweaks.
  Rejected in favor of explicit ordered assertions.

## Summary of resolutions

| Topic | Resolution |
|-------|-----------|
| Exit codes | `process.exitCode` + pure `exitCodeForError` helper |
| Prompt / Ctrl-C | `jest.unstable_mockModule` + dynamic import; CLI-arg path skips prompt |
| FS isolation | per-test `mkdtemp`, real `fs-extra`, cleanup in `afterEach` |
| FR-013 | explicit `stat().isDirectory()` check → clear message, non-zero exit |
| Output assertions | ordered `console.log` spy with ANSI stripping |

All unknowns resolved. No new runtime dependencies. Ready for Phase 1.

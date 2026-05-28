# Phase 0 Research: Onboarding Background — Sharing Options

This feature carried no `NEEDS CLARIFICATION` markers out of `/speckit-specify`
or `/speckit-clarify`. The two items `/speckit-clarify` marked **Deferred** to
planning are resolved here, plus the test strategy for instruction-content.

## Decision 1 — Profile data-contract field name

**Decision**: Rename `LearnerProfile.linkedInUrl?: string` to
`websiteUrl?: string`.

**Rationale**: It mirrors the `*Url` convention of the field it replaces and sits
naturally beside the existing `resumePath?` and `githubUsername?` optional fields.
The field stays optional because the background step is optional (FR-004) and
multi-select (FR-003/005) — a learner may supply zero, one, or several sources.

**Alternatives considered**: `website` (dropped — loses the `Url` suffix the
sibling field used and is vaguer about expecting a URL); `personalSiteUrl`
(dropped — narrower than the spec's "any public URL: site, portfolio, or blog").

## Decision 2 — How the chat-based mentor presents a "multi-select checklist"

**Decision**: In `rootClaudeMd()`, the background step introduces itself with the
required framing, then lists the four options as a short enumerated list and
explicitly invites the learner to pick **any combination, including none** (e.g.
"share any, all, or none of these"). It is described as a checklist in intent, not
rendered as a GUI widget.

**Rationale**: The mentor runs inside a conversational Claude Code session, not a
form UI; "multi-select checklist" (FR-003) is satisfied by instructing the mentor
to accept any subset of the options in the learner's reply. This keeps the
interview conversational (Constitution Principle II) while making the
any/all/none intent unambiguous to the LLM and assertable in tests.

**Alternatives considered**: A literal numbered prompt requiring the learner to
reply with numbers (dropped — too form-like for a mentoring conversation); a free
single open question with no enumerated options (dropped — the spec requires the
four options be presented as discoverable choices).

## Decision 3 — Onboarding step ordering after consolidation

**Decision**: The step sequence becomes: (1) Name → (2) Background [multi-select:
resume / GitHub / website / something else] → (3) Current languages & experience →
(4) Learning target → (5) Goals. The former separate LinkedIn (2), Resume (3), and
GitHub (4) steps collapse into the single Background step.

**Rationale**: Two layers — what the spec mandates, and *why that mandate is the
right call*.

- *Mandated*: FR-002 fixes Background immediately after Name; FR-015 keeps the
  remaining steps unchanged. Consolidating resume+GitHub (previously their own
  steps) into the Background checklist is exactly the spec's "replaces and
  consolidates" assumption, and matches the user's original request.
- *Why it's preferable*: collecting background early means the mentor enters the
  Languages and Target steps with real context already in hand. A parsed resume or
  analyzed GitHub profile surfaces the learner's actual stack and seniority, so the
  mentor can ground those later questions in specifics ("I see Rails and Go in your
  history — which do you want to build on?") instead of asking about experience in
  the abstract. Background is the richest and least-leading signal we gather, so
  taking it first lets every subsequent step be calibrated rather than cold.

**Counter-argument considered**: Placing Background *after* Target Language — so the
mentor knows what to look for in a resume or GitHub profile before reading it — was
weighed and rejected. The mentor reads background sources holistically (full work
history, all public repos), not filtered to one target, so knowing the target first
buys little; meanwhile deferring Background would force the Languages and Target
questions to run blind, the exact abstraction this ordering avoids. Knowing the
learner's existing stack *before* asking what they want to learn makes for a
better-informed target conversation, not a worse one (and FR-002 pins Background
after Name regardless).

**Alternatives considered**: Keeping Background last (dropped — FR-002 pins it
after Name, and it would strand the Languages/Target steps without context);
keeping resume/GitHub as separate trailing steps (dropped — contradicts the
consolidation the spec calls for).

## Decision 4 — Test strategy for instruction-content (Principle IX)

**Decision**: Cover each requirement by asserting the **content of the generated
template strings** in `src/__tests__/templates.test.ts`:

- `rootClaudeMd()` MUST contain the framing sentence, the four option labels
  (resume, GitHub username, website, something else), the per-method instructions
  (paste/copy resume into workspace; analyze public repos; fetch website with
  paste fallback; free-form), the any/all/none multi-select intent, the
  clarifying-follow-ups allowance, and MUST NOT contain "LinkedIn".
- `profileMd()` Links section MUST list GitHub, Website, Resume and MUST NOT
  contain "LinkedIn"; the Background note MUST NOT mention LinkedIn.
- A type-level expectation that `LearnerProfile` exposes `websiteUrl` and not
  `linkedInUrl` is enforced by the strict `tsc` build (the field is referenced
  nowhere else, so removal compiles only once renamed).

**Rationale**: The shipped artifact is the instruction text; asserting its content
is the meaningful, deterministic test. Actual mentor adherence (does the LLM truly
fetch the site, ask good follow-ups?) is non-deterministic and recorded as manual
review in quickstart.md — the same honest split the `init` plan used for FR-007
(behavioral half) and FR-010 (no-network).

**Alternatives considered**: Mocking an LLM to assert behavior (dropped —
out of scope, non-deterministic, and codojo runs no LLM itself); snapshot-testing
the whole template (dropped — brittle against benign wording edits; targeted
substring/regex assertions express intent better).

## Decision 5 — Terminology normalization

**Decision**: Use "checklist" / "options" consistently in the new template
content; the spec's Assumptions line still says "menu-driven step" (the cosmetic
drift `/speckit-clarify` flagged as Outstanding-low). Tidy that one word in the
spec during implementation so spec and templates agree.

**Rationale**: Keeps the canonical term consistent across spec, plan, and shipped
content (Terminology & Consistency taxonomy) at zero risk.

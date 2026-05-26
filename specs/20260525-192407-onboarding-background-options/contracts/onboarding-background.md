# Contract: Onboarding Background Step

The "interface" this feature defines is the onboarding script embedded in the
generated workspace's `CLAUDE.md` (`rootClaudeMd()`), which the mentor (Claude
Code) executes, and the `profile.md` scaffold it writes into. This contract states
what that text MUST and MUST NOT contain. Tests assert against the template
strings; runtime adherence is manual review (see quickstart.md).

## Onboarding script — `rootClaudeMd()`

**Gate** (unchanged): the onboarding section applies only while `profile.md` has
`onboarded: false` (FR-016).

**Step sequence**: Name → **Background** → Current languages & experience →
Learning target → Goals (FR-002, FR-015).

### Background step — MUST contain

| # | Requirement | Content the script must carry |
|---|-------------|-------------------------------|
| C1 | FR-002 | Framing equivalent to "To help you get the most out of this process, I need to know a little about your background…" |
| C2 | FR-003 | All four options presented as a checklist: (a) resume, (b) GitHub username, (c) website, (d) something else / free-form |
| C3 | FR-003/004/005 | Explicit any/all/none multi-select intent — the learner may pick more than one, or skip entirely |
| C4 | FR-006 | Resume: instruct the learner to **paste** the resume text, **or** give its path — in which case the script directs the mentor to hand the learner a ready-to-run `!cp <path> ./resume.<ext>` command (the **learner** runs it; the mentor can't write into the sandboxed workspace) to bring it to the workspace root, then read & parse it. **Paste is the fallback** for formats the Read tool can't parse (e.g. `.docx`). |
| C5 | FR-007 | GitHub: analyze the username's public repositories to gauge real-world experience |
| C6 | FR-008 | Website: fetch & read; if the fetch is blocked, ask the learner to paste the relevant parts |
| C7 | FR-009 | Something else: let the learner describe their background in their own words and incorporate it |
| C8 | FR-010 | Repeat back / confirm understanding after the background step (consistent with the confirm-after-each-step rule) |
| C9 | FR-011 | May ask brief clarifying follow-up questions, kept light, with an always-available exit |

### Background step — MUST NOT contain

| # | Requirement | Prohibition |
|---|-------------|-------------|
| C10 | FR-001 | No request for a LinkedIn profile or URL anywhere in the onboarding script |
| C11 | FR-008/Edge | No instruction to *fetch* LinkedIn (login-wall); if a learner offers one under "something else", explain it can't be viewed and ask for a paste |

## Profile scaffold — `profileMd()`

| # | Requirement | Content |
|---|-------------|---------|
| C12 | FR-012 | Links section lists GitHub, Website, Resume — no LinkedIn line |
| C13 | FR-013 | Background note references resume / GitHub / website / own description — not LinkedIn |
| C14 | FR-008 (unchanged) | Ships `onboarded: false`, blank identity (existing init tests still pass) |

## Type contract — `LearnerProfile`

| # | Requirement | Content |
|---|-------------|---------|
| C15 | FR-014 | Exposes `websiteUrl?: string`; no `linkedInUrl` field (enforced by strict `tsc`) |

## Out of scope (asserted by absence)

- No migration of already-onboarded learners (FR-016) — onboarding script does not
  re-run for `onboarded: true`; tracked in issue #4.
- No change to `.claude/settings.json` permission boundaries (Principle VIII).

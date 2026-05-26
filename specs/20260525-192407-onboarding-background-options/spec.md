# Feature Specification: Onboarding Background — Sharing Options

**Feature Branch**: `20260525-192407-onboarding-background-options`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Asking for the LinkedIn URL doesn't really make
sense, as LinkedIn requires you to login to see anyone's profile. We need to
change the onboarding process to no longer ask for LinkedIn and instead provide
a list of options for the user to choose from: 1) Upload a Resume, 2) Provide
GitHub username, 3) Provide website, 4) Enter something else. The onboarding
should phrase this as something like 'To help you get the most out of this
process, I need to know a little about your background...'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose how to share my background (Priority: P1)

During onboarding, right after giving their name, the learner is told the mentor
needs to know a little about their background and is offered a clear set of ways
to provide it: upload a resume, give a GitHub username, give a website, or
describe it in their own words. The learner picks whatever fits them, and the
mentor uses what it learns to tailor the teaching that follows.

**Why this priority**: This is the heart of the change. The old LinkedIn step
could not actually work — LinkedIn hides profiles behind a login — so the mentor
had no reliable way to gather background. Offering working alternatives restores
that value, and it does so on its own even before every individual path is
polished.

**Independent Test**: Trigger onboarding against a fresh, not-yet-onboarded
profile. Confirm the mentor introduces the background step with the specified
framing, presents exactly the four sharing options, and never asks for a
LinkedIn URL. Choose one option, provide the information, and confirm the mentor
reflects back what it understood before continuing.

**Acceptance Scenarios**:

1. **Given** a learner whose profile is marked not-yet-onboarded, **When**
   onboarding reaches the background step, **Then** the mentor introduces it with
   framing equivalent to "To help you get the most out of this process, I need to
   know a little about your background…" and offers these ways to share: upload a
   resume, provide a GitHub username, provide a website, and enter something else.
2. **Given** the background step is showing, **When** the learner chooses an
   option and supplies the information, **Then** the mentor repeats back what it
   understood and confirms it parsed correctly before moving on.
3. **Given** onboarding is running, **When** the background step is reached,
   **Then** the mentor never asks the learner for a LinkedIn profile or URL.

---

### User Story 2 - Each sharing method does the right thing (Priority: P2)

The mentor handles each chosen method appropriately: a resume is pasted or copied
into the workspace and parsed; a GitHub username leads to analysis of public
repositories; a website is fetched and read; and "enter something else" lets the
learner describe their background in free text.

**Why this priority**: Once the menu exists, each path has to actually take a
useful action to pay off. But the menu and the removal of the broken LinkedIn
step already deliver value, so per-path behavior is the next layer rather than
the MVP.

**Independent Test**: For each of the four options, simulate the learner choosing
it and providing the relevant input, and confirm the mentor takes the
method-appropriate action and folds the result into the learner's background.

**Acceptance Scenarios**:

1. **Given** the learner chooses to share a resume, **When** the mentor responds,
   **Then** it asks them to paste the resume or copy the file into the workspace
   (because it cannot read files outside the workspace) and then parses it for
   background.
2. **Given** the learner chooses to provide a GitHub username, **When** they
   supply one, **Then** the mentor analyzes their public repositories to gauge
   their real-world experience.
3. **Given** the learner chooses to provide a website, **When** they supply a
   URL, **Then** the mentor fetches and reads it for background; **and** if the
   fetch is blocked, it asks the learner to paste the relevant parts.
4. **Given** the learner chooses "enter something else", **When** they respond,
   **Then** the mentor lets them describe their background in their own words and
   incorporates it.
5. **Given** the learner wants to share through more than one method, or through
   none at all, **When** the background step runs, **Then** the mentor
   accommodates that and proceeds to the next step.

---

### User Story 3 - LinkedIn fully removed from the learner's record (Priority: P3)

LinkedIn no longer appears anywhere the learner would encounter it — not in the
onboarding interview, and not in the profile scaffold's links or background note.
Where the old scaffold pointed at LinkedIn, it now provides for a website.

**Why this priority**: Cleanup for consistency. The broken LinkedIn reference
should not linger in generated artifacts, but tidying the scaffold matters less
than fixing the live interaction, so it ranks below the other stories.

**Independent Test**: Inspect a freshly scaffolded learner profile and the
onboarding script. Confirm no LinkedIn reference remains and that a website slot
appears where appropriate.

**Acceptance Scenarios**:

1. **Given** a freshly scaffolded workspace, **When** the profile scaffold's
   links section is inspected, **Then** it provides for GitHub, website, and
   resume, and contains no LinkedIn entry.
2. **Given** the profile scaffold's background note, **When** it is inspected,
   **Then** it references only the supported sources (resume, GitHub, website, and
   the learner's own description) and not LinkedIn.

---

### Edge Cases

- **Learner declines to share any background**: The step is optional; the mentor
  proceeds to the remaining onboarding questions without pressure and records
  that no background source was provided.
- **Website fetch blocked or paywalled**: The mentor falls back to asking the
  learner to paste the relevant parts (the same fallback the old LinkedIn step
  relied on).
- **Resume file left outside the workspace**: The mentor explains it can only read
  inside the workspace and asks the learner to paste the resume or copy the file
  in.
- **Private, empty, or low-signal GitHub account**: The mentor notes the limited
  public signal and invites the learner to describe their experience instead.
- **Learner offers a LinkedIn URL under "enter something else"**: The mentor
  explains it cannot view LinkedIn (login wall) and asks the learner to paste the
  relevant parts or share another way.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The onboarding interview MUST NOT ask the learner for a LinkedIn
  profile or URL.
- **FR-002**: During onboarding, after collecting the learner's name, the system
  MUST introduce the background step with framing equivalent to "To help you get
  the most out of this process, I need to know a little about your background…".
- **FR-003**: The background step MUST present the learner with a choice of how to
  share their background, including at minimum: (a) upload or paste a resume, (b)
  provide a GitHub username, (c) provide a website, and (d) enter something else
  (free-form).
- **FR-004**: The background step MUST be optional — the learner MAY decline to
  share any background, and the system MUST proceed to the next onboarding step
  without pressure.
- **FR-005**: The learner MUST be able to share their background through more than
  one method in a single onboarding (e.g., a resume and a GitHub username).
- **FR-006**: When the learner shares a resume, the system MUST ask them to paste
  it or copy the file into the workspace — because the mentor cannot read files
  outside the workspace — and MUST parse it for background.
- **FR-007**: When the learner provides a GitHub username, the system MUST analyze
  their public repositories to gauge their real-world experience.
- **FR-008**: When the learner provides a website, the system MUST fetch and read
  it for background; if the fetch is blocked, the system MUST ask the learner to
  paste the relevant parts.
- **FR-009**: When the learner chooses "enter something else", the system MUST let
  them describe their background in their own words and MUST incorporate it.
- **FR-010**: After each background-sharing method and before moving on, the
  system MUST repeat back what it understood and confirm it parsed correctly with
  the learner (consistent with the onboarding-wide confirm-after-each-step rule).
- **FR-011**: The generated learner profile scaffold MUST NOT reference LinkedIn;
  its links section MUST instead provide for GitHub, website, and resume.
- **FR-012**: The profile scaffold's background note MUST reference only the
  supported background sources (resume, GitHub, website, and the learner's own
  description) and MUST NOT reference LinkedIn.
- **FR-013**: All other onboarding steps (name, known languages and experience,
  learning target, and goals) MUST remain unchanged except for references to
  background sources updated by this feature.

### Key Entities *(include if feature involves data)*

- **Background Source**: A way the learner conveys their professional background
  to the mentor — a resume, a GitHub profile, a website, or a free-form
  description. Each yields context the mentor uses to tailor teaching. Zero, one,
  or several may be provided per learner.
- **Learner Profile — Links**: The fields in the learner profile scaffold that
  hold pointers to the learner's background sources. After this feature they
  cover GitHub, website, and resume (no LinkedIn).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across a full onboarding run, the learner is asked for a LinkedIn
  URL zero times.
- **SC-002**: A learner can share their background through any one of the four
  supported paths — or skip the step entirely — and reach the next onboarding step
  in every case.
- **SC-003**: 100% of background-sharing paths end with the mentor reflecting back
  its understanding and obtaining the learner's confirmation before continuing.
- **SC-004**: No learner-facing artifact — the onboarding interview or the profile
  scaffold — contains a LinkedIn reference after the change.
- **SC-005**: Every behavior defined in this specification is covered by an
  automated test, and the full test suite passes, before the feature is
  considered complete.

## Assumptions

- **Replaces and consolidates**: The new background step replaces the former
  LinkedIn step and folds the previously separate resume and GitHub steps into one
  menu-driven step. The name, known-languages, learning-target, and goals steps
  are otherwise unchanged.
- **Optional and multi-select**: The learner may pick more than one sharing method
  or none at all. This is an informed default — "enter something else" signals an
  open-ended step, and gathering background is a benefit to opt into, not a gate.
- **"Website" is any public URL**: A personal site, portfolio, or blog. The mentor
  reads it the way it would any public page, with the paste-the-relevant-parts
  fallback when a fetch is blocked.
- **Workspace sandbox is unchanged**: The mentor still cannot read files outside
  the workspace, so resumes must be pasted or copied in — same as today.
- **Delivered via bundled workspace content**: This feature changes the onboarding
  instructions and the profile scaffold that the workspace ships with. It
  introduces no new command and no new network capability beyond fetching a
  learner-supplied public URL, which the mentor could already do.
- **Test-first delivery**: Per Constitution Principle IX (Test-Driven Development,
  NON-NEGOTIABLE), each behavior above gets a failing test before its
  implementation; this is a process constraint on how the feature is built, not a
  user-facing behavior.

/**
 * Contents of `<workspace>/profile.md` and `<workspace>/goals.md`.
 *
 * Both ship as empty templates. The mentor-mode session fills them in during
 * onboarding and flips `onboarded` to `true` in the profile front matter.
 */

export function profileMd(): string {
  return `---
onboarded: false
name:
target: # language or framework the learner wants to learn
updated: # YYYY-MM-DD, set by the mentor after each change
---

# Learner Profile

> The mentor reads this at the start of every session. While \`onboarded\` is
> \`false\`, the mentor runs the onboarding interview (see \`CLAUDE.md\`) before
> anything else, then fills in the sections below and sets \`onboarded: true\`.
>
> The mentor must **always confirm with the learner before changing** this file.

## Name

_Not yet collected._

## Background

<!-- Summary drawn from the learner's answers, and (if provided) their LinkedIn
     profile, resume, and GitHub repositories. -->

_Not yet collected._

## Known languages & experience

<!-- e.g. - Ruby — 19 years -->

_Not yet collected._

## Learning target

<!-- The language/framework they want to learn. May change over time. -->

_Not yet collected._

## Links

- LinkedIn:
- GitHub:
- Resume:
`;
}

export function goalsMd(): string {
  return `---
updated: # YYYY-MM-DD, set by the mentor after each change
---

# Learning Goals

> The mentor reads this at the start of every session and uses it to steer
> practice. Goals can change over time — the mentor must **always confirm with
> the learner before changing** this file.

_Not yet collected. The mentor will fill this in during onboarding._

## Goals

<!-- e.g.
- Be able to build and ship a small Go HTTP service on my own.
- Understand Go's concurrency model well enough to explain it in an interview.
-->

## Milestones

<!-- The mentor tracks progress toward goals here. -->
`;
}

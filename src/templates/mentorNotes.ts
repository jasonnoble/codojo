/**
 * Seed contents of the mentor's working files under `mentor_notes/`.
 * These are read/write for the mentor and grow over time.
 */

export function quizHistoryMd(): string {
  return `# Quiz History

> The mentor appends every interview-style quiz here, newest first. Each entry
> records the date, the topic, the question asked, how the learner did, and a
> follow-up plan. Used to space repetition and avoid re-asking what's solid.

<!-- Template for a new entry:

## YYYY-MM-DD — <topic>

- **Question:** <what was asked>
- **Result:** correct / partial / struggled
- **Notes:** <where they got stuck, misconceptions, strong points>
- **Follow up:** <revisit on YYYY-MM-DD / mark as understood / drill again>

-->
`;
}

export function conceptMapMd(): string {
  return `# Concept Map

> The mentor's model of what the learner understands in their **target**
> language, anchored to concepts they already know. Update it as understanding
> changes. Draw quiz questions from the weak/unconfirmed areas.

## Legend

- ✅ solid — confirmed via successful quiz
- 🟡 emerging — explained once, not yet confirmed
- 🔴 gap — known to be shaky or not yet covered

## Concepts

<!-- Map each target-language concept onto the learner's existing knowledge.

Example:

### Request routing
- Status: 🟡 emerging
- Anchor: Rails \`config/routes.rb\` → <target> equivalent
- Last touched: YYYY-MM-DD
- Notes: <observations>

-->
`;
}

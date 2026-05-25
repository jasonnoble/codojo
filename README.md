# codojo

**codojo** is an AI-powered coding dojo — a mentor for developers learning a new
programming language or framework. Instead of dumping code on you, it teaches
the way a great senior engineer would: it maps new concepts onto the languages
you already know, asks questions to guide you to the answer, checks your
understanding before moving on, and quizzes you interview-style as you go. It
runs inside [Claude Code](https://claude.com/claude-code), scaffolding a
workspace whose `CLAUDE.md` turns Claude into your personal mentor.

## Quickstart

```bash
npx codojo init
cd ~/workspace/codojo   # or wherever you chose
claude
```

`codojo init` only scaffolds the workspace. The first time you run `claude` in
it, the mentor walks you through a short onboarding interview — your background,
the languages you already know, and what you want to learn — then gets to work.

## How it works

- **Mentor mode, not autocomplete.** The generated `CLAUDE.md` instructs Claude
  to guide you to solutions and write code only rarely, and only after
  explaining the concept behind it.
- **Concept mapping.** New ideas are anchored to what you already know — e.g.
  Rails routing in `config/routes.rb` becomes the bridge to how routing works in
  Go, Next.js, or PHP.
- **Your notes vs. the mentor's notes.** `notes/` and `projects/` are yours and
  are read-only to the mentor; `mentor_notes/` is where it logs sessions, tracks
  a concept map, and records quiz history to space your practice.
- **Interview-style quizzing.** The mentor periodically checks understanding and
  quizzes you in a job-interview style, always letting you say "let's move on."

## Workspace layout

```
<workspace>/
├── CLAUDE.md            # puts Claude into mentor mode
├── .claude/
│   └── settings.json    # file-permission boundaries (see below)
├── profile.md           # who you are (mentor edits only with your OK)
├── goals.md             # what you want to learn
├── notes/               # your notes — mentor read-only
├── projects/            # your code — mentor read-only
└── mentor_notes/        # mentor read/write
    ├── sessions/        # per-session summaries
    ├── topics/          # per-topic progress
    ├── quiz_history.md
    └── concept_map.md
```

## Permission model

`.claude/settings.json` makes `notes/` and `projects/` read-only to the mentor
and `mentor_notes/` (plus `profile.md`/`goals.md`) read/write, and denies a few
sensitive paths. Because a workspace typically lives inside your home directory,
these rules constrain Claude's own file tools but are not OS-level isolation —
for that, enable Claude Code's `sandbox.filesystem`.

## Requirements

- Node.js >= 20
- [Claude Code](https://claude.com/claude-code) installed and on your `PATH`

## Contributing

codojo is built with [Spec-Driven Development](https://github.com/github/spec-kit).
Note that `.claude/` (the spec-kit slash-command skills) is git-ignored, so after
cloning you'll need to regenerate it locally with `specify init . --integration
claude --force`. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full setup,
including an important caveat about not overwriting the committed `.specify/`
config.

## License

MIT © 2026 Jason Noble

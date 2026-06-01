<p align="center">
  <img src=".github/assets/codojo_logo.png" alt="codojo" width="440">
</p>

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

<details>
<summary>Screenshots of onboarding process</summary>

### Get to know each other
![Get to know each other](https://raw.githubusercontent.com/jasonnoble/codojo/main/readme_screenshots/onboarding-whats-your-name.png)

### Parse your resume to learn your background
![Parse your resume to learn your background](https://raw.githubusercontent.com/jasonnoble/codojo/main/readme_screenshots/onboarding-resume.png)

### Look at your Github repos
![Look at your Github repos](https://raw.githubusercontent.com/jasonnoble/codojo/main/readme_screenshots/onboarding-github.png)

### What do you want to learn or practice?
![What do you want to learn or practice?](https://raw.githubusercontent.com/jasonnoble/codojo/main/readme_screenshots/onboarding-learning-goals.png)

</details>

<details>
<summary>Screenshots of mentoring session</summary>

### Where were we?
![Where were we?](https://raw.githubusercontent.com/jasonnoble/codojo/main/readme_screenshots/session-where-were-we.png)

### What should we work on in this session?
![What should we work on in this session?](https://raw.githubusercontent.com/jasonnoble/codojo/main/readme_screenshots/session-what-to-cover.png)

### Learn about React components using existing knowledge as a guide
![Learn about React components using existing knowledge as a guide](https://raw.githubusercontent.com/jasonnoble/codojo/main/readme_screenshots/session-components-and-prompts.png)

</details>

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

A generated workspace is confined two ways:

- **OS-level sandbox (the real boundary).** `.claude/settings.json` declares a
  `sandbox` block that Claude Code enforces at the OS level (Seatbelt on macOS,
  bubblewrap on Linux/WSL2): the mentor's shell commands can only **read** inside
  the workspace, and **all shell writes are denied**. This holds regardless of
  what the mentor runs — it isn't just a guardrail on Claude's own tools.
- **Permission rules (tool-level).** The same file keeps `notes/` and `projects/`
  read-only to the mentor and lets it write `mentor_notes/`, `profile.md`, and
  `goals.md` — but these rules bind only Claude's own file tools, not the shell
  subprocesses it spawns, so they are backed by the sandbox rather than relied on
  alone.

Because shell writes are denied workspace-wide, the mentor changes its own files
through its Edit/Write tools and hands any write-needing shell command to you to
run. Network tools are blocked too, with one opt-in exception:

- **`codojo init --allow-gh-cli`** enables a closed, **read-only** set of GitHub
  CLI lookups (viewing/listing PRs, issues, and runs; searching; repo and status
  views). `gh` runs outside the sandbox (it can't complete TLS inside it), so the
  flag is a deliberate, opt-in widening of the boundary; mutating and `gh auth`
  commands still require your approval. Without the flag, `gh` is blocked
  entirely.

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

# Contract: `codojo init` command

## Synopsis

```
codojo init [dir] [--allow-gh-cli]
```

## Arguments & flags

| Token | Kind | Description |
|-------|------|-------------|
| `dir` | positional, optional | Workspace directory. First argv token NOT starting with `--`. If omitted, the interactive prompt asks for it (default `~/workspace/codojo`). |
| `--allow-gh-cli` | boolean flag, optional | Opt in to read-only GitHub CLI access in the generated workspace. Default: off. Recognized in any position. |

## Behavior

- `--allow-gh-cli` is recognized whether it appears before or after `dir` (`codojo init --allow-gh-cli ~/x` ≡ `codojo init ~/x --allow-gh-cli`).
- A `--allow-gh-cli` token is never interpreted as `dir`.
- `--allow-gh-cli` with no positional dir → flag consumed; interactive dir prompt still appears.
- Unknown `--…` tokens do NOT enable gh access (only the exact `--allow-gh-cli` matches). Existing behavior for unknown/extra args is otherwise unchanged.
- Existing non-empty-directory refusal and not-a-directory handling are unchanged (FR-012).

## USAGE text

`cli.ts` help gains:

```
init [dir] [--allow-gh-cli]   Scaffold a new learning workspace (default: ~/workspace/codojo)
                              --allow-gh-cli: enable read-only GitHub CLI for the mentor
```

## Exit codes

Unchanged from current `init` (0 success; 1 for refusal/error; 130 on prompt cancel).

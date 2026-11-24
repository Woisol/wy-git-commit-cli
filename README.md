# @woisol/wy-git-commit

Formats My-Git-Commit messages and runs one commit command without staging or inspecting changes.

```sh
npx @woisol/wy-git-commit --type feat,docs --title "add CLI" --scope cli
wy-git-commit setup
wy-git-commit reset
```

`--type` and `--title` are required. Repeat `--type` or use a comma-separated list. Optional fields: `--scope`, `--body`, `--breaking` (migration instructions), `--harness`, `--ai-generated true|false`, and `--ai-review true|false`. Any AI option adds the marker; only supplied fields are recorded. `--ai-review` records whether meaningful human review occurred.

Unrecognized arguments are forwarded in order, including Git's own pathspec separator. For Git options that take a value resembling a CLI option, prefer `--git-option=value`. Do not pass `-m` or `--message`. Git output and exit status are inherited. The decorated heading may need a custom parser for release automation.

Configuration: `$XDG_CONFIG_HOME/wy-git-commit/config.yml` if set to an absolute path; otherwise `$HOME/.config/wy-git-commit/config.yml` (under the user's home directory). Run `reset` to write the full default configuration before customizing; it overwrites the existing file. Invalid configuration fails instead of silently falling back.

```yaml
commitCommand: [git, commit]
types:
  feat: "「 :sparkles: 新增 / feat 」"
  docs: "「 :pencil: 文档 / docs 」"
```

`commitCommand` is an executable followed by fixed arguments, not shell text. On Windows, use a native executable or run a script through its interpreter (for example, Node with a JavaScript file as a fixed argument). For a Git alias use `[git, your-alias]`. `setup` runs `npx skills add` for the standalone Skill and preserves its prompts. The Skill is tracked separately as the `skill/` submodule.

## Development

```sh
git submodule update --init
pnpm install --frozen-lockfile
pnpm test
pnpm pack
```

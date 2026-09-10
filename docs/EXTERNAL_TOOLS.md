# External AI Tools

Verified on 2026-09-10 before installation/configuration.

## Codex CLI

Official OpenAI documentation: https://learn.chatgpt.com/docs/codex/cli

Detected: `codex-cli 0.152.1`.
Authentication: present via ChatGPT.
Install scope: per-user/global CLI.

## Claude Code

Detected: `2.1.157 (Claude Code)`.
Authentication status command reported present, but actual non-interactive use failed with `401 OAuth access token has been revoked`.

Blocker: Yeriel must run `claude auth login` or the current Claude Code authentication repair flow, then verify with `claude -p "Say claude smoke ok"`.

## Claudex Loop

Repository: https://github.com/chaseai-yt/claudex-loop

Installed skills into both Codex and Claude global skill directories, and mirrored them into project `.agents/skills` and `.claude/skills`.

Installed skills:

- `claudex-loop`
- `claudex-route`
- `codex-build`
- `codex-review`

Prerequisites from README: both CLIs authenticated, Python 3.10+, Codex CLI current enough. Claude runtime is blocked until OAuth is repaired.

## Ponytail

Repository: https://github.com/DietrichGebert/ponytail

Installed skills into both Codex and Claude global skill directories, and mirrored them into project `.agents/skills` and `.claude/skills`.

Installed skills:

- `ponytail`
- `ponytail-review`
- `ponytail-audit`
- `ponytail-debt`
- `ponytail-gain`
- `ponytail-help`

Purpose here: anti-bloat scope check before implementation. It must not remove security, accessibility, validation, backups, tests, error handling, or historical data integrity.

## Graphify

Official docs: https://graphify.com/docs
Repository: https://github.com/Graphify-Labs/graphify

Detected package: `graphifyy 0.6.0` installed in Python site-packages.
Registered for Claude and Codex global skill directories via `graphify install` and `graphify install --platform codex`.
Registered project guidance/hooks via `graphify codex install` and `graphify claude install`.

Graph generation is not yet complete. CLI `graphify update docs` only rescans existing code graphs and reported no code files. Initial `/graphify .` should be run from a fresh assistant session after skills reload.

## OmniRoute

Repository inspected: https://github.com/ourines/omniroute
Package metadata in local clone: `omniroute 3.8.35`, Node engine `>=22.0.0 <23 || >=24.0.0 <27`.
Current npm install attempted `npm install -g omniroute`; npm selected `omniroute 3.8.50`, emitted peer/deprecation warnings, then hung without completing. The partial global package was removed with `npm uninstall -g omniroute`.

Status: not installed, not configured, not trusted for routing.

Policy: do not route M3 critical workflows through OmniRoute until it installs cleanly, starts cleanly, exposes logs, and proves no silent downgrade behavior.

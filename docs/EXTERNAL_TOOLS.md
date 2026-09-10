# External AI Tools

Verified on 2026-09-10 during infrastructure validation.

## Codex CLI

Official OpenAI documentation: https://learn.chatgpt.com/docs/codex/cli

Detected: `codex-cli 0.154.0`.
Authentication: present via ChatGPT.
Install scope: per-user/global CLI.

## Claude Code

Detected: `2.1.267 (Claude Code)`.
Authentication: `claude auth status` reported logged in through Claude first-party auth. A live `claude -p` cross-model test completed and wrote `docs/ai-runs/cross-model-test/01-claude-initial.md` and `03-claude-revision.md`.

## Claudex Loop

Repository: https://github.com/chaseai-yt/claudex-loop

Installed skills into both Codex and Claude global skill directories, and mirrored them into project `.agents/skills` and `.claude/skills`.

Installed skills:

- `claudex-loop`
- `claudex-route`
- `codex-build`
- `codex-review`

Prerequisites from README: both CLIs authenticated, Python 3.10+, Codex CLI current enough. The direct Claude -> Codex -> Claude -> Codex workflow has been proven with small documentation-review artifacts under `docs/ai-runs/cross-model-test/`.

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

Purpose here: anti-bloat scope check before implementation. It must not remove security, accessibility, validation, backups, tests, error handling, cross-model review for critical work, or historical data integrity.

## Graphify

Official docs: https://graphify.com/docs
Repository: https://github.com/Graphify-Labs/graphify

Detected package: `graphifyy 0.6.0` installed in Python site-packages.
Registered for Claude and Codex global skill directories via `graphify install` and `graphify install --platform codex`.
Registered project guidance/hooks via `graphify codex install` and `graphify claude install`.

Graph generation is complete for the current small repository. Outputs exist at `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html`.

## OmniRoute

Repository from current npm metadata: `https://github.com/diegosouzapw/OmniRoute.git`.
Current npm package: `omniroute 3.8.50`, Node engine `>=22.22.2 <23 || >=24.0.0 <27`.
Local runtime: Node `v24.14.1`, npm `11.2.0`.

Previous failure: `npm install -g omniroute` selected `3.8.50`, emitted peer/deprecation warnings, and hung before completion. The likely hang surface is the package lifecycle path: the package has a large dependency tree and a `postinstall` script. Do not blindly repeat the global install.

Current safe install: isolated per-user install completed with lifecycle scripts disabled:

```powershell
npm install --prefix C:\Users\yerie\.m3-tools\omniroute omniroute@3.8.50 --ignore-scripts
```

Verified commands:

- `C:\Users\yerie\.m3-tools\omniroute\node_modules\.bin\omniroute.cmd --help`
- `C:\Users\yerie\.m3-tools\omniroute\node_modules\.bin\omniroute.cmd --version` -> `3.8.50`
- `C:\Users\yerie\.m3-tools\omniroute\node_modules\.bin\omniroute.cmd doctor --no-liveness`
- `C:\Users\yerie\.m3-tools\omniroute\node_modules\.bin\omniroute.cmd serve --no-open --log --no-recovery`
- `C:\Users\yerie\.m3-tools\omniroute\node_modules\.bin\omniroute.cmd status --output json`
- `C:\Users\yerie\.m3-tools\omniroute\node_modules\.bin\omniroute.cmd simulate "cheap documentation cleanup" --explain`

Observed results:

- CLI responds.
- Server starts and initializes a local data directory at `C:\Users\yerie\.omniroute`.
- Doctor generated local secret material in `C:\Users\yerie\.omniroute\.env`; never print or commit it.
- Server warned that the default bind is `0.0.0.0` with no API-key requirement. Future tests should bind loopback or require an API key before any provider credentials are configured.
- Dry-run routing failed safely with `No matching combo found. Configure one with: omniroute combo create`.
- Claude and Codex profiles were not modified.

Status: CLI installed in an isolated per-user prefix and responding. Routing is not configured or trusted.

Policy: do not route M3 critical workflows through OmniRoute until it is hardened to loopback/API-key mode, provider auth is explicitly configured, fallback behavior is tested, logs are reviewed, and no silent downgrade behavior is proven.

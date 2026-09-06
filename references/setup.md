# Companion tools setup

The skill bundle root contains `SKILL.md`, `references/`, `tools/bin.mjs`, `package.json`, `package-lock.json` and `TOOLS.md`. Use those bundled tools, not an unrelated registry package named bricksmith. Resolve the tool root from the actual skill file; do not assume a machine-specific path.

Requirements: Node.js >=22.12, npm, Python 3 for safe library ZIP extraction, and an installed Chromium/Google Chrome for PNG rendering. In the bundle root run `npm ci --ignore-scripts`, then `node tools/bin.mjs help`. Dependencies may download once; model design uses the already-running host agent, not a second model/API client. The host's own plan/usage limits still apply.

Host instructions: [OpenClaw](openclaw.md) or [Astra through Codex](astra.md). Verify actual discovery rather than treating downloaded files as an activated skill. Publishing this repository does not change any host's model, authentication or global configuration.

Full library: run `node <tool-root>/tools/bin.mjs library status --library <library-root>`. If missing, `library install --library <new-library-root>` downloads the pinned official complete.zip (~145 MB compressed); read TOOLS.md for exact digest and limits. Use `--archive <local-zip> --sha256 <verified-digest>` for a trusted existing ZIP or `library index --library <extracted-root>` for existing extracted files. Reuse installed files offline. Never silently accept an upstream digest change or replace a library directory. Keep the cache outside committed source. Scene exports contain only their required licensed dependency subset.

Input/output arguments resolve relative to the caller; package resources resolve relative to the installed tools. Verify `library status` and `parts inspect` from an unrelated working directory before claiming the tools usable. Save model revisions in the task's output directory, not beside the skill's reusable instructions.

Rendering uses an already-installed browser. Report a missing browser and get approval before downloading one. The internal `tools/catalog-render/` HTML/JavaScript is a headless image-rendering resource, not a user-facing app. Its temporary loopback server and browser close in cleanup; no dev/preview server is required. Catalog queries, validation and export need no browser.

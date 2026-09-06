# Companion tools setup

Use the supplied Bricksmith v0.3.0 source archive or `bricksmith-0.3.0.tgz`, not an unverified package with the same registry name. Node >=22.12.0 is required. The package root contains tools/bin.mjs, package.json, package-lock.json and TOOLS.md. Python 3 is required only for safe library ZIP extraction.

For a source checkout, run `npm ci --ignore-scripts` in that package root. Dependencies may download from npm; normal tool commands make no model API calls. Invoke `node /absolute/tool-root/tools/bin.mjs help` from any cwd. Input/output arguments resolve relative to caller cwd. Confirm the companion package's files rather than assuming a machine-specific path.

A supplied npm tarball can be installed locally with `npm install --ignore-scripts /path/to/bricksmith-0.3.0.tgz`; use the project's node_modules/.bin/bricksmith. Installation and real-mesh rendering from an unrelated cwd have been tested. Package cache/artifacts/private portraits are excluded from distributions.

Full library: `node <tool-root>/tools/bin.mjs library status --library <library-root>`. If missing, `library install --library <new-library-root>` downloads and verifies the pinned official complete.zip; read TOOLS.md for archive digest and measured download size. Use `--archive <local-zip> --sha256 <verified-digest>` for trusted existing ZIPs; `library index --library <extracted-root>` indexes an existing directory. Reuse installed files offline. Never silently accept an upstream digest change. Installation preserves original headers/license files and never replaces an existing destination. The full cache is separate from the small tool package. Scene exports include only their dependency subset, not the entire catalog.

OpenClaw discovers workspace skills folders. Codex discovers .agents/skills in projects and ~/.agents/skills for user skills. Apply/install the approved skill through the host's supported workflow and check actual discovery; a pending proposal is not active. Global model/auth configuration is unrelated to the deterministic tools.

Rendering uses installed Playwright Chromium or Google Chrome; check current TOOLS.md for any browser override. Obtain permission before a browser installation. Renderers use temporary loopback servers and clean them up; don't restart a preview server the user stopped. Other operations need no browser. Verify `library status` and `parts inspect` from an unrelated cwd before declaring native tools usable. The old `catalog` command checks only the optional basic-brick engine.

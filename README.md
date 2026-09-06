# Bricksmith

**An agent skill for turning images or text into LEGO-style 3D models, using actual parts from the full official LDraw community library.**

The agent interprets the subject and authors the model. The bundled local helpers search parts, check scene geometry, render real meshes and export editable files. **There is no standalone web app, website, dashboard or persistent preview server.**

## Install and use

- **[OpenClaw instructions](references/openclaw.md)** — install the Git skill for your chosen agent, prepare the local tools, verify discovery and run a task.
- **[Astra instructions](references/astra.md)** — use GPT-6 Astra through Codex CLI, install in its skill directory and invoke `$bricksmith-models`.
- **[Shared prerequisites](references/setup.md)** — Node.js22.12+, npm, Python3 for library extraction and an installed Chromium/Google Chrome for PNG renders.

OpenClaw's Git installer entry point is:

```sh
openclaw skills install git:herval/bricksmith@main --agent YOUR_AGENT
```

Replace `YOUR_AGENT` with your actual agent ID and follow the linked host guide. Downloading this repository does not activate a skill, configure a model or change authentication by itself.

## What is here

- [`SKILL.md`](SKILL.md): the agent's complete design → inspect → revise → export workflow.
- [`references/`](references/): OpenClaw/Astra setup and native-scene guidance.
- [`tools/`](tools/): only the deterministic helpers needed by the skill.
- [`TOOLS.md`](TOOLS.md): exact CLI/API and file-format reference.
- [`examples/catalog/`](examples/catalog/): one reproducible full-catalog scene and its authoring source.
- [`tests/`](tests/) and [`scripts/`](scripts/): focused helper verification, not a browser application.

`tools/catalog-render/` contains internal HTML/JavaScript used by the headless PNG renderer. It opens a temporary local renderer and closes it afterward; it is **not** the removed web app. There are no `dev`, `preview` or application-build commands.

## Example request

> Use bricksmith-models to turn this car into a LEGO-style 3D model. Use real full-catalog parts, inspect it from several angles, and deliver PNG previews, an editable LDraw file and the parts inventory. Explain inferred surfaces and unverified physical connections.

Bricksmith uses the current host agent; it does not start another AI client or require a separate model API key. Your host's normal account, usage limits and billing still apply. Keep normal approval and sandbox policies in place.

## Outputs and limits

Outputs include six PNG views, `scene.json`, `model.ldr`, `inventory.csv`, a scoped validation report and the unchanged licensed dependency subset.

**This is a visual assembly workflow, not a certified physical kit.** Mechanical connections, collisions, stability, insertion paths and commercial part/color availability remain unverified. TEXMAP rendering and missing upstream dependencies fail explicitly rather than silently omit geometry. The full LDraw community archive is not LEGO's exhaustive saleable inventory.

Private reference images, generated user models, caches and dependency installs are excluded from this repository. See [third-party notices](THIRD_PARTY_NOTICES.md) for source attribution and licenses.

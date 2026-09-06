# Install and use with Astra

Here, **Astra means OpenAI GPT-6 Astra running in Codex CLI**. Astra is the host model, not a separate Bricksmith backend. The same skill also works in OpenClaw when that host is already configured to use Astra.

## 1. Install as a local Codex skill

Codex discovers user skills under `~/.agents/skills`. Keep the entire repository together so the skill can locate its supporting tools:

```sh
mkdir -p "$HOME/.agents/skills"
git clone https://github.com/herval/bricksmith.git "$HOME/.agents/skills/bricksmith-models"
cd "$HOME/.agents/skills/bricksmith-models"
npm ci --ignore-scripts
node tools/bin.mjs help
node tools/bin.mjs library install --library .cache/ldraw-official
```

If the destination exists, inspect it rather than overwrite it. Reuse an existing full library with `--library` instead of downloading another copy. For repository-scoped discovery, Codex also reads `<project>/.agents/skills`; the user-level installation above avoids placing this whole tool package into another project's Git tree. See [setup](setup.md) for browser requirements.

## 2. Select Astra in Codex

Use an installed Codex CLI and the host's normal sign-in flow. Choose **Sign in with ChatGPT** for subscription access rather than introducing an API key for Bricksmith. Account availability and usage limits still apply; this is not a claim that host inference is free. Do not paste credentials or authentication files into a prompt or repository.

From the directory where you want model outputs:

```sh
codex -m gpt-6-astra
```

The model must be available to the signed-in account and client. If it is unavailable, report that limitation; do not silently switch billing routes, models or global configuration.

## 3. Invoke and verify

In Codex, use `/skills` to verify `bricksmith-models` appears, or mention it explicitly with `$bricksmith-models`. If a newly installed skill is missing, restart Codex and check the discovery path.

Example prompt:

> $bricksmith-models Turn the attached gray car into a LEGO-style 3D model. Use the full LDraw library, inspect the actual meshes from several angles, and export the model, inventory and PNG previews. Explain any inferred geometry and unverified physical connections.

Attach the image through the host's normal image input. Codex CLI also documents the `--image`/`-i` option. Astra must be able to inspect images, run the local tools and write the chosen output directory. Keep the normal permission/sandbox policy; do not disable safeguards for this skill. If a required local operation is blocked, report it or use the host's normal approval path.

No standalone web app, persistent preview server or separate model API client is used. `tools/catalog-render/` is only an internal, temporary headless PNG renderer. Successful LDraw export does not certify physical buildability.

Sources (checked September 6, 2026): [OpenAI skill documentation](https://developers.openai.com/codex/skills/), [Astra model selection](https://developers.openai.com/codex/models/), [ChatGPT vs API authentication](https://developers.openai.com/codex/auth/). These official pages currently redirect to ChatGPT Learn. Model flag also checked with local `codex --help`. No paid Astra generation, login change or fresh Codex skill installation was performed during this repository cleanup.

# Install and use with OpenClaw

This is a local agent skill with supporting CLI tools, not a website or an MCP service. Review the repository before installing it. The commands below follow OpenClaw's Git-skill installer; select the agent that should receive it.

## 1. Install the skill

Replace `YOUR_AGENT` with your actual agent ID:

```sh
openclaw skills install git:herval/bricksmith@main --agent YOUR_AGENT
openclaw skills info bricksmith-models --agent YOUR_AGENT --json
```

A Git source must contain SKILL.md at its root; this repository does. The skill's frontmatter name is `bricksmith-models`. Respect existing install-policy prompts/blocks. If that skill already exists, inspect and back it up before deciding how to update; do not blindly overwrite it or change security settings. `openclaw skills update` is for ClawHub-tracked installs, not unmanaged Git installs.

## 2. Prepare its local tools

Use the actual installed skill directory reported by `skills info`, normally the selected workspace's `skills/bricksmith-models`. In that directory:

```sh
npm ci --ignore-scripts
node tools/bin.mjs help
node tools/bin.mjs library install --library .cache/ldraw-official
node tools/bin.mjs parts inspect --library .cache/ldraw-official --id 24309
```

The library install is a one-time pinned download. If the full library is already installed, use its path with `--library` and check `library status` instead. A local browser is needed only for renders; see [setup](setup.md).

## 3. Verify discovery and use it

```sh
openclaw skills check --agent YOUR_AGENT
openclaw skills list --agent YOUR_AGENT
```

Confirm `bricksmith-models` is eligible. An agent allowlist, missing tools or a stale session snapshot can prevent selection; inspect the reported reason and start a new task after installing. Do not replace other agents' settings merely to make this skill visible.

Send the selected agent a prompt such as:

> Use bricksmith-models to turn the attached car into a LEGO-style 3D model. Use actual full-catalog parts, inspect the renders, and deliver a preview plus LDraw and parts inventory. State inferred surfaces and physical-build limitations.

The agent needs image inspection, local file access, command execution and attachment delivery. A text-only host without those capabilities cannot complete the workflow. Shell/browser execution must happen where the installed tools, library and outputs are accessible. Do not send private images to a separate model service to compensate silently.

No Bricksmith web server or separate AI API key is required. The current host supplies the model; its own account/billing still applies. This document does not change host authentication or install the skill automatically.

Sources (checked September 6, 2026): [OpenClaw skills CLI](https://docs.openclaw.ai/cli/skills), [skill loading](https://docs.openclaw.ai/tools/skills). Installer syntax also checked against local OpenClaw2026.9.1 `skills install --help`. Installation into a fresh host was not performed as part of this repository cleanup.

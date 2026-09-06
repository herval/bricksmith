# Agent-native tools: verified delivery

## Package and command surface

- Runtime entry: `tools/bin.mjs` (npm binary `bricksmith`).
- ESM library: `tools/index.mjs`, exported as package `bricksmith`.
- Implementation: `tools/design.ts`, `tools/cli.ts`, `tools/render.ts`, `tools/render/`.
- Schemas: `tools/schema/design.schema.json`, `tools/schema/plan.schema.json`.
- Technical API/CLI/install contract: `TOOLS.md`.
- npm bundle: `artifacts/agent/bricksmith-0.2.0.tgz`; source-and-proof archive: `bricksmith-tools-0.2.0.zip`.
- No SKILL.md or skill proposal was created. Skill authoring is a separate parent task.

Exact source-checkout commands (installed binary has the same arguments):

```sh
node tools/bin.mjs schema
node tools/bin.mjs catalog
node tools/bin.mjs compile --design examples/agent/penguin.design.json --out artifacts/agent/penguin
node tools/bin.mjs validate --plan artifacts/agent/penguin/plan.json --design examples/agent/penguin.design.json --out artifacts/agent/penguin/recheck.json
node tools/bin.mjs render --plan artifacts/agent/penguin/plan.json --out artifacts/agent/penguin/views
node tools/bin.mjs export --plan artifacts/agent/penguin/plan.json --design examples/agent/penguin.design.json --out artifacts/agent/penguin/export
```

The binary also ran from an unrelated working directory. The npm tarball was installed into an isolated local directory with `npm install --offline --ignore-scripts --no-audit --no-fund`, and its installed binary/library were exercised, including PNG rendering. Runtime files contain no machine-specific paths or required credentials.

## Actual penguin development roundtrip

This was a **text-authored host-agent design**, not an image-conditioned reconstruction. The source was written as ellipsoids/boxes/paint operations and subsequently repaired with explicit CSG and additional lower geometry. The host inspected actual generated front/isometric/back views, then front/isometric/top/right views after repair.

| Stage | Parts | Colored target cells | Unsupported | Connected groups | Fidelity |
| --- | ---: | ---: | ---: | ---: | --- |
| First compiler, `penguin-v1` | 313 | 1,860 | 26 | 27 | Exact |
| Improved seam/support-aware packing, `penguin-repacked` | 292 | 1,860 | 7 | 1 | Exact |
| Explicit source repair, `penguin` | 321 | 2,084 | 0 | 1 | Exact |

The packing improvement changed only part partitioning, not occupied cells or colors. The host's explicit design revision widened/notched the feet and added black lower-body/flipper-root geometry. This is a visible shape change retained in `penguin.design.json`, not an undocumented compiler support rule. The final model has **zero body collisions** and **15 partial-support warnings**. Limited geometric checks pass, but it is not strength-tested or physically certified.

Sources:
- `examples/agent/penguin-v1.design.json`
- `examples/agent/penguin.design.json`

Evidence:
- `artifacts/agent/penguin-v1/` — initial report/plan/six views.
- `artifacts/agent/penguin-repacked/` — identical-target repacking report/plan.
- `artifacts/agent/penguin/plan.json`, `report.json`, `recheck.json`.
- `artifacts/agent/penguin/views/{front,back,left,right,top,iso}.png` plus camera/request audit.
- `artifacts/agent/penguin/export/{plan.json,report.json,model.ldr,inventory.csv,instructions.html}`.

## Different object / honest failure case

`examples/agent/rover.design.json` combines four ellipsoid tire sculptures, chassis, subtracted cargo well, blue deck, cylinder mast, and stereo-camera-like head. The host inspected front, isometric and top PNGs. The 120-piece, 1,064-cell model preserves exact voxel colors and forms one connected group, but **9 chassis pieces have no lower contact** in the conservative bottom-up assembly model. Compile/export therefore exit **3**. Its six views and complete exports are retained under `artifacts/agent/rover/`; no hidden ground columns were added to force a pass. Tires are static brick geometry, not mechanical wheels.

The technical README's third, small pedestal example was also compiled: 41 pieces, 556 cells, no collisions, unsupported pieces or partial-support warnings, one group. Source: `examples/agent/pedestal.design.json`.

## Verification

- `npm test`: **65 passing tests**: original 42 retained, 23 additional checks including two official-part LDraw parses for novel objects.
- `npm run build`: passes TypeScript checking and Vite build. Existing large-bundle advisory remains a warning, not a build failure.
- `npm run test:browser`: **19 passing legacy UI checks**, including offline operation, image modes, import/export, instructions/PDF, mobile layout, and WebGL fallback; no unexpected browser errors or external requests.
- `npm run test:tool-render`: **9 passing checks** for unrelated-cwd compile, six real PNGs with dimensions/camera metadata, distinct views, no browser errors/external requests, and matching JSON/LDraw/CSV/instruction IDs.
- New coverage includes CSG semantics, explicit floating voxels, random-grid exact coverage, strict schema/type/unknown-key failures, malformed/oversized JSON, clipping rejection, lowered and hard budgets, depth/node limits, deterministic supported catalog packing, actionable per-piece defects, collision/issue-list truncation, exit codes 2/3 and atomic compilation failure.
- LDraw uses the existing tested transforms; independent Three.js LDrawLoader parsing against the cached official part library verifies the new penguin and rover geometry extents and construction steps.
- Both existing localhost and Tailscale preview listeners retained their original process IDs. Both returned HTTP 200 and loaded the new 321-piece custom plan into the actual WebGL viewer. Proof: `artifacts/agent/preview-preservation.json`.

Logs and machine reports live under `artifacts/agent/`. No Codex login, nested agent call, AI API, paid generation, global configuration change, public deployment, or preview-process replacement was used.

## Limits

See `TOOLS.md` for all hard caps and exact grid semantics. Hidden geometry is inferred by the host, never established by these tools. Validated fidelity is to voxel sampling, not continuous surfaces or an unseen photo. Upright rectangular parts only; no stock/color availability check, insertion-path solver, clutch mechanics, torque/load analysis, functioning wheel/axle assembly, or physical guarantee. The renderer is the actual local Three.js body/stud viewer, not an official-part CAD renderer. Unsupported upper-hung pieces remain conservatively flagged rather than being silently accepted.

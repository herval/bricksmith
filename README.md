# Bricksmith

**An agent skill and local toolchain for turning image/text briefs into LEGO-style 3D models.** The host agent interprets the subject and authors the design; Bricksmith searches real LDraw parts, validates scene geometry, renders the actual meshes, and exports editable files. No separate paid model API is needed by the tools.

![Full-catalog shuttle example](docs/full-catalog-shuttle.png)

## Start here

- **[SKILL.md](SKILL.md)** — the portable agent procedure, with its bundled [references](references/).
- **[TOOLS.md](TOOLS.md)** — exact installation, CLI, schemas and API.
- **[Full-catalog evidence](FULL-CATALOG-EVIDENCE.md)** — scope and verification of the native-part engine.
- **[Native example](examples/catalog/shuttle.scene.json)** and [deterministic authoring source](examples/catalog/author-shuttle.mjs).

### Install the companion tools

```sh
git clone https://github.com/herval/bricksmith.git
cd bricksmith
npm ci --ignore-scripts
node tools/bin.mjs help
```

Requires Node.js 22.12+, Python 3 for safe library extraction, and an already-installed Chromium/Google Chrome for PNG rendering. The browser is not downloaded automatically.

The repository root is the skill bundle: `SKILL.md`, `references/`, and companion tool files live together. Install or link that folder through your agent host's supported skill workflow; see [setup](references/setup.md). Publishing the files to GitHub does not activate them in a running host session.

### Native full-catalog example

```sh
# One-time download of the pinned official LDraw community library (~145 MB).
node tools/bin.mjs library install --library .cache/ldraw-official
node tools/bin.mjs parts search --library .cache/ldraw-official --query curved --category Slope --limit 10
node tools/bin.mjs scene validate --library .cache/ldraw-official --scene examples/catalog/shuttle.scene.json
node tools/bin.mjs scene render --library .cache/ldraw-official --scene examples/catalog/shuttle.scene.json --out artifacts/shuttle-views --size 1100
node tools/bin.mjs scene export --library .cache/ldraw-official --scene examples/catalog/shuttle.scene.json --out artifacts/shuttle-export
```

Use new output directories for each render/export. An existing full library can be reused offline. Native scene exports include LDraw, JSON, CSV and the original licensed dependency subset; **they do not include physically validated building instructions**. Mechanical connections, collisions, structural strength and part/color availability remain unverified.

Personal photos/models, host workspace files, downloaded caches, dependency installs and generated build artifacts are intentionally excluded. The small official LDraw test fixtures retain their author/license notices; see [third-party notices](THIRD_PARTY_NOTICES.md). Verification documents record historical local test runs; their referenced generated artifacts are not bundled here.

---

## Agent-native full-catalog CLI/library (v0.3.0)

**Normal design workflow:** search and inspect the complete official LDraw community library, author native-LDU part placements with arbitrary rigid rotations, render actual meshes in six views, and export LDraw/CSV plus licensed dependency files. The new workflow is not limited to the legacy 14 rectangular parts. The complete fetched archive has 24,735 main file entries plus subparts/primitives; aliases, patterns and assemblies are not unique purchasable-part counts.

See **[TOOLS.md](TOOLS.md)** for exact `library`, `parts`, and `scene` commands, installation, native coordinates, safety caps and the library API; **[FULL-CATALOG-EVIDENCE.md](FULL-CATALOG-EVIDENCE.md)** for measured tests and the curved/wedge/round-engine shuttle. Host-authored examples live in `examples/catalog/`. No AI client, nested agent, credentials or paid inference is needed. Only explicit `library install` may download the official archive; warmed commands run locally/offline. No preview service is needed.

**Mesh availability is not physical verification.** Arbitrary-part scenes explicitly leave connection, collision, structural and part/color availability checks unverified. Missing upstream dependencies and unsupported TEXMAP renders fail rather than silently omit geometry. Instructions are generated only from an explicit host order. The older voxel compiler remains available with its original 14-rectangle subset and limited grid-based checker; sources are under `examples/agent/`.

The rest of this README describes the **preserved legacy browser UI**, whose text presets and image heightmaps are not the agent-native designer.

A runnable, local-first image/text-to-bricks workshop. **It generates real brick placements, not a concept mockup.** No model APIs, keys, accounts, purchases, telemetry, public deployment, or backend are required. The application runs entirely in the browser after its static assets load.

## Run locally

Use a modern Node.js installation (Node 22.12+ recommended; verified here with Node **26.7.0**, npm **11.19.0**).

```sh
cd bricksmith
npm ci --no-fund --no-audit
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/** on the **same computer**. Preview binds only to loopback, uses a strict port, and serves `dist/`. It is **not publicly reachable**, is not accessible from another phone/computer, and is not a production hosting service. Stop the foreground server with Ctrl-C. If port 4173 is in use, inspect the existing listener rather than killing an unrelated process; an alternative is `npm run preview -- --port 4174`.

For development:

```sh
npm run dev -- --port 5173 --strictPort
# http://127.0.0.1:5173/
```

The dependency installation needs network access once. The built app makes no external requests. After page assets are loaded, generation and export continue offline; this is **not** an installable service-worker/PWA, so a fresh offline load is not promised. Work is kept in memory only: **export JSON before reloading** to retain a plan.

## What works

- **Interactive 3D**: Three.js instanced studded bodies, orbit/pan/zoom, fit/top view, optional rotation, exploded layers, brick picking. Actual per-brick model geometry drives the viewer, inventory, diagnostics and exports. Home resets the camera, +/− zoom. Standard controls support mouse/touch. If WebGL is unavailable, the app retains assembly maps and data exports with a visible warning.
- **Text → procedural 3D**: cottage/house/cabin, tower, pyramid. Deliberately limited grammar; unsupported requests and details fail clearly instead of pretending to run AI. A demo cottage loads immediately.
- **Image → quantized mosaic / brightness relief**: PNG/JPEG/WebP read locally, aspect preserved, resampled to a maximum 8–40-stud longest side; transparent pixels are composited over white. Nearest palette color uses weighted linear-light RGB distance (not Lab/DeltaE). Relief uses brightness as height: light = high. Backing plates are included in piece budgets and inventory.
- **Controls**: 8–40-stud base/longest image dimension, 3–20 procedural body courses or 3–8 relief color plates, classic/earth/monochrome palettes, 20–5,000-piece cap. Insufficient budgets reject the entire new design and preserve the previous model. No silent truncation.
- **Custom JSON import/export**: validated local file or pasted plan; useful for human/agent-authored designs without API credentials. Import does not silently “repair” geometry; use the checks tab.
- **Assembly**: cumulative actual 3D steps, top-down numbered maps and per-step parts. Steps group by bottom elevation, ascending. Exported HTML has every exact placement and can be printed or saved to PDF.
- **Exports**: `.ldr` standard type-1 part references + `0 STEP`; `.csv` inventory; `.json` editable plan; self-contained printable `.html`; current-view `.png`. All data exports contain the **full** plan, regardless of the visible step. PNG intentionally captures the current camera and step.

### Prompt grammar

Examples:

```text
a tan cottage with a red roof
a blue house size 20 height 6
small tall tower
a gray tower 20 studs wide 7 courses tall
a tan pyramid
```

Supported body colors: black, blue, green, red, yellow, white, tan, orange, brown, gray/grey. Cottages alone support a second color followed by `roof`. `small` → 12 studs, `large` → 24, `short` → 4 courses, `tall` → 12. Explicit dimensions in prompts override sliders; the controls are updated to show the interpreted values. A selected palette remaps colors to its nearest supported color.

The cottage and tower are **solid display sculptures**, not hollow interiors. Windows/doors are contrasting ordinary solid bricks, not actual openings, glass, doors or specialist elements. The cottage roof and base are additional to body height. This prototype does **not** generate arbitrary objects, accept natural-language instructions outside this grammar, or reconstruct full 3D objects from photographs.

## JSON plan format

```json
{
  "version": 1,
  "name": "Two-piece starter",
  "source": "custom",
  "description": "A brick with one smaller brick on top.",
  "bricks": [
    {"id":"base","part":"3001","color":4,"x":0,"y":0,"z":0,"rotation":0},
    {"id":"top","part":"3003","color":14,"x":1,"y":3,"z":0,"rotation":0}
  ]
}
```

- `version`: exactly `1`.
- `name`: 1–100 characters, nonblank, no control characters; `description`: string ≤1,000 characters.
- `source`: `custom`, `procedural`, `mosaic` or `relief` (metadata, not proof of provenance).
- `bricks`: 1–5,000 items; current UI piece budget also applies. Files/pasted text limited to 2 MB.
- `id`: unique 1–64 characters, letters/numbers/`-`/`_`.
- `part`: one of the strings in the catalog below; `color`: one of the numeric LDraw color codes below.
- `x,z`: integer minimum footprint grid boundary, −128…128, in studs. On an instruction map, x goes right, z goes down; the coordinate is the **top-left** boundary on that map.
- `y`: integer bottom elevation, 0…128, in **plate units**, increasing upward.
- `rotation`: `0` or `90` degrees about the vertical axis. Rotation swaps footprint width/depth; bricks remain upright. Dimensions derive from the part ID, never free-form mesh scaling.
- Extra JSON fields are discarded by validation. HTML in names/descriptions is safely treated as text. Unsupported parts/colors/poses/fractional grid positions are rejected. Geometric overlap/floating is accepted for inspection and visibly diagnosed.

### Supported common parts

The **native LDraw X axis is the long dimension** for these references, verified using official part polygons and their recursive subparts/primitives.

| LDraw ID | Name | Footprint x × z (studs) | Height (plates) |
|---|---|---:|---:|
| 3001 | Brick 2 × 4 | 4 × 2 | 3 |
| 3002 | Brick 2 × 3 | 3 × 2 | 3 |
| 3003 | Brick 2 × 2 | 2 × 2 | 3 |
| 3010 | Brick 1 × 4 | 4 × 1 | 3 |
| 3622 | Brick 1 × 3 | 3 × 1 | 3 |
| 3004 | Brick 1 × 2 | 2 × 1 | 3 |
| 3005 | Brick 1 × 1 | 1 × 1 | 3 |
| 3020 | Plate 2 × 4 | 4 × 2 | 1 |
| 3021 | Plate 2 × 3 | 3 × 2 | 1 |
| 3022 | Plate 2 × 2 | 2 × 2 | 1 |
| 3710 | Plate 1 × 4 | 4 × 1 | 1 |
| 3623 | Plate 1 × 3 | 3 × 1 | 1 |
| 3023 | Plate 1 × 2 | 2 × 1 | 1 |
| 3024 | Plate 1 × 1 | 1 × 1 | 1 |

Colors: `0` black, `1` blue, `2` green, `4` red, `14` yellow, `15` white, `19` tan, `25` orange, `70` reddish brown, `71` light bluish gray, `72` dark bluish gray, `288` dark green. These are **LDraw IDs**, not BrickLink/Rebrickable color IDs or LEGO element SKUs. RGB values match the cached official LDConfig. No specific part/color combination is asserted to exist in current inventory or to be in stock.

## LDraw correctness

Reference: [official file-format specification](https://www.ldraw.org/article/218.html), [official parts library](https://library.ldraw.org/), [3001 part geometry](https://library.ldraw.org/library/official/parts/3001.dat), [3020 plate geometry](https://library.ldraw.org/library/official/parts/3020.dat).

- 20 LDraw units per stud; 8 per plate; 24 per brick. Nominal 1 LDU ≈ 0.4 mm; real dimensions are approximate.
- LDraw is right-handed with **−Y upward**. These part origins are centered at the **body’s top face** (studs extend to local y = −4; body extends downward to y = 8 or 24).
- Internal plan coordinates locate the footprint minimum and body bottom. After rotation produces footprint `(w,d)` and body height `h`, translation is:
  - `X = (x + w/2) × 20`
  - `Y = −(y + h) × 8`
  - `Z = −(z + d/2) × 20`
- 0° matrix: `1 0 0 / 0 1 0 / 0 0 1`.
- 90° matrix: `0 0 1 / 0 1 0 / -1 0 0` (determinant +1; no mirror/scale).
- `.ldr` is UTF-8 without BOM, CRLF-terminated, and has step delimiters after each nonempty elevation group.
- Internal coordinates and the browser use +Y up with x right / z down in the top map. Conversion to LDraw rotates this frame 180° around X: both y and z change sign. This preserves handedness and image/map orientation. It uses simplified rounded brick bodies/studs, **not full molded underside meshes**, and slight visual seams.
- A regular `.ldr` references part files; it is **not** a self-contained MPD. Open it in an LDraw-compatible application with its standard parts library installed. Official fixture files are only used for local tests, never downloaded by the running app.

`tests/ldraw.test.ts` independently walks real official vertices and checks every part/orientation. It also packages the exported cottage with the official fixtures in memory and loads it through **Three.js LDrawLoader**, checking bounds, height, and step count. This is a meaningful format/geometry integration test, **not** a claim that a physical model was built or that every third-party CAD application was manually tested.

## Diagnostics and limitations

Occupied integer cells detect body intersections. A graph connects two parts only when a lower part’s top matches an upper part’s bottom with at least one shared stud-grid cell. Ground parts need no lower contact. “Partial support” means some, not all, footprint cells have such contact. Connected groups use that contact graph; merely touching side faces does not connect parts.

**Not physically verified:** no stud clutch/anti-stud mesh collision, tolerances, material behavior, center of gravity, load, torque, cantilever strength, lateral forces, assembly accessibility, color availability, sourcing, cost or stock checks. Full footprint contact is not a strength certification. A geometrically connected build may be weak. Generated models use greedy packing and alternating orientations/edge strips, not optimal part counts or guaranteed mechanical interlock. Some unusual aspect ratios/custom designs can have separate groups; inspect diagnostics.

Safety limits cap reported collision pairs at 1,000 and contact edges at 20,000; if reached, the UI/notebook explicitly marks diagnostics and connected-group counts incomplete. Summary ID lists show at most 40 entries and 20 groups. Colliding custom pieces can visually overlap; nothing is silently fixed. Budgets count parts, not money. A large rejected generation is computed before the budget check; accepted plans cap at 5,000 pieces. Images cap at 20 MB and 40 megapixels after decoding.

No general photo → full 3D, arbitrary text → geometry, hollow optimization, hinges, SNOT/sideways building, curved/sloped specialist parts, multi-material physics, editing bricks in the viewer, persistent storage, undo history, or shopping checkout. JSON is the editing/agent integration path.

## Architecture

- `src/model.ts`: catalog, palette, plan schema, strict validation, bounds/inventory, spatial diagnostics, LDraw/CSV/JSON serialization. Pure TypeScript.
- `src/generate.ts`: explicit prompt grammar; deterministic procedural voxel layers; greedy rectangular packing; color quantization and image heightmap conversion.
- `src/viewer.ts`: Three.js + OrbitControls; instanced rounded bodies and studs, lighting, camera fitting/picking, cumulative/exploded assembly.
- `src/instructions.ts`: safe standalone HTML notebook and numbered SVG layer maps.
- `src/main.ts`: accessible DOM controls, local file handling, application state, downloads and UI. No server state or API calls.
- `src/style.css`: responsive desktop/mobile workshop UI; local system fonts, no CDN assets.
- `docs/ldraw/`: 43 unmodified official part/subpart/primitive fixtures and URL manifest.
- `tests/`: engine/validation/geometry/exports tests, plus independent LDraw parsing.
- `scripts/samples.ts`: reproducible five-model sample pack and a tiny PNG image fixture.
- `scripts/browser-smoke.mjs`: real headless Chromium end-to-end tests, screenshots, downloads and PDF.

Dependencies are pinned in `package-lock.json`. This build uses Three.js 0.185.1, Vite 8.2.2, TypeScript 7.0.2 and Playwright 1.63.0. Build output is approximately 598 KB JS (155 KB gzip) plus 16 KB CSS; Vite may issue its **non-failing 500 KB bundle-size warning** because Three.js is bundled, not remotely loaded.

Implementation references: [Three.js InstancedMesh source](https://github.com/mrdoob/three.js/blob/r185/src/objects/InstancedMesh.js), [OrbitControls source](https://github.com/mrdoob/three.js/blob/r185/examples/jsm/controls/OrbitControls.js), [LDrawLoader source](https://github.com/mrdoob/three.js/blob/r185/examples/jsm/loaders/LDrawLoader.js), [Vite local build/preview guide](https://vite.dev/guide/static-deploy.html), [Playwright screenshots](https://playwright.dev/docs/screenshots). Also see `THIRD_PARTY_NOTICES.md` for fixture attribution.

## Verification commands

```sh
npm test             # engine, validation, part geometry, external LDraw parser
npm run samples      # writes samples/* deterministically (except no time-based model content)
npm run build        # TypeScript checking + static bundle
npm run preview      # keep running in a separate terminal on 127.0.0.1:4173
npm run test:browser  # end-to-end UI, files, PDF, desktop/mobile screenshots
```

Browser tests prefer the installed Google Chrome executable on macOS. Otherwise they use Playwright’s Chromium. If neither is installed:

```sh
PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" npm run test:browser
```

This optional browser install downloads free browser binaries. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/absolute/path/to/chromium` for another installed executable, or `BRICKSMITH_URL=http://127.0.0.1:4174` to test an alternate local preview port. Browser tests intentionally deny all external page requests and also generate a model with the network set offline. Headless runs use software WebGL for reproducibility. Chrome may log a deliberately triggered WebGL error in the fallback test; unexpected errors fail the run.

The optional maintainer command `node scripts/fetch-ldraw-fixtures.mjs` refreshes official fixture files and their source manifest. Normal builds and tests use the cached fixtures and require **no** LDraw-network access.

### Delivered artifacts

- `samples/cottage.{ldr,csv,json,html}` — 213 pieces / 16 steps.
- `samples/tower.*` — 165 pieces / 11 steps.
- `samples/pyramid.*` — 170 pieces / 10 steps.
- `samples/landscape-mosaic.*` — 182 pieces / 3 steps.
- `samples/landscape-relief.*` — 332 pieces / 7 steps.
- `samples/source-landscape.png` — real image upload fixture, 24 × 16 pixels.
- `samples/summary.json` — reproducible counts and diagnostics.
- `artifacts/desktop.png`, `cottage-viewer.png`, `mobile.png`, `image-mosaic.png`, `image-relief.png` — actual browser screenshots.
- `artifacts/cottage-instructions.pdf` — browser-printed assembly notebook.
- `artifacts/downloads/*` — files actually downloaded through app UI during smoke tests.
- `artifacts/browser-report.json` — exact end-to-end check names, browser version and outcome.
- `artifacts/test.log`, `artifacts/build.log`, `artifacts/browser.log` — verification logs.
- `dist/` — built static application.

Independent prototype, not affiliated with or endorsed by the LEGO Group. LEGO is a trademark of the LEGO Group. Part IDs identify documented reference geometry, not availability or certified compatibility of purchased third-party products.

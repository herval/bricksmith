# Bricksmith agent-native tools · v0.3.0

**Normal new design workflow: search the full official LDraw library, inspect actual geometry, author a native scene, render and revise it, then export.** The old 14-rectangle voxel compiler remains a separate optional workflow. Its catalog is NOT the limit on native scenes. No hosted AI, paid API, nested agent, login or generation credits are used.

## Full catalog: install once, use locally

Requirements: Node >=22.12, package dependencies, **Python 3 only for safe ZIP extraction**, and a local Playwright Chromium or Google Chrome for rendering. Nothing downloads a browser automatically. `library install` is the only command with intentional external network access. Use `--archive` or `--library` to operate with existing local resources.

```sh
npm ci --ignore-scripts
node tools/bin.mjs help
node tools/bin.mjs library install --library .cache/ldraw-official
# Or use an already-downloaded full official archive:
node tools/bin.mjs library install --library .cache/ldraw-official --archive /path/to/complete.zip --sha256 d2a695868ed2b3957c45b022a6451908edab22cc043179dd61d18dd382b35e11
# Or index an existing extracted directory containing parts/, p/, LDConfig.ldr:
node tools/bin.mjs library index --library /path/to/ldraw
node tools/bin.mjs library status --library .cache/ldraw-official
node tools/bin.mjs library audit --library .cache/ldraw-official --out audit.json
```

Default location without `--library`: `~/.cache/bricksmith/ldraw-official`. Inputs/outputs resolve relative to the caller, while package resources resolve relative to the installed package; an absolute CLI path works from an unrelated directory. No services/global configuration are installed. Installed library reuse is offline. Existing destinations are never replaced by `install`; use a new directory for another release. Re-index explicitly after intentional source changes.

The sole built-in download is `https://library.ldraw.org/library/updates/complete.zip`. Its current **official community library release 2026-08** is pinned by `tools/catalog/official-library.lock.json`; the default online installer verifies that digest and fails if the upstream moving archive changes. Supply an explicit new `--sha256` when intentionally selecting a new release, or an independently trusted local archive. Pinning is integrity/reproducibility, not a claim of cryptographic publisher authentication. Per-file hashes and an aggregate tree digest are stored in `.bricksmith-index.json`; selected files are rehashed when read. Original file bytes, headers, README and license texts are kept intact. No BrickLink Studio library is used.

Measured archive: **145,316,175 bytes compressed; 547,822,041 bytes expanded**, before index/filesystem overhead. **37,099 files**, of which 36,807 are `.dat`: 24,735 main files, 9,235 subparts, 2,835 primitives and 2 sample-model definitions. Main files include 497 aliases, 1,160 moved entries, 5,193 shortcuts/assemblies and 8,589 names marked with “Pattern”; those descriptive categories overlap. **Do not add them or call all files unique purchasable LEGO parts.** The complete official LDraw community archive is not the complete LEGO-company inventory. There are 138 texture images and all 322 LDConfig definitions. Its color configuration has its own revision `2026-05-29`, distinct from the library's maximum official part-header update `2026-08`.

Safety limits: ZIP <=512 MB, <=100,000 entries, <=2 GB expanded, <=64 MB/file, <=1000:1 expansion ratio. The complete central directory is validated before writing: rejects traversal, absolute paths, backslashes, drive prefixes, duplicate/case-colliding names, encrypted entries, symlinks and special files. Expansion is byte-counted and CRC checked by Python's ZIP reader; extraction occurs in a unique temporary directory and is renamed only after successful indexing. Existing local libraries reject descendant symlinks/special files, duplicate normalized paths and oversized files. Tools never execute archive programs.

## Search and inspect actual parts

```sh
node tools/bin.mjs parts search --library .cache/ldraw-official --category Slope --query curved --limit 30 --offset 0
node tools/bin.mjs parts search --library .cache/ldraw-official --category Wing --limit 30 --offset 30
node tools/bin.mjs parts inspect --library .cache/ldraw-official --id 24309
node tools/bin.mjs parts inspect --library .cache/ldraw-official --id 6233.dat
node tools/bin.mjs parts colors --library .cache/ldraw-official
```

Search matches all query terms case-insensitively across ID/name/category/keywords; category is an exact case-insensitive filter. It returns `total`, `offset`, `limit`, `nextOffset`, stable ordered results and provenance. Default `--kind main`; `all`, `subpart`, `primitive`, `other` support dependency exploration. Page size 1–200. Main `.dat` IDs can include official suffixes for variants/aliases/patterns. Paths are not valid placement IDs.

Inspect returns official title/category/author/license/header, recursive dependencies, triangle and line counts and **bounds computed from actual recursively transformed polygon vertices in LDU**, including real studs, slopes, curves and wedges. It does not invent a rectangular `w/d/h`. Exact source bytes are checked against the index. AABB extent alone is not a collision or connection model.

## Native LDraw scene contract

```sh
node tools/bin.mjs scene schema
node tools/bin.mjs scene validate --library .cache/ldraw-official --scene examples/catalog/shuttle.scene.json --out /tmp/shuttle-check.json
node tools/bin.mjs scene render --library .cache/ldraw-official --scene examples/catalog/shuttle.scene.json --out /tmp/shuttle-new-views --size 1100
node tools/bin.mjs scene export --library .cache/ldraw-official --scene examples/catalog/shuttle.scene.json --out /tmp/shuttle-new-export
```

`render` and `export` require **new output directories**, preserving previous revisions. `validate --out` atomically writes/replaces a report but rejects direct input overlap. JSON stdout, no progress banners; errors are `{ok:false,error:{code,message,details},exitCode}`. Exit 2 is invalid input/catalog/dependency/unsupported capability/budget; exit 4 is runtime/filesystem/browser launch failure. The library-wide `audit` exits 3 on missing definitions. A successful scene check means its stated syntax/reference/geometry scope passed, NOT structural validity.

```json
{
  "schema": "bricksmith.scene.v1",
  "name": "Curved nose and rotated engine",
  "units": "LDU",
  "parts": [
    {"id":"nose","part":"43712","color":15,"position":[0,0,0],"rotation":[1,0,0,0,1,0,0,0,1]},
    {"id":"engine","part":"6233","color":72,"position":[0,-24,100],"rotation":[1,0,0,0,0,-1,0,1,0]}
  ]
}
```

- **Native LDraw right-handed coordinates, -Y up.** One stud pitch is 20 LDU, a plate 8 LDU, a brick 24 LDU. Approximate physical conversion 0.4 mm/LDU. Positions use each real part's own documented origin, not its box minimum. The shuttle's +Z is aft; front camera looks from -Z. Camera metadata includes position/target/up; top view keeps the nose upward and is not an x-right plan diagram.
- `rotation`: row-major 3×3, exactly the `a b c d e f g h i` entries exported on LDraw type-1 lines. Runtime enforces orthonormality and determinant +1 to 1e-6; no reflection, scaling or shear. Arbitrary real rotations, fractional offsets and any indexed main ID are supported—not just 0/90° grid rotations. Part-internal transforms retain their original full LDraw matrices.
- Colors use the full LDConfig code table, not the old 12-color list. Scene placements must choose explicit colors, not inherited 16/edge24. This is not proof a part exists commercially in that color. Material transparency/finish definitions are retained.
- Unknown properties, duplicate placement IDs, unknown parts/colors, invalid matrices, unsafe references and mismatched optional `libraryDigest` fail. Canonical exported scenes pin the current library tree digest.
- Scene <=4 MB/5,000 parts; position magnitude <=100,000 LDU. Dependency traversal <=64 levels/10,000 files/128 MB selected source. Individual polygon cache <=6M coordinates; per-inspect traversal <=30M coordinates; whole scene <=5M triangles/15M polygon vertices. Resource-limit failures are explicit. Not every conceivable enormous official assembly fits these budgets.
- `assemblyOrder` is optional and must list every placement ID exactly once. Only a host-supplied order produces `STEP` lines and `assembly-order.json`; no sorted mesh order is presented as building instructions.

## True-mesh rendering, errors and physical limitations

Renderer uses pinned **Three.js LDrawLoader**, not the legacy body/stud proxies. It resolves and checks the dependency closure first, constructs an in-memory MPD with normalized references, sets `setPartsLibraryPath` and `setFileMap`, preloads the complete LDConfig, and caches geometry/materials through the loader. Full official polygon meshes (studs, slope/curved surfaces, wedges, holes, round engines) and ordinary/conditional lines are rendered. BFC and conditional-line behavior is delegated to the loader, not independently certified. Studio lighting, material finishes and transparency sorting remain visual approximations.

Six real PNGs: `front`, `back`, `left`, `right`, `top`, `iso`. `render.json` records camera transforms, mesh triangle counts/bounds, scene/PNG hashes, source pin, browser version, requests, errors and warnings. Mesh bounds must agree with the independent polygon walker within 0.1 LDU. Empty geometry, missing dependencies, browser errors, non-200 responses or external browser requests fail. Shader ReadPixels performance warnings may occur and are recorded separately.

The renderer builds into a unique temporary folder, launches a **short-lived 127.0.0.1 server on OS-assigned port 0**, blocks external browser traffic, and closes browser/server/removes that temporary build in `finally`. It does not start or restart :4173, Tailscale preview, or any persistent service.

**Explicit current limits:** TEXMAP parts/textures are indexed and preserved for export, but the Three path does not implement TEXMAP; selections with TEXMAP return `UNSUPPORTED_TEXMAP`, never an untextured “successful” render. The exact downloaded complete archive has four missing type-1 dependency filenames referenced by `2374b`, `5241`, `6218741g`; these selections return `DEPENDENCY_MISSING`. See the full audit in `FULL-CATALOG-EVIDENCE.md`. No unofficial files or invented substitute geometry were silently inserted.

**Physical checking remains incomplete:** every scene report/export says `structuralValidity`, `connectionValidity` and `collisionValidity` are **unverified**. No rectangular support checker is reused for arbitrary parts. Legal clutch/SNOT connections, collision-free assembly, insertion paths, strength, cantilevers, torque, stock and part/color availability are not solved. Visually touching meshes or successful renders do not establish buildability. No automatic hidden supports or generated physical instructions.

## Portable scene export and library API

Export writes `scene.json`, `model.ldr`, `inventory.csv`, `report.json`, `README.md`, `library-manifest.json` and `ldraw/` containing this scene's **unmodified dependency subset**, LDConfig and original license/readme documents. Manifest records each source path/hash/byte count; per-part author/license headers are intact. The subset is not falsely advertised as the whole library. Use `model.ldr` with that LDraw library root in a standard viewer, or your installed full official library. The `.ldr` keeps exact real IDs, colors, native translations and matrices. No instructions HTML is produced.

```js
import {Library,parseScene,validateScene,renderScene,exportScene} from 'bricksmith';
const lib = new Library('/absolute/path/to/ldraw');
const results = lib.search({category:'Slope',query:'curved',limit:20});
const part = lib.inspect('24309');
const scene = parseScene(hostAuthoredObject, lib);
const report = validateScene(scene, lib); // scope limited; structuralValidity === 'unverified'
await renderScene(scene, lib, '/tmp/new-views', 900);
exportScene(scene, lib, '/tmp/new-export');
```

Re-author the included deterministic, host-composed example with `node examples/catalog/author-shuttle.mjs --library DIR --out NEW_DIR`. This is the transparent source for one example, not a prompt/preset designer or automated connection solver. See `FULL-CATALOG-EVIDENCE.md` for measured tests, render inspection, old/new comparison, outputs and package verification. Full cache/artifacts/private user models are outside the npm `files` allowlist.

---

# Legacy rectangular voxel tools (retained in v0.3.0)

A local deterministic tool package for a shell-capable multimodal host such as OpenClaw or Codex. **The current host agent is the designer.** It can interpret text or inspect a reference image, infer hidden geometry, and author the JSON input. This package does not call another model, start Codex, ask for API credentials, or charge for inference. It accepts genuinely new 3D objects, not a family/preset name. The legacy UI is separate and remains available.

The compiler samples constructive-solid geometry and explicit voxel edits, packs catalog parts, and returns a brick plan. The renderer produces six actual PNG views. Validation reports defects for the host to inspect and repair through explicit source edits. The tools themselves do not interpret a photograph and do not insert hidden supports. A single photo cannot establish unseen geometry or physical dimensions.

## Installation and entry points

Node.js >=22.12.0. Dependencies are specified in `package.json`; the source archive also has `package-lock.json`. Source checkout/archive:

```sh
npm ci --ignore-scripts
node tools/bin.mjs help
npm run cli -- catalog
```

Use `node /path/to/bricksmith/tools/bin.mjs ...` from any working directory; no `cd` into the package is required. Input and output arguments resolve relative to the caller's cwd. Only package resources resolve relative to the installation. For pure JSON stdout, use the binary or `node tools/bin.mjs`, not npm's banner-producing script wrapper.

The npm tarball can instead be installed into a local project:

```sh
npm install --ignore-scripts /path/to/bricksmith-0.3.0.tgz
./node_modules/.bin/bricksmith catalog
```

No global install or configuration is necessary. Installation may download npm dependencies on a new machine. **These legacy commands themselves make no remote API calls.** A machine with the dependencies and browser installed can run offline. `compile`, `validate`, `schema`, `catalog`, and `export` do not start a browser.

### PNG rendering dependency

`render` uses the local Three.js viewer, Vite build API, and Playwright. It tries already-installed Playwright Chromium, then installed Google Chrome. Alternatively, supply `--browser /path/to/chromium`. The executable path is a caller-supplied option, not hard-coded in the tool. If no browser is present, the command fails with `BROWSER_UNAVAILABLE`; it never downloads one automatically. A user can explicitly install one with `npx playwright install chromium` during setup. That download requires network access; normal rendering does not.

Rendering uses a short-lived loopback server on an OS-assigned port and a separate temporary build directory. It does not use, rebuild, restart, or replace the existing UI preview server or `dist`. Browser requests outside that ephemeral origin are blocked and recorded as failures. Temporary files and the server are cleaned up in `finally`.

## Exact CLI contract

Every command prints one JSON object on stdout. Errors also use JSON: `{ "ok": false, "error": { "code", "message", "path", "details" }, "exitCode" }`. Unknown/duplicate flags and missing values fail, rather than being silently ignored.

```sh
bricksmith help
bricksmith schema                       # complete design JSON Schema
bricksmith schema --kind plan           # complete brick-plan JSON Schema
bricksmith catalog                      # 14 parts, 12 colors, axes, hard caps
bricksmith compile --design penguin.design.json --out build/penguin
bricksmith validate --plan build/penguin/plan.json --design penguin.design.json --out build/penguin/recheck.json
bricksmith render --plan build/penguin/plan.json --out build/penguin/views --size 900
bricksmith export --plan build/penguin/plan.json --design penguin.design.json --out build/penguin/export
```

Replace `bricksmith` with `node tools/bin.mjs` when using the source checkout. `--design` is optional for `validate` and `export`; omit it only when target-geometry comparison is not needed. All other flags shown above are required except `render --size` (default 900), `render --browser`, `schema --kind`, and `validate --out`.

| Code | Meaning |
| --- | --- |
| 0 | Command completed. For compile/validate/export, report contains no **errors**, but warnings may remain. Render success does not certify structural validity. |
| 2 | Bad JSON/schema/arguments or a resource budget failure. No partial compiled plan is emitted on a compilation failure. |
| 3 | Structural or target-fidelity errors. Compile still writes the exact plan plus report so it can be inspected; export also writes artifacts with a failing report. |
| 4 | Filesystem, browser, or runtime dependency failure. |
| 5 | Internal packing/fidelity invariant failure. |

Do not treat exit 3 as missing output. Read the returned paths and report. Structural errors do not prevent rendering. Outputs use stable names and may replace previous outputs; use a new revision directory when preserving history. Individual JSON/text writes are atomic renames, but a multi-file export is not a transaction; I/O failure can leave a subset. Do not use an input directory as the output directory. Direct input/output filename overlap is rejected.

### Output files

- `compile`: `plan.json`, `report.json`; stdout includes piece count, summary, and fidelity.
- `validate`: complete report on stdout, optionally a copy at `--out`.
- `render`: `front.png`, `back.png`, `left.png`, `right.png`, `top.png`, `iso.png`, `render.json` with camera transforms, browser version and request/error audit.
- `export`: `plan.json`, `report.json`, `model.ldr`, `inventory.csv`, `instructions.html`.
- The HTML notebook is self-contained, contains every placement and per-elevation top-view SVG, and has a browser Print/Save as PDF button. It is not itself a PDF or a collision-free insertion-path planner.
- `.ldr` references standard LDraw parts; consumers need their own standard library. Official cached part fixtures included here support tests. PNGs approximate body/stud meshes; they are not renders of those official LDraw meshes.

## Legacy input representation

`tools/schema/design.schema.json` is the portable JSON Schema. Runtime validation additionally enforces relational/aggregate constraints such as bounds containment, duplicate voxel positions, total nodes, depth and estimated work. Unknown fields are rejected. Neither JavaScript nor expressions nor module paths are accepted as geometry.

- Coordinates are always `[x, y, z]`.
- `x/z`: integer **stud-grid boundaries**; 1 stud = nominal 8 mm.
- `y`: integer **plate-grid boundaries**, increasing upward; 1 plate = nominal 3.2 mm; a brick is 3 plates tall.
- Thus one y unit has 0.4 times the physical size of one x/z unit. A `[4,10,4]` box is a physical cube.
- Primitive coordinates can be fractional; voxel/part coordinates are integers. Sampling is at `(x+0.5, y+0.5, z+0.5)`. Boxes and cylinder axial intervals are lower-inclusive, upper-exclusive; ellipsoid/radial membership uses `<=`.
- Grid z increases toward the **back**. `front.png` looks from negative z toward positive z. In this right-handed camera convention x increases to the left on the front image; camera transforms are recorded, and a front image must not be used as an x-right plan map. Instruction SVG maps have x right and z down.
- `bounds.min` and `bounds.size` define the sampling lattice, not a scale-to-fit command. Additive primitive/CSG envelopes outside bounds cause `CLIPPED_SHAPE`; there is no implicit crop. Deliberate clipping must be expressed with `intersection`. Envelope checks are conservative and can reject some mathematically contained CSGs; explicit bounding intersections resolve that.

### Small complete geometry example

This non-preset object is a hollow instrument pedestal with a cylindrical cap; the full penguin and rover sources are under `examples/agent/`.

```json
{
  "schema": "bricksmith.design.v1",
  "name": "Instrument pedestal",
  "description": "An explicit solid with a recessed upper well.",
  "bounds": { "min": [-4, 0, -4], "size": [8, 15, 8] },
  "shapes": [
    { "op": "add", "color": 71,
      "shape": { "type": "box", "min": [-4, 0, -4], "size": [8, 3, 8] } },
    { "op": "add", "color": 1,
      "shape": { "type": "cylinder", "center": [0, 9, 0], "radius": 3, "height": 12, "axis": "y" } },
    { "op": "subtract",
      "shape": { "type": "box", "min": [-1, 10, -1], "size": [2, 5, 2] } }
  ],
  "packing": { "mode": "mixed", "maxPieces": 500 }
}
```

Primitive types:

- `box`: `min`, positive `size`.
- `ellipsoid`: `center`, positive `radii` per grid axis. For physically round objects, account for y's plate scale.
- `cylinder`: `center`, `radius`, `height`, `axis: "x"|"y"|"z"`. Radius is in the two transverse **grid** coordinates. A y-axis cylinder is circular in stud space; x/z-axis cylinders are physically anisotropic because of plate units. Use ellipsoids or explicit voxels for scaled transverse profiles.
- `union`, `intersection`, `difference`: `children` containing 2–32 shapes. Difference means first child minus the union of all later children. Nesting provides CSG; no preset dispatch.

Each entry in `shapes` is processed in order:

- `add` creates/recolors occupied cells inside its shape, using its catalog `color`.
- `subtract` deletes matching cells and must not have a color.
- `paint` changes only already-occupied matching cells; it cannot create matter. Paint/subtract may extend outside bounds because they do not add geometry.
- Optional `voxels: [{"at":[x,y,z],"color":14}, {"at":[x,y,z],"color":null}]` runs **last**. A number adds/recolors one cell; null deletes one. Duplicate override coordinates fail. `shapes: []` with explicit voxels is supported. A completely empty result fails.

`packing.mode` is `mixed` (default) or `plates`. `mixed` uses height-3 courses when three complete successive color slices match, otherwise height-1 courses so edge plates can bridge into the body. Eight deterministic mirrored/offset packings per course reuse the tested rectangular packer; scoring prefers lower stud contacts, bridging distinct lower pieces, fewer pieces, and alternating seam preferences. It is bounded greedy search, not a global optimum or a promise of stable seams. Lower layers are not automatically repacked after subsequent courses. Every selected part is in the supported catalog.

The compiled `plan.json` is the existing UI-compatible v1 format with `source: "custom"`, `bricks` with stable IDs, LDraw part/color, integer `x/y/z`, and `rotation: 0|90`. Coordinates are the body's minimum grid boundary, never its center. Compiled plan fidelity is checked against the **color-valued sampled voxel target**, not merely a bounding box or silhouette.

## Legacy validation and budgets

Report issues contain `code`, `severity`, `pieceIds`, `message`, `action`, and optional positional details. Codes include `COLLISION`, `UNSUPPORTED`, `PARTIAL_SUPPORT`, `DISCONNECTED`, `NO_GROUND_PATH`, `DIAGNOSTICS_TRUNCATED`, `ISSUES_TRUNCATED`, and `FIDELITY`. The largest stud-connected component is the primary component; other components get actionable ID groups. Side-touching is not a connection. A piece with only an upper attachment is conservatively marked unsupported for this bottom-up assembly order; the checker does not invent an alternate subassembly order.

Fidelity fields include missing, extra, wrong-color and overlapping voxel counts plus up to 20 positional examples. Inventory is grouped by standard part and color. Validation does not mutate the plan. No support-generation flag is provided: a base, brace, axle-like block, or support column must be explicitly added to the design by the host, with its resulting geometry visible in the next render and source diff.

Hard caps (caller can lower, not raise, applicable limits):

| Resource | Cap |
| --- | --- |
| Input JSON | 4,000,000 bytes, regular file |
| Grid volume | 262,144 cells; x/z extent <=64, y extent <=128 |
| Coordinate extent | min x/z -128, min y 0; upper bounds <=129; part starts <=128 |
| Shape operations | 64 |
| Total CSG nodes / nesting | 128 / 16 |
| Conservative node × sampling-volume work | 24,000,000 |
| Explicit voxel overrides | 100,000 |
| Parts | 5,000; lower via `packing.maxPieces` |
| Occupied voxels / evaluation work | lower via `limits.maxVoxels` / `limits.maxEvaluations` |
| Diagnostic collision pairs / contacts | 1,000 / 20,000; hitting the limit fails with truncation, never a green result |
| Report issues | 12,000; explicit `ISSUES_TRUNCATED` failure if exceeded |
| PNG side | 256–1,600 pixels; exactly six views |
| Generated HTML | 32 MB |

## Legacy library API

The package's ESM entry initializes its included TypeScript runtime. No AI client is involved:

```js
import {compile, validate, voxelize, parseDesign, parsePlan, catalog, CAPS} from 'bricksmith';
const {plan, report} = compile(designObject);
const verification = validate(plan, designObject);
const {cells} = voxelize(designObject); // Map<"x,y,z", LDraw color>
```

For the source tree, import `./tools/index.mjs`. Public TS types are in `tools/design.ts`. `compile` returns structurally invalid plans with a failing report; it throws `ToolError` for invalid inputs/budgets or internal fidelity failures. No command shells out to another agent.

## Legacy verification artifacts and limitations

`npm test` runs the previous engine/LDraw suite and the new tools tests. `npm run build` retains the UI TypeScript/build check. `npm run test:browser` tests the existing localhost preview; it does not start that preview. `npm run test:tool-render` runs a separate loopback PNG/export smoke check.

The development output under `artifacts/agent/` records the actual text-authored penguin source-to-plan-to-six-PNG-to-inspection-to-explicit-repair-to-export run. Original and repaired design sources are retained. The repaired penguin is 321 pieces and 2,084 exact occupied/color voxels, one connected component, no body collisions and no unsupported pieces; **15 partial-support warnings remain**. This is a limited geometric pass, not a physical certificate.

A second, different rover design demonstrates an ellipsoid-tire/chassis/cargo-well/cylinder-mast composition. Its rendered/exported draft retains **9 unsupported chassis pieces** and exits 3; no hidden ground columns were inserted to force it green. Neither example was conditioned on an inspected source photograph. Render inspection establishes visible shape only.

The legacy voxel compiler/checker models no slopes, hinges, wheels/axles, SNOT connections, illegal offsets, non-upright parts, hollow-brick clutch mechanics, friction, load/torque analysis, stock/part-color availability, insertion path guarantee, or global packing optimization. The new native scene workflow above permits arbitrary actual part meshes and rotations, but does NOT extend that physical checker. A supported/connected report is not a guarantee that a real model can be safely assembled or will hold together.

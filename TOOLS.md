# Bricksmith agent-native tools · v0.3.1

**Search the full official LDraw library, inspect actual geometry, author a native scene, render and revise it, then export.** This package contains the skill and its native-scene helpers only. No standalone browser app or legacy voxel compiler is included. The tools make no model API calls; the current host agent supplies the design and its normal usage limits still apply.

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
- Colors use the full LDConfig code table. Scene placements must choose explicit colors, not inherited 16/edge24. This is not proof a part exists commercially in that color. Material transparency/finish definitions are retained.
- Unknown properties, duplicate placement IDs, unknown parts/colors, invalid matrices, unsafe references and mismatched optional `libraryDigest` fail. Canonical exported scenes pin the current library tree digest.
- Scene <=4 MB/5,000 parts; position magnitude <=100,000 LDU. Dependency traversal <=64 levels/10,000 files/128 MB selected source. Individual polygon cache <=6M coordinates; per-inspect traversal <=30M coordinates; whole scene <=5M triangles/15M polygon vertices. Resource-limit failures are explicit. Not every conceivable enormous official assembly fits these budgets.
- `assemblyOrder` is optional and must list every placement ID exactly once. Only a host-supplied order produces `STEP` lines and `assembly-order.json`; no sorted mesh order is presented as building instructions.

## True-mesh rendering, errors and physical limitations

Renderer uses pinned **Three.js LDrawLoader** and the actual official part geometry. It resolves and checks the dependency closure first, constructs an in-memory MPD with normalized references, sets `setPartsLibraryPath` and `setFileMap`, preloads the complete LDConfig, and caches geometry/materials through the loader. Full official polygon meshes (studs, slope/curved surfaces, wedges, holes, round engines) and ordinary/conditional lines are rendered. BFC and conditional-line behavior is delegated to the loader, not independently certified. Studio lighting, material finishes and transparency sorting remain visual approximations.

Six real PNGs: `front`, `back`, `left`, `right`, `top`, `iso`. `render.json` records camera transforms, mesh triangle counts/bounds, scene/PNG hashes, source pin, browser version, requests, errors and warnings. Mesh bounds must agree with the independent polygon walker within 0.1 LDU. Empty geometry, missing dependencies, browser errors, non-200 responses or external browser requests fail. Shader ReadPixels performance warnings may occur and are recorded separately.

The renderer builds into a unique temporary folder, launches a **short-lived 127.0.0.1 server on OS-assigned port 0**, blocks external browser traffic, and closes browser/server/removes that temporary build in `finally`. It does not start or restart :4173, Tailscale preview, or any persistent service.

**Explicit current limits:** TEXMAP parts/textures are indexed and preserved for export, but the Three path does not implement TEXMAP; selections with TEXMAP return `UNSUPPORTED_TEXMAP`, never an untextured “successful” render. The exact downloaded complete archive has four missing type-1 dependency filenames referenced by `2374b`, `5241`, `6218741g`; these selections return `DEPENDENCY_MISSING`. The official-library integration tests assert these explicit failures. No unofficial files or invented substitute geometry were silently inserted.

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

Re-author the included deterministic, host-composed example with `node examples/catalog/author-shuttle.mjs --library DIR --out NEW_DIR`. This is the transparent source for one example, not a prompt/preset designer or automated connection solver. Run `npm test` for the focused native helper checks. Tests against the full official library require an indexed library at `.cache/ldraw-official` or the path in `BRICKSMITH_LIBRARY`; they are explicitly skipped if it is absent. Full cache/artifacts/private user models are outside the npm `files` allowlist.

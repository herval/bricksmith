# Full-catalog implementation evidence — Bricksmith 0.3.0

Implemented and tested locally on **2026-09-06**. No AI API calls, paid image/video generation, login, GitHub publication, services, global configuration or skill-file edits. Existing port 4173 previews were left stopped. Files remain under this checkout; the full library/cache and user artifacts are excluded from the npm package.

## Working implementation, not an index-only integration

- `tools/catalog/library.mjs`: bounded official-library install/index, complete metadata and color table, deterministic pagination, integrity checks, full dependency resolution/audit, actual transformed-polygon geometry inspection.
- `tools/catalog/safe-extract.py`: central-directory preflight, bounded extraction, no links/traversal/duplicates/encryption, CRC validation; no external extractor package.
- `tools/catalog/scene.mjs`: native-LDU scene parser, row-major proper rotations, reference/color/pin checks, actual-geometry bounds, exact LDraw transforms and inventory, licensed source subset export. No physical checker misrepresentation.
- `tools/catalog/render.mjs` + `tools/catalog-render/`: actual Three LDrawLoader meshes, complete LDConfig, ordinary/conditional lines, recursive in-memory MPD, browser/HTTP error audit, six PNGs, independent polygon-versus-loader bounds check, strict temporary loopback lifecycle.
- `tools/bin.mjs`: new `library`, `parts`, `scene` namespaces without breaking legacy compile/validate/render/export. `tools/index.mjs` exports the new library API and TypeScript declarations.
- `tools/schema/scene.schema.json`: portable schema. `TOOLS.md`: exact command contract, caps, coordinates, setup and limits.

## Exact fetched library measurements

Source: `https://library.ldraw.org/library/updates/complete.zip`.

- Archive SHA-256: `d2a695868ed2b3957c45b022a6451908edab22cc043179dd61d18dd382b35e11`
- Archive bytes: **145,316,175**; expanded source bytes: **547,822,041**.
- Normalized path/content tree SHA-256: `420a5e61759391a217bc5d22cb3867f2275f8efa5ef5fec11b1e97b86991a666`.
- Release **2026-08**, derived from maximum official `!LDRAW_ORG UPDATE` among fetched `.dat` headers. LDConfig is independently dated **2026-05-29**, not a library release identifier.
- **37,099 files / 36,807 `.dat` definitions**: 24,735 main entries, 9,235 subparts, 2,835 primitives, 2 sample-model definitions.
- Main-entry metadata includes 497 aliases, 1,160 moved entries, 5,193 shortcuts and 8,589 descriptions containing “Pattern”. These overlap and are not a count of unique purchasable parts.
- **322 LDConfig color definitions**, including complete original meta directives; 138 texture images. Placements require explicit non-inherited colors.
- Cache path: `.cache/ldraw-official`. Source archive retained as `.cache/complete.zip`. Index occupies 24,548,158 bytes at time of measurement; filesystem allocation differs from logical file bytes.

The full archive was downloaded, not just specialty parts. An initial slow download was preserved and resumed with HTTP Range; no repeated full downloads or per-part HTTP fetching. Index/source headers/license texts are retained. The small fixtures in `docs/ldraw` are NOT the runtime catalog. LDraw is a community model library, not complete LEGO-company inventory.

## Whole-library audit: genuine upstream omissions, not hidden failures

`artifacts/catalog/library-audit.json` verifies all **37,099 source hashes**, scans **436,005 type-1 references**, and finds no malformed type-1 matrices or dependency cycles. It reports **seven failing reference lines involving four absent filenames in three direct parent files**:

- `parts/2374b.dat` → `s/2374bs01.dat` (four transformed references).
- `parts/5241.dat` → `s/5241s01.dat`.
- `parts/6218741g.dat` → `logo-ford-mustang.dat`, `logo-ford-mustang-outerbox.dat`.

These missing filenames were also checked against the original ZIP central directory. The entire archive was installed unchanged. `library audit` deliberately returns `ok:false`/exit 3 for these source defects; `parts inspect` and scenes using those definitions throw `DEPENDENCY_MISSING`. Tests assert this explicit failure. No made-up geometry, unlicensed substitute or silent missing-part render is used. Other models depending on these files will fail transitively too.

TEXMAP files and image dependencies are indexed and retained for export. Three.js's current loader does not support TEXMAP, so selected TEXMAP scenes fail with `UNSUPPORTED_TEXMAP` before browser creation. Source polygon/fallback inspection/export is separate from texture-capable rendering. This is not a claim of 100% format/render conformance for every catalog entry. Explicit geometry budgets can also reject huge assemblies.

## Regression and mesh tests

Logs and JSON evidence under `artifacts/catalog/`:

- `tests.log`: **91/91 passing**, zero skipped in this checkout: original 65 + 21 synthetic catalog/security/CLI tests + 5 full-official-library geometry tests. On machines without an installed full catalog, those five official tests explicitly skip; point `BRICKSMITH_LIBRARY` to the indexed full root to run them.
- `build.log`: TypeScript `--noEmit` + Vite build succeeds; existing UI remains intact.
- `browser-tests.log`: **19/19 existing browser smoke checks**, run through `scripts/browser-ephemeral.mjs`; :4173 never started. The wrapper uses a temporary build/server and isolates its artifacts under `artifacts/catalog/legacy-browser`.
- `legacy-render-tests.log`: **9/9 legacy tool-render/export smoke checks**.
- `catalog-render-tests.log` + `catalog-render-smoke.json`: **14/14 catalog CLI/browser checks**: actual slope/wedge/rotated engine meshes, six checksum-verified PNGs, explicit limited validation, exact exported references, no invented STEP/instructions, unchanged licensed source bytes, invalid-transform rejection, no external browser requests and confirmation the ephemeral server is closed.
- `selected-parts-inspection.json`, `nose-parts-inspection.json`, `catalog-lookups.json`: actual lookup and mesh inspection used to select parts. No part's rectangular grid dimensions are substituted for its mesh.

Security/regression tests cover unknown IDs/colors/properties, unsafe paths, duplicate IDs, bad rotations including scale/shear/reflection, digest changes, missing files, cycles, TEXMAP handling, descendant symlinks, malicious ZIP traversal/symlink/case collisions/expansion bombs, offline warmed-cache CLI use and unrelated cwd. Independent Three.js Node parsing checks actual polygon bounds under cross-axis part rotations.

## Catalog-rich shuttle — visual assembly prototype

`examples/catalog/author-shuttle.mjs` is transparent deterministic source authored by the host. The checked-in `examples/catalog/shuttle.scene.json` is its canonical final scene. It is not an automatic prompt-to-model or connection solver.

Final files:

- `artifacts/catalog/shuttle/final/scene.json`, `part-inspection.json`, `report.json`.
- `artifacts/catalog/shuttle/final/views/{iso,front,back,left,right,top}.png` and `render.json`.
- `artifacts/catalog/shuttle/final/export/`: native scene, `model.ldr`, real part/color `inventory.csv`, scope-limited report, README, per-file library manifest, original dependency/license files.

**124 placements, 23 distinct real main IDs, 150,012 rendered triangles, 124 mesh objects.** Cross-axis curved-part rotations and aft-facing engine transforms are explicit in the scene (consult the scene rather than assuming a grid orientation). Six PNGs are **1100 × 1100**, with **zero page/console errors, zero missing dependencies and zero external browser requests**. All three HTTP requests (page, JS bundle, LDConfig) returned 200. Four SwiftShader ReadPixels performance warnings are recorded, not hidden as model errors. Mesh/polygon bounds agree to 0.1 LDU.

Specialized pieces include genuine Wing `30355/30356`, smaller Wing `3544/3545`, curved Slope `24309/15068`, upper/inverted curved Wedge `43712/43713`, tapered Wedge `43710/43711`, Slope `3037`, thin swept Shuttle Tail `6239`, and round Cone `6233/3942c` plus Round Brick `3941`. The result is one composed shuttle, not a separated parts display.

I inspected **all six final PNGs**, and the earlier `artifacts/agent/space-shuttle-hd/final/views/iso.png` and `back.png`. The new design has continuous curved fuselage shoulders/nose, real diagonal wing boundaries, a genuinely thin swept tail and circular three-engine geometry replacing the former stepped rectangular surfaces and square exhausts. V1 and the refinement are preserved. The revised cockpit roof hides the old black slope studs, and shorter root wings avoid extending almost to the nose.

**Known visual/mechanical limits:** the cockpit/nose joins have small exposed gaps/overhangs; engine necks/OMS housings and nose-cap placement are visual composition, not mechanically solved connections. Engine bells visibly retain the actual LEGO part's internal tubes. It is stylized, not a scale replica. No claim of collision-free/buildable/structurally sound construction. Reports mark structural, connection, collision, part-color stock and assembly validity unverified. There is no inferred assembly order or physical instructions.

## Portable package verification

The tools npm `files` allowlist contains implementation, schemas, documentation, harmless example sources and tests—not `.cache`, `artifacts`, node_modules or user portraits/private models. Packages and reproducibility-check outputs are under `artifacts/catalog/packages/`; `package-verification.json` records actual tarball file audit, independent local install, unrelated-cwd CLI/API execution and true-mesh rendering using the warmed full library. No global npm install, Git commit or GitHub push is needed.

The shuttle ZIP includes the final scene, original source authoring script, all six views, real LDraw/CSV export, source/license evidence and the small tools tarball. Its `ldraw/` is the **153-file scene dependency/config/license subset**, not the full library. Per-part headers remain unchanged. The full cache is intentionally excluded. `artifacts/catalog/delivery-manifest.json` records final sizes and SHA-256s.

## Reproduce

```sh
node tools/bin.mjs library install --library .cache/ldraw-official --archive .cache/complete.zip --sha256 d2a695868ed2b3957c45b022a6451908edab22cc043179dd61d18dd382b35e11
node tools/bin.mjs parts search --library .cache/ldraw-official --category Slope --query curved --limit 30
node tools/bin.mjs parts inspect --library .cache/ldraw-official --id 24309
node examples/catalog/author-shuttle.mjs --library .cache/ldraw-official --out /tmp/new-shuttle-source
node tools/bin.mjs scene validate --library .cache/ldraw-official --scene /tmp/new-shuttle-source/scene.json
node tools/bin.mjs scene render --library .cache/ldraw-official --scene /tmp/new-shuttle-source/scene.json --out /tmp/new-shuttle-views --size 1100
node tools/bin.mjs scene export --library .cache/ldraw-official --scene /tmp/new-shuttle-source/scene.json --out /tmp/new-shuttle-export
npm test
npm run build
npm run test:browser:ephemeral
npm run test:tool-render
npm run test:catalog-render
```

Primary specifications consulted: official archive/update index, `https://www.ldraw.org/article/218.html` (LDU/type-1 transforms), `https://threejs.org/docs/pages/LDrawLoader.html`, and the pinned installed Three.js loader source. Original fetched headers and ZIP contents—not website marketing counts—supply the measurements above.

# Native full-catalog scene reference

Run every command as `node <tool-root>/tools/bin.mjs <command>`. Read installed TOOLS.md for exact budgets and error contracts.

- `library status --library DIR`: provenance, digest, separate main/subpart/primitive/alias counts and colors.
- `parts search --library DIR --category Slope --query curved --limit 30 --offset 0`: paginated real IDs and metadata. Follow nextOffset; category is exact case-insensitive. Default kind is main; subpart/primitive/all are for dependency exploration.
- `parts inspect --library DIR --id 6233`: actual recursively transformed polygon bounds, headers and dependencies. Inspect rather than infer part origins from catalog names.
- `parts colors --library DIR`: complete LDConfig table, not proof of commercial color availability.
- `scene schema`, `scene validate --library DIR --scene FILE`, `scene render --library DIR --scene FILE --out NEW_DIR --size 1100`, `scene export --library DIR --scene FILE --out NEW_DIR`.

Minimal native scene:
```json
{"schema":"bricksmith.scene.v1","name":"Curved nose and rotated engine","units":"LDU","parts":[{"id":"nose","part":"43712","color":15,"position":[0,0,0],"rotation":[1,0,0,0,1,0,0,0,1]},{"id":"engine","part":"6233","color":72,"position":[0,-24,100],"rotation":[1,0,0,0,0,-1,0,1,0]}]}
```

Native LDraw is right-handed, -Y up, 20LDU per stud, 8LDU per plate, 24LDU per brick; ~0.4mm/LDU. Use each part's actual origin. Rotation is row-major a b c d e f g h i, orthonormal determinant +1; no reflection/scale/shear. Part-internal matrices remain original. Positions permit fractional values. This differs from the legacy positive-Y plate grid.

Any indexed main ID may be placed, including patterns/variants; descendants resolve from the installed library. Keep explicit colors (not inherited16/edge24). Optional libraryDigest pins source geometry; preserve exported pin. Unknown IDs/colors/properties, malformed transforms, missing files and unsafe paths fail. Render/export require new output directories. Optional assemblyOrder must be an intentionally authored exact list of all placement IDs; otherwise no steps/instructions are invented.

True-mesh rendering checks dependencies and renderer errors. Current unsupported TEXMAP is an explicit error even though source textures are indexed/exportable. Missing upstream dependencies fail rather than being substituted. Large assemblies may exceed bounded geometry budgets. Inspect render.json and actual views.

A successful native scene report validates references, source integrity, colors, rigid transforms, dependency closure and polygon bounds. Structural, collision, connection and commercial-stock validity stay unverified. Never equate this with the legacy voxel check or a physical build. Exported ldraw/ is an unchanged licensed dependency subset with hashes; retain per-author notices. Part counts include aliases/patterns/assemblies, so full community catalog is not complete LEGO-company inventory.

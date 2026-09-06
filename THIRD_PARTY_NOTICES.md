# Third-party notices

## LDraw test/reference data

`docs/3001-reference.dat`, `docs/LDConfig-reference.ldr`, and `docs/ldraw/` contain reference material from the official LDraw library. They are not used as runtime meshes. The 43 `.dat` part/subpart/primitive files in `docs/ldraw/` are unmodified; individual author, history and license statements remain in each file. The exact original URL for each cached file and its retrieval timestamp are in `docs/ldraw/manifest.json`.

- Source library: https://library.ldraw.org/library/official/
- Color configuration source: https://library.ldraw.org/library/official/LDConfig.ldr
- File format: https://www.ldraw.org/article/218.html
- Library licensing information: https://www.ldraw.org/article/349.html
- Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/

The cached part files declare **CC BY 4.0** and retain their authors’ names, including James Jessiman and other LDraw contributors. Consult each file header for specific attribution; this notice supplements rather than replaces those notices. No endorsement by LDraw.org or any contributor is implied. RGB values/code names are transcribed from the official LDConfig reference. The color configuration and original 3001 reference from the interrupted build were preserved.

## JavaScript dependencies

Three.js and its addons: MIT, https://github.com/mrdoob/three.js .
Vite: MIT, https://github.com/vitejs/vite .
TypeScript: Apache-2.0, https://github.com/microsoft/TypeScript .
Playwright: Apache-2.0, https://github.com/microsoft/playwright .
Other pinned dependencies and their individual license notices are included with their packages in `node_modules/` after `npm ci`; this is not a relicensing of those packages.

## Trademarks

LEGO is a trademark of the LEGO Group. Bricksmith is an independent prototype, not affiliated with, sponsored by or endorsed by the LEGO Group or LDraw.org. Compatibility here means use of documented stud-grid reference geometry, not a guarantee of mechanical quality or product certification.

## Full official LDraw runtime library (v0.3 catalog workflow)

The runtime installer downloads the complete **official LDraw community archive** from `https://library.ldraw.org/library/updates/complete.zip`, with SHA-256/version recorded in `tools/catalog/official-library.lock.json`. The 2026-08 archive is kept only in an excluded local cache, not included in the tools npm tarball. Library entries are community-authored definitions, not an exhaustive LEGO-company inventory or unique purchasable-part count.

The original `CAreadme.txt`, `CAlicense.txt`, `CAlicense4.txt`, `Readme.txt`, per-part author/license/history headers and LDConfig are retained unchanged. Individual selected parts in the shuttle include files declaring **CC BY 2.0 and CC BY 4.0** as well as **CC BY 4.0**; consult the original headers and the archive's licensing texts, rather than assuming one license for every file. The portable shuttle scene export deliberately includes its unmodified licensed dependency subset, not the entire archive, and an exact file/source/digest manifest. Those original file headers provide detailed attribution. No library executable is run; no proprietary BrickLink Studio data is copied.

The in-memory rendering MPD normalizes file references so the pinned Three.js loader can resolve dependencies without network probes. Exported library files themselves remain byte-identical to the installed official sources. Renders are derivative visualizations of those models; the portable bundle includes the attribution/license evidence for its selected source data. No contributor, LDraw.org or LEGO endorsement is implied.

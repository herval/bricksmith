# Third-party notices

## Official LDraw runtime library

The installer obtains the official LDraw community archive from `https://library.ldraw.org/library/updates/complete.zip`. Its pinned release and SHA-256 are recorded in `tools/catalog/official-library.lock.json`. The downloaded archive and full extracted library stay in an excluded local cache; neither is part of this repository or the tools package.

LDraw entries are community-authored geometry definitions, not LEGO's exhaustive commercial inventory. Original `CAreadme.txt`, `CAlicense.txt`, `CAlicense4.txt`, `Readme.txt`, per-part author/license/history headers and LDConfig are retained unchanged by the installer and dependency export.

Selected parts can declare CC BY2.0 and CC BY4.0, or CC BY4.0. Consult the actual file headers and original library texts rather than assuming one license for all files. Scene exports deliberately include their unchanged required dependency subset and a source/digest manifest. Preserve that attribution and license evidence when distributing those exports. No library executable is run and no proprietary BrickLink Studio data is copied.

The renderer's in-memory MPD normalizes references for the pinned Three.js loader. Exported source files remain byte-identical to the installed official files. Renders are derivative visualizations of the selected community-authored geometry.

Reference sources:
- Official library: https://library.ldraw.org/
- LDraw format: https://www.ldraw.org/article/218.html
- LDraw licensing information: https://www.ldraw.org/article/349.html

The previous browser application's small rectangular test-fixture library has been removed with that application; it is not a runtime fallback catalog.

## JavaScript dependencies

Three.js and addons, Vite, Playwright and other dependencies retain their individual licenses. Exact dependency versions are pinned in package-lock.json; their original manifests/notices accompany the installed packages after npm installation. This document does not relicense those dependencies.

## Names and trademarks

LEGO is a trademark of the LEGO Group. Bricksmith is independent and is not affiliated with, sponsored by or endorsed by the LEGO Group, LDraw.org, OpenAI or any library contributor. Documented geometry compatibility is not a guarantee of mechanical quality or a product certification.

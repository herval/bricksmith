# Geometry reference

Inspect the installed `schema` and `catalog`. Coordinates are `[x,y,z]`: x/z in studs, y in plates upward; 3 plates = 1 brick. A `[4,10,4]` box is approximately physically cubic. Negative z is front. Front-camera x is not screen-right; instruction maps use x right and z down.

Minimal supported design:
```json
{"schema":"bricksmith.design.v1","name":"Instrument pedestal","description":"Solid support with recessed cap","bounds":{"min":[-4,0,-4],"size":[8,15,8]},"shapes":[{"op":"add","color":71,"shape":{"type":"box","min":[-4,0,-4],"size":[8,3,8]}},{"op":"add","color":1,"shape":{"type":"cylinder","center":[0,9,0],"radius":3,"height":12,"axis":"y"}},{"op":"subtract","shape":{"type":"box","min":[-1,10,-1],"size":[2,5,2]}}],"packing":{"mode":"mixed","maxPieces":500}}
```

`add` creates/recolors matter; `paint` recolors existing occupied cells; `subtract` removes matter. Ellipsoids use `center` and `radii`, boxes use `min` and `size`. CSG union/intersection/difference use children. Voxel overrides run last. Shapes outside bounds are rejected. Sampling at voxel centers can lose fine detail: inspect the compiled render. Use meaningful depth and multiple viewpoints, not a thin frontal panel masquerading as 3D.

Packing is bounded greedy placement of upright rectangular bricks/plates, not every LEGO connection. `mixed` can reduce count; `plates` permits finer layer control. Changes made to pass checks must remain explicit in source and visible in renders. Companion penguin/rover examples show compositions, not exclusive output families.

CLI exits: 0 success with possible warnings; 2 input/budget; 3 structural/fidelity errors with outputs retained; 4 I/O/browser; 5 invariant failure. Existing outputs may be replaced, so use separate revision directories. Pass the source design to validation/export for color-voxel comparison.

Rendering writes front/back/left/right/top/iso PNGs. Export writes model.ldr, inventory.csv, instructions.html, plan.json and report.json. Body/stud previews approximate catalog geometry. No stock, clutch force, torque or insertion-path guarantee is provided. Photo likeness is reviewed by the host, not measured by the voxel-fidelity score.

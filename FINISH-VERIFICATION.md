# Finish — gate 1

## Final implementation — complete

The warm opening is retained per the user's override; storm requirements are skipped. The camera settles underwater and stays there. Two textured scene meshes replace the former corner UI, symmetrically placed at a fixed world depth and resized for the viewport. Their emissive ivory/gold shading varies subtly with a caustic-like light pattern, passes depth testing, and shares underwater fog, rays and post-processing. Fade is a reversible smoothstep from .90 to 1, with no pulse or bloom peak.

The main THIRA mesh has zero reveal at the ending. A blurred, surface-distorted image remains faint overhead, using the existing refraction plus a low-intensity underside projection. This is an artistic approximation of scattered refraction, not a second main-logo reveal.

| Final acceptance | Result |
| --- | --- |
| 1–2 Storm easing | SKIPPED by user; warm gentle easing verified across 46 samples. |
| 3 Whirlpool | PASS — [.52](artifacts/finish-gate-1/0.52.png). |
| 4 Quiet underwater drift | PASS — [.70](artifacts/finish-gate-1/0.7.png), [.85](artifacts/finish-gate-1/0.85.png). |
| 5 Two lit scene logos and dim overhead THIRA | PASS — [desktop](artifacts/finish-gate-1/1.png), [phone](artifacts/finish-gate-1/phone-1.png). |
| 6 No sun disc/flare | PASS — inspected sequence, existing sun removal retained. |
| 7 Symmetric reverse fade | PASS — opacity 0 at .90, .5 at .95, 1 at 1, and matching values on return to .85. |

Build and `scripts/verify-finish.mjs` pass with no browser errors. Phone captures use emulation. Historical gate notes follow.

## Gate 2 — underwater hold implemented

The camera now stays underwater after the whirlpool, drifting from `(0,-6,-10)` at .60 to `(0,-7.2,-14)` and settling at .95–1. Wave amplitude eases to .08, with no late rise, silhouette formation, second main-logo reveal, pulse, or bloom spike. The previous arrival and DOM presenter systems are disconnected. The warm opening remains as requested.

Build and capture verification pass without browser errors. [Underwater resting frame](artifacts/finish-gate-1/1.png). Refracted main-logo strength is kept low; its final readability will be checked alongside the two scene logos in gate 3. Two-logo integration is deliberately pending review of this atmosphere-only hold, per finish.md's instruction to confirm step 2 first. Earlier stage notes below are historical.

Update: the user canceled the storm stage after review. The opening now stays warm (palette=1), with gentler amplitude 1 → .55, steepness .7 → .45, foam .85 → .95, and sway .08 → 0. The extra fast storm chop has been removed. Build passes. The storm acceptance results below are historical and superseded; the underwater ending remains pending.

Implemented the requested storm-to-calm stage. Paused at finish.md's explicit first review gate; the current rise, morph, pulse and corner-logo ending remain pending replacement in gates 2–3.

Amplitude 1.85 → .55, steepness 1.05 → .45, foam control .5 → .95, palette 0 → 1 and camera sway .3 → 0 interpolate continuously across p=0–.45. Fast fine-scale surface chop fades out without retiming the base waves. The vortex begins at .45 and peaks at .52.

| Acceptance | Status |
| --- | --- |
| 1. Rough/dark opening and smooth easing | PASS: 46 progress samples assert linear palette, decreasing amplitude, increasing foam control and no early vortex. [Rough .05](artifacts/finish-gate-1/0.05.png), [intermediate .25](artifacts/finish-gate-1/0.25.png). |
| 2. Gentle, warm pre-vortex water | PASS: [p=.40](artifacts/finish-gate-1/0.4.png), continuing to minimum amplitude at [.45](artifacts/finish-gate-1/0.45.png). |
| 3. Whirlpool | Existing vortex retained; [.52 capture](artifacts/finish-gate-1/0.52.png). |
| 4. Extended underwater drift | PENDING gate 2; [.70 current baseline](artifacts/finish-gate-1/0.7.png). |
| 5. Underwater two-logo ending | PENDING gate 3. |
| 6. Sun disc/flare removed | Existing removal retained; no sun shader additions. |
| 7. Underwater-logo reverse fade | PENDING gate 3. |

Build passes; browser capture checks report no JS/WebGL errors. Phone captures: [.05](artifacts/finish-gate-1/phone-0.05.png), [.40](artifacts/finish-gate-1/phone-0.4.png). Reproduce with `npm run build`, preview on port 8080, and `node scripts/verify-finish.mjs`. Raw numerical results: `artifacts/finish-gate-1/report.json`.

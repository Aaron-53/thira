# Change 07 — placement review

## Gate 3 — resting water interaction

Removed the blanket underwater input block for p>=.90 and added upward ray/surface intersection from beneath the water. Passive movement injects a small .035 impulse into the existing FBO, versus .085 above water. Horizontal touch drags are reserved for water play at rest; vertical swipes retain page navigation. Simulation resolution and render passes are unchanged.

Build and `scripts/verify-resting-ripples.mjs` pass. The test consumed four pointer-driven impulses near the left logo while asserting identical camera position and progress. [Drag capture](artifacts/resting-ripples/drag.png), [edge detail](artifacts/resting-ripples/edge.png), [report](artifacts/resting-ripples/report.json). Stronger click pulse/cooldown and measured active-drag performance comparison remain pending gate 4. No physical-device performance claim is made.

## Gate 2 — immersion shading

Added a dedicated presenter shader with subtle slow UV distortion, distortion driven by the existing ripple texture, a five-tap softened alpha boundary, and a soft refracted wash over the lower portion. The logos remain submerged at their established depth; the wash is an optical treatment rather than falsely moving the actual waterline through them. Scene depth testing still handles real occlusion.

Caustic shading uses the ocean underside's sinusoidal field and shared underwater palette/ambient state. Surface ripple lookup projects the viewing ray onto the overhead water, so the next interaction gate can affect the viewed logo through that surface. No new simulation, render target, or lighting pass was added; active-drag performance measurements are pending the interaction gates.

Build and browser verification pass with no errors. Updated [desktop](artifacts/finish-gate-1/1.png) and [phone](artifacts/finish-gate-1/phone-1.png) captures show the softer, dimmer treatment. Placement and reversible fade remain intact. Paused at the requested immersion review before wiring live interaction and click pulses.

Gate 1 complete. Both logos share the same horizontal world axis and width, with 1.1 logo-widths of clear space between their bounds. Maximum width is 2.1 world units (previously 3.3), scaled down with viewport aspect on phones. This creates more space around the pair without changing the camera or earlier journey.

| Check | Status |
| --- | --- |
| Centered pair with clear gap | PASS — [desktop](artifacts/finish-gate-1/1.png), [phone](artifacts/finish-gate-1/phone-1.png). |
| Faint overhead THIRA retained | PASS — same surface projection and lighting. |
| Forward/reverse fade retained | PASS — capture assertions at .85, .90, .95 and 1. |
| New immersion effects, drag ripples, click pulse, performance comparison | PENDING later gates, per cleanup.md. |

Build and browser checks pass with no browser errors. Paused for the explicit “Stop and show me” placement review before adding immersion effects or interactivity.

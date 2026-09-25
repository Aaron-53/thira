# CHANGE 06 — New ending: settle underwater on the two logos

This **replaces the final phase of CHANGE-04** (the "Rise + reveal" phase and
the water-to-logo silhouette morph from CHANGE-05 are no longer built — do not
implement CHANGE-05's Task 1 pulse or the silhouette morph). Everything else
from CHANGE-04 stays: the storm-to-calm easing, the whirlpool dive, the sun
removal. Only what happens after the whirlpool changes.

**New shape:** open on the logo → storm eases to calm → whirlpool → camera
settles underwater → the two additional logos appear there → scroll ends. The
camera never rises back to the surface. The main Thira logo is not repeated as
a second reveal — it only exists at the very top of the page.

---

## Storm-to-calm easing — confirmed spec (phases 1–2 of CHANGE-04)

This is a single continuous lerp across `p = 0.00–0.45`, driven directly by
scroll progress, not a hard switch between two states.

At `p=0` (rough):
- High wave amplitude and steepness, sharp jagged peaks, deep troughs
- Foam threshold low — whitecaps breaking constantly across the whole surface
- Palette pulled toward `--deep` and `--abyss`, `--ember` pulled back
- Fast, choppy small-scale motion
- Slight uneasy camera sway, like the camera is being pushed around

Easing toward `p=0.45` (calm):
- Amplitude and steepness shrink smoothly, peaks round off
- Foam threshold rises — foam becomes occasional, only on the biggest crests
- Palette warms back toward `--ember`/`--gold`
- Motion settles into a steady, confident glide
- Camera sway smooths out to steady forward movement

All of the above are single lerped uniforms (amplitude multiplier, steepness
multiplier, foam threshold, palette factor, camera-sway magnitude) tied to `p`
across this range — no stepped states, no snapping.

The whirlpool (`p=0.45–0.60`, per CHANGE-04) should hit right at the calmest
point — the sudden spiral is more dramatic landing right after the easing
finishes than it would be landing mid-storm.

---

## New ending — underwater settle, `p = 0.60–1.00`

Replace CHANGE-04's "Calm drift" + "Rise + reveal" phases with one continuous
underwater settle that becomes the final resting frame of the page.

| p | What happens |
|---|---|
| 0.60–0.75 | Camera emerges from the whirlpool into calm underwater drift, as in CHANGE-04's original "Calm drift" phase — slow, steady, minimal movement. This is the breather after the spiral. |
| 0.75–0.90 | Camera continues drifting gently, no more big moves. This is where attention should shift from motion to atmosphere — god rays, drifting particulate, caustics on the underside of the surface, all doing the work rather than the camera. |
| 0.90–1.00 | The two additional logos (from `D:\IEEE\thira\sb logo`) fade in, one to the left, one to the right of frame, as if resting in the water/light with the scene — not pinned to the literal screen corners like CHANGE-05 proposed, but placed as soft, lit elements within the 3D environment so they belong to the underwater world rather than sitting on top of it as flat UI. Motion, camera, and water all settle to their calmest state of the entire piece by `p=1`. This is the final resting frame — nothing happens after this. |

**The main Thira logo:** keep it faintly visible far above, refracted through
the underside of the surface — dim, distorted, barely legible, consistent with
how it already renders during the underwater act per the original build. It is
not a second reveal and should not sharpen or brighten at the end; it stays a
distant, soft presence overhead so the page doesn't feel like the brand
vanished, while the two logos are clearly the foreground of the final frame.

**The two logos:**
- Treat them as lit objects in the scene, not flat overlay UI — same general
  approach as the main logo's integration in CHANGE-02 (emissive material,
  picking up ambient light/color from the underwater environment, soft
  contact-shadow or glow against nearby particulate/caustics), but simpler and
  smaller in scale since they're a secondary element, not the focal point.
- Symmetrical placement, one each side of frame, at a depth/distance that
  reads clearly but doesn't crowd the main logo's faint presence above.
- Fade in only across `p=0.90–1.00`, calm and unhurried — no pulse, no bloom
  spike, no dramatic beat. The drama already happened at the whirlpool; this
  ending is quiet and settled by contrast, which is the point.
- If the user scrolls back up out of this range, fade them back out
  symmetrically with the same easing.

---

## Acceptance

Puppeteer screenshots at `p` = 0.0, 0.05, 0.40, 0.52, 0.70, 0.85, 1.0. Confirm:

1. `p=0.05` is visibly rougher/darker than `p=0.40` — confirm the easing is a
   smooth gradient across several intermediate captures, not a jump.
2. `p=0.40` is the calmest frame before the whirlpool — waves gentle, palette
   warm, foam minimal.
3. `p=0.52` shows a clear spiral/vortex shape with the camera rolled and
   descending.
4. `p=0.70` reads as calm underwater drift — god rays, particulate, caustics
   present, camera nearly static.
5. `p=1.0` shows both side logos clearly, faintly lit and integrated into the
   scene (not flat UI stickers), with the main logo dimly visible far above
   through the refracted surface.
6. No sun disc/flare anywhere in the sequence.
7. Scrolling back from `p=1.0` toward `p=0.85` fades the two logos back out
   smoothly.

Report pass/fail per check with screenshots. Fix and re-verify before reporting
done.

## Build order — stop at each gate

1. Confirm storm-to-calm easing matches the spec above (if already built per
   CHANGE-04, just re-verify against this more detailed description).
   **Stop and show me.**
2. Remove the rise/reveal phase and water-to-logo morph; extend calm underwater
   drift to fill `p=0.60–0.90`.
3. Integrate the two side logos as lit scene objects, fade in across
   `p=0.90–1.00`, confirm main logo stays dim/distant above.

Do not build the two-logo integration until step 2's calm underwater hold
feels right on its own — it needs to feel complete even before the logos
appear, since they're a quiet addition, not the thing carrying the moment.

# CHANGE 07 — Resting-frame interactivity + logo placement refinement

Applies to the final resting frame from CHANGE-06 (`p ≈ 0.90–1.00` and beyond).
Does not touch the storm-to-calm easing, whirlpool, or underwater drift
earlier in the scroll — this is about what happens once the camera has
settled and the two logos are visible.

---

## TASK 1 — Keep the water live at rest

Once scroll reaches the resting point, do not freeze the ripple simulation.

- Pointer move / touch-drag continues to inject impulses into the ripple FBO
  exactly as it does earlier in the experience — the water should still visibly
  react to the cursor near the logos, catching light as it disturbs.
- This should read as calm, ambient interactivity — small, responsive ripples,
  not anything dramatic. It's meant to make the final frame feel alive at rest,
  not to introduce new energy into a moment that's supposed to feel settled.
- Confirm this doesn't regress performance at rest — the ripple sim should
  already be budgeted from CHANGE-03; no new cost here beyond what's already
  accounted for.

## TASK 2 — Click/tap sends a stronger single pulse

- A deliberate click or tap anywhere on the water at rest triggers one larger
  ripple impulse at that point — noticeably stronger than the passive
  drag-ripples from Task 1, but calibrated to feel *playful*, not to compete
  with the whirlpool's scale or the intensity of anything earlier in the
  journey. This is a small "poke the water" moment, not a second climax.
- Should have a short cooldown (roughly 400–600ms) so rapid clicking doesn't
  spam overlapping pulses into noise.
- If clicked near a logo, the pulse should visibly interact with that logo's
  reflection/lighting (per Task 4 below) — light catching and shifting
  slightly as the ripple passes under it.
- No sound, no camera reaction, no UI popup — the water's response is the
  entire feedback loop.

## TASK 3 — Reposition the two logos: centered, gapped, elegant

Replace the "one left, one right of frame" placement from CHANGE-06 with a
more deliberate centered composition.

- Both logos sit near the horizontal center of frame, not out at the edges —
  a clear, intentional gap between them (roughly logo-width to 1.5x logo-width
  of empty space between the two, tune by eye once placed), rather than
  pushed apart to fill the frame.
- Align them on the same horizontal axis, similar scale, so the pairing reads
  as a single balanced composition rather than two independent elements.
- Keep the main Thira logo's faint, distant, refracted presence above them per
  CHANGE-06 — the two logos remain the clear foreground focal point, the main
  logo stays a soft backdrop presence, not competing for the same visual
  weight.
- Leave generous negative space around the pair — this is the calm, resolved
  end of the piece, so the framing should feel unhurried, not packed.

## TASK 4 — "Immersed in water" treatment for the logos

Right now the spec (CHANGE-06) already treats them as lit scene objects rather
than flat UI. Push that further so they read as genuinely part of the water,
not just floating near it.

- **Surface interaction mask:** where the water surface passes in front of or
  behind each logo, let it visibly obscure/reveal parts of the mark — e.g. if
  the logos sit just at or below the waterline, waves and foam should
  partially wash across their lower portion as the (still-live, per Task 1)
  surface moves, rather than the logos sitting cleanly in open water with a
  hard boundary.
- **Refraction distortion:** apply a subtle refraction/warp to each logo
  consistent with how the main logo is distorted underwater — small, slow
  ripple-driven displacement of the logo's edges, so it reads as being seen
  *through* water, not painted on top of it.
- **Caustic light overlay:** project the same caustic pattern used elsewhere
  underwater onto the logos' surfaces, faint and slow-moving, so light plays
  across them the same way it plays across the ocean floor/underside — this is
  what will sell "immersed" over "placed."
- **Soft edge falloff / volumetric feel:** avoid a hard silhouette edge; let
  the logos fade slightly into the surrounding water-fog at their boundary
  rather than a crisp cutout, consistent with how distant objects already
  fade in the underwater fog per the base ocean scene.
- Tie brightness/caustic intensity to the ambient god-ray/particulate system
  already present in the underwater act, so they feel lit *by* the same
  environment rather than separately lit on top of it.

---

## Acceptance

Puppeteer screenshots at the resting frame (`p=1.0`), plus:
- One capture mid-drag showing cursor ripples reaching the logos
- One capture ~150ms after a simulated click showing the stronger pulse
- One capture focused tightly on a single logo's edge to check the
  caustic/refraction/mask treatment

Confirm:

1. Passive cursor movement near the logos visibly disturbs the water and
   catches light, without any camera or scene reaction beyond the ripple.
2. A click produces a visibly larger, distinct ripple than passive drag, and
   it fades within roughly a second without spamming on rapid clicks.
3. The two logos are centered as a pair with a clear, elegant gap between
   them — not pinned to the screen edges.
4. Close on a logo's edge: no hard flat cutout — visible caustic light,
   refraction warp, and/or surface wash softening the boundary.
5. The main Thira logo is still present, faint and distant, above the pair —
   not removed, not brightened to compete.
6. Performance at rest with active dragging matches the budgets from
   CHANGE-03 — no new frame-time regression.

Report pass/fail per check with screenshots. Fix and re-verify before
reporting done.

## Build order — stop at each gate

1. Reposition logos to centered/gapped placement. **Stop and show me** — get
   the composition right before adding effects on top of it.
2. Immersion treatment (mask, refraction, caustics, edge falloff) on the
   repositioned logos.
3. Live ripple response at rest (Task 1).
4. Click pulse (Task 2), tuned against the now-live water and logos.

Confirm placement and the immersion look before wiring interactivity — much
easier to judge if a ripple "reads well against a logo" once the logo itself
already looks right sitting in the water.

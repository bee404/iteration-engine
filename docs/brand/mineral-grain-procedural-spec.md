# Mineral grain texture

This recipe defines the reusable `Mineral grain` family: a refined, nearly black rough material with sparse warm Banana veins, fine micro-detail, and an optional edge fade. The presentation vignette is a separate layer so the underlying field can be reused in covers, cards, panels, and crops.

## Construction order

1. **Base field**
   - Start with a near-black floor: Void `#050505` through graphite `#242326`.
   - Build three low-frequency, tileable noise fields at roughly 1x, 2x, and 4x scale.
   - Domain-warp the sampling coordinates with a fourth, lower-contrast field so the strata bend and shear instead of forming obvious parallel bands.
   - Combine the fields with multiply/overlay-style remapping. Reserve the brightest graphite for ridges and keep large cavities below the mid-value range.

2. **Fine material detail**
   - Add high-frequency, tileable grain after the broad strata. Keep it delicate: hairline scratches, tiny mineral granules, and broken edge highlights rather than evenly distributed speckle.
   - Use a seeded threshold mask so detail clusters in some strata and disappears in others. A good starting point is 15–25% coverage at low opacity.
   - Vary grain scale and direction by region. Never let the micro-detail repeat on the same interval as the broad field.

3. **Banana veins**
   - Place a small set of seeded Poisson/blue-noise points, connect only selected neighbors, and perturb each path through the same domain-warp field as the mineral strata.
   - Use mixed path lengths and widths. Most veins should be hairline, with only a few slightly wider passages; interrupt paths with gaps and occlusion.
   - Mix Banana `#F9F996` with warm graphite and muted gold-brown at low opacity so the color feels embedded in the mineral, not drawn on top.
   - Keep total Banana coverage sparse, approximately 1–4% of the visible field. Avoid evenly spaced routes, mirrored branches, or a single dominant center line.

4. **Depth pass**
   - Add occlusion around cavities and under overlapping strata. Use several narrow value ramps rather than one smooth gradient.
   - Allow a few physically impossible deep folds. The goal is a polished rough material with depth, not a literal geological scan.

5. **Edge vignette, applied last**
   - Keep the base field and vignette as separate layers or parameters.
   - For the standard presentation version, use a radial or superellipse distance mask with an inner radius around 68–74% of the shorter canvas dimension and a fast transition over the next 10–16%.
   - Remap the outer edge to Void `#050505` or transparent-black. The edge should fall quickly enough that the texture appears to emerge from darkness, while the center retains readable material detail.
   - For a panel or crop, use four independent edge masks instead of a centered radial mask when the fade needs to follow the container geometry.

## Tileability without repetition

- Sample noise in toroidal coordinates so the left/right and top/bottom boundaries match exactly.
- Keep the vignette out of the tileable source. Apply it per placement after tiling, cropping, or compositing.
- Use one fixed seed per named texture, then derive separate seeds for strata, grain, veins, and occlusion. This keeps revisions reproducible without synchronizing every feature.
- Combine at least three tile periods with non-integer-looking relative scales, phase offsets, and rotated directional fields. Do not stack copies of one bitmap.
- Use blue-noise feature placement and variable path lengths so repeated tiles do not reveal a grid. When a larger surface is needed, offset neighboring tiles by half a period and change the derived detail seed while preserving the same palette and density.
- Review the texture at 1x, 2x, and 4x scale. A seam check should include all four edges before the vignette is added; a repetition check should include a 3x3 tiled preview.

## Reproduction pseudocode

```text
field = toroidal_noise(seed.field, scale=[1, 2, 4])
warp  = toroidal_noise(seed.warp, scale=8) * warpAmount
strata = remap(domain_warp(field, warp), nearBlack, graphite)
grain  = threshold(toroidal_noise(seed.grain, scale=[16, 32]), clusteredRange)
veins  = draw_selected_warped_paths(seed.veins, blueNoisePoints, strata)
base   = occlude(strata + fineGrain(grain) + sparseBanana(veins))

vignette = superellipse_mask(inner=0.70, transition=0.13)
present  = base * vignette
```

The export named `mineral-grain-fine-vignette-1536x1024.png` is the reference presentation pass. Keep `mineral-grain-deep-veins-1536x1024.png` as the less-vignetted comparison, and preserve the unmasked procedural base separately when building a production generator.

## Review criteria

- Does the center feel materially finer without turning into noise?
- Do the edges disappear quickly enough to feel intentional, but not so quickly that the texture reads as a black oval?
- Does a 3x3 tiled preview avoid obvious repeated strata, vein spacing, and grain clusters?
- Does the Banana remain a rare material signal rather than an accent color coating?

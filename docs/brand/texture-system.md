# Obsidian53 texture system

This is the committed reference for the two approved Obsidian53 material families. The images are user-adjusted examples from the Pairing 2C exploration. They are anchors for material identity and contrast behavior, not templates to duplicate exactly.

The committed copies are compressed reference images (resized, WebP), not production or print masters — see [`design-review/brand-assets/textures/MANIFEST.md`](../../design-review/brand-assets/textures/MANIFEST.md) for the compression ratio and links to the archived full-resolution originals.

## Approved reference set

| Family | Reference | Character | Use |
|---|---|---|---|
| Fissure | [`fissure-user-adjusted.webp`](../../design-review/brand-assets/textures/fissure-user-adjusted.webp) | Sparse, hairline warm fractures across a nearly black field with a few bright junctions | Active signal, atmospheric edge, or quiet high-contrast moment |
| Fissure | [`fissure-alt-user-adjusted.webp`](../../design-review/brand-assets/textures/fissure-alt-user-adjusted.webp) | Larger negative space, long irregular routes, and isolated luminous nodes | Calm background, cover crop, or avatar-safe composition |
| Mineral | [`mineral-background-user-adjusted.webp`](../../design-review/brand-assets/textures/mineral-background-user-adjusted.webp) | Broad layered black stone with fine relief and restrained warm inclusions | Flexible base material for surfaces and web sections |
| Mineral | [`mineral-background-dark-user-adjusted.webp`](../../design-review/brand-assets/textures/mineral-background-dark-user-adjusted.webp) | Lower-key cut with deeper cavities and more subdued structure | Dark presentation, atmospheric hero, or text-safe field |

The LinkedIn cover (a marketing deliverable, not a texture reference) no longer lives in this repo. The 3168 × 792 original is archived at https://api.app.obvious.ai/prepare/files/link/fl_yfVLvNAW/linkedin-cover-under-2mb.png.

## Shared brand behavior

- The material ground is nearly black, quiet, and tactile. It should feel like real rough stone refined through a digital process.
- Banana is a rare warm mineral signal, never a blanket tint or a second interface accent.
- Detail density should be uneven. Silence and dark cavities are part of the identity.
- Subtle bloom is reserved for a few meaningful junctions or inclusions. It should never become neon, sci-fi, or decorative sparkle.
- Preserve the contrast hierarchy, roughness, and depth while changing the exact topology, crop, and local feature placement.
- Future brand comps should show these materials applied inside an adventurous studio webpage, not framed artwork or presentation-board mockups. Organic material should meet precise digital structure, with parallax, scroll-revealed shimmer, or restrained glow treated as implementation directions rather than baked decoration.

## Regeneration rule: same stone, new cut

Use a reference image and ask for a **new cut from the same stone**, not a recreation. Keep the material, palette, detail scale, and contrast hierarchy stable. Change the macro arrangement by approximately 15–30% through a new seed, crop, topology, or fold map. Store the reference image, prompt, model, aspect ratio, seed, and variation strength with each approved output.

The [`texture-family-prompt-guide.md`](texture-family-prompt-guide.md) contains the family-specific anchor prompts, controls, and negative prompt block. The deeper implementation recipes are:

- [`banana-fissure-procedural-spec.md`](banana-fissure-procedural-spec.md) for seeded routes, edge fading, and tileable night-network variants.
- [`mineral-grain-procedural-spec.md`](mineral-grain-procedural-spec.md) for layered strata, fine grain, embedded inclusions, and separate vignette compositing.

## Procedural contract

The texture generator should expose these independent controls:

1. `seed`: one stable family seed, with derived seeds for strata, grain, veins, and occlusion.
2. `macroVariation`: a controlled change to topology or fold map, typically 0.15–0.30.
3. `density`: active feature coverage, preserving large dark regions.
4. `materialScale`: broad structure, middle relief, and fine grain scale relationship.
5. `bananaSignal`: warm inclusion coverage and brightness budget.
6. `edgeMask`: optional presentation vignette or four-edge fade, applied after the tileable base.
7. `tileMode`: periodic/toroidal sampling with a 3 × 3 repeat check.

Keep the base field separate from the presentation mask. Tileability belongs to the underlying field; the vignette belongs to the placement or composition. This lets one stone generate many unique crops without a repeated edge treatment or visible grid.

# Texture family prompt guide

The user-adjusted examples in [`design-review/brand-assets/textures/`](../../design-review/brand-assets/textures/) are the current visual anchors for the two texture families. They define a shared stone identity, not a single image to copy. New generations should feel cut from the same material while changing the local pattern, crop, and feature placement.

## Shared identity lock

Keep these properties stable across both families:

- almost-black mineral ground with very low overall brightness
- subtle real surface grain, never a clean digital gradient
- warm Banana/amber mineral inclusions used sparingly
- deep negative space and strong value separation between voids and active detail
- restrained highlight bloom only at a few naturally important points
- organic irregularity, asymmetry, and no repeated motif
- no text, logos, objects, frames, UI, decorative border, marble cliché, lava, galaxy, neon circuit board, or evenly distributed sparkle

Use one of the attached examples as the image reference or style anchor. Ask for a **new cut from the same stone**, not a recreation of the reference. Preserve the contrast hierarchy, material, palette, and detail scale while changing the macro arrangement by roughly 15–30%.

## Fissure family

### What must remain recognizable

The Fissure texture is a nearly black, quiet stone field crossed by a sparse network of hairline warm veins. It has large areas of silence, irregular long arcs, a few memorable junctions, and occasional tiny points that catch light. The veins should feel embedded in a fracture, not painted on top or rendered as electricity.

### Anchor prompt

```text
Use the supplied Fissure texture as a material and contrast reference. Generate a new cut from the same nearly black mineral stone, not a duplicate of the reference. Keep the same quiet near-black ground, subtle fine grain, sparse warm Banana-amber fracture veins, and large negative spaces. Create a new irregular network with [4–8] primary hairline fissures, [2–4] secondary branches, and only [1–3] brighter junctions. Vary path length, curvature, interruption, and brightness. Let most fissures fade into the stone or enter from selected edges; do not outline the entire frame. Keep the active network asymmetrical and non-repeating. Make the veins look mineral, dry, and embedded, with restrained pinpoint glints and almost no bloom. Preserve the original family’s low-key contrast and deep black atmosphere while changing the exact topology, crop, and junction locations by 15–30%. Texture only, no objects, text, logo, border, frame, UI, neon circuit board, lightning, roots, lava, or galaxy.
```

### Variation controls

- **Quieter:** 2–5 primary fissures, no more than one bright junction, lower vein opacity, larger empty regions.
- **More connected:** 6–10 primary fissures, 2–4 junctions, but keep all lines hairline and irregular.
- **Edge emergence:** use a separate edge mask so most routes lose opacity near the perimeter while a few selected paths enter from an edge.
- **Macro shift:** change the network seed and rotate or offset the crop. Keep the same density and brightness budget.

Avoid asking for “glowing cracks,” “electric veins,” or “a circuit pattern.” Those phrases push the result away from the stone identity.

## Mineral family

### What must remain recognizable

The Mineral texture is a broad, directional, black stone surface with layered folds, deep cavities, fine relief, and small warm inclusions buried in the strata. It should feel tactile and refined, but not glossy marble. The dark version is a lower-key cut of the same stone, not a different material.

### Anchor prompt

```text
Use the supplied Mineral texture as a material and tonal reference. Generate a new cut from the same deep black, layered mineral stone, not a duplicate of the reference. Preserve the broad directional strata, fine granular relief, black cavities, low overall brightness, and restrained warm Banana-amber inclusions. Build three or more overlapping scales of organic mineral structure: broad folded bands, middle-scale broken striations, and very fine grain. Let the strata drift through domain-warped, non-parallel directions. Keep the warm inclusions sparse, narrow, discontinuous, and embedded inside selected ridges. Use deep near-black occlusion and subtle graphite gradation for impossible depth. Change the exact fold map, crop, and vein placement by 15–30% while keeping the same stone identity, contrast hierarchy, density, and material scale. Use a hard or controlled edge fade only if requested. Texture only, no objects, text, logo, border, frame, UI, polished marble, smooth gray gradient, lava, galaxy, or decorative sparkle.
```

### Variation controls

- **Dark cut:** lower the graphite ridge values, deepen cavities, reduce warm inclusion coverage to 1–2%.
- **Readable cut:** lift only selected ridges toward graphite, never the entire field; keep the corners dark.
- **Fine cut:** increase hairline grain and small broken striations, but do not add uniform noise.
- **Strata shift:** change the domain-warp seed and directional bias while keeping the same roughness and scale relationship.

Avoid asking for “black marble” or “gold marble.” Those phrases tend to introduce polished reflective bands and a luxury-stone cliché instead of this rough, deep material.

## Reproducibility protocol

1. Save the exact reference image, prompt, model, aspect ratio, seed, and variation strength with every approved generation.
2. Keep a stable `stone identity` block and change only one variation block at a time: topology, crop, density, brightness, or edge treatment.
3. Use a fixed seed for a family anchor and derived seeds for each new cut. Never reuse the same seed and prompt when the goal is a genuinely new pattern.
4. Request a controlled change such as “new cut, same stone, 20% macro variation” rather than “make it different.”
5. For a procedural remake, separate the tileable base field from the presentation mask. Use periodic/toroidal noise, domain warping, seeded feature placement, and a separate vignette or edge-fade layer. AI generation can suggest the material and topology, but seamless tileability still needs a seam check and usually a procedural or offset-based cleanup pass.
6. Review a 3x3 tiled preview before approving any texture intended for repeated use. Reject obvious repeated junctions, identical fold intervals, synchronized grain clusters, or a visible grid.

## Negative prompt block

```text
no bright neon, no electric lightning, no roots, no veins that look painted on, no circuit board, no evenly spaced network, no mirrored symmetry, no repeating tile motif, no polished marble, no glossy gold, no smooth gradient, no galaxy, no lava, no smoke, no object, no text, no logo, no border, no frame, no UI, no collage
```

The goal is consistency of material behavior, density, palette, and depth. The exact fissure topology or mineral fold map should remain unique in every approved output.

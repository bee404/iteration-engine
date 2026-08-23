# Texture reference manifest

This folder holds compressed, git-friendly reference images for the two approved
Obsidian53 material families — **Fissure** and **Mineral**. They exist so an agent,
tool, or reviewer can open this repo cold and get an accurate sense of what each
family should look like, without multi-megabyte production masters living in git
history. See [`docs/brand/texture-system.md`](../../../docs/brand/texture-system.md)
for the full regeneration contract and brand rules these textures anchor.

## Files

| File | Family | Character | Intended use |
|---|---|---|---|
| `fissure-user-adjusted.webp` | Fissure | Sparse, hairline warm fractures across a nearly black field with a few bright junctions | Active signal, atmospheric edge, or quiet high-contrast moment |
| `fissure-alt-user-adjusted.webp` | Fissure | Larger negative space, long irregular routes, and isolated luminous nodes | Calm background, cover crop, or avatar-safe composition |
| `mineral-background-user-adjusted.webp` | Mineral | Broad layered black stone with fine relief and restrained warm inclusions | Flexible base material for surfaces and web sections |
| `mineral-background-dark-user-adjusted.webp` | Mineral | Lower-key cut with deeper cavities and more subdued structure | Dark presentation, atmospheric hero, or text-safe field |

## Compression

Each file started as a 3072×2048 uncompressed PNG (5.3–7.3 MB). The copies committed
here are resized to 1600px wide and re-encoded as WebP at quality 82, landing at
50–150 KB each — roughly a 98% reduction with no perceptible loss to the material
character, contrast hierarchy, or fine grain these textures exist to demonstrate.
These are reference/grounding copies only; they are not production or print assets.

## Full-resolution masters

The original, uncompressed PNGs are not duplicated in this repository. They are
archived in the Obvious project that owns the Obsidian53 brand work:

| File | Archived master |
|---|---|
| `fissure-user-adjusted.png` | https://api.app.obvious.ai/prepare/files/link/fl_SnwzI4qW/fissure-user-adjusted.png |
| `fissure-alt-user-adjusted.png` | https://api.app.obvious.ai/prepare/files/link/fl_6P5KawGS/fissure-alt-user-adjusted.png |
| `mineral-background-user-adjusted.png` | https://api.app.obvious.ai/prepare/files/link/fl_G1eXJo37/mineral-background-user-adjusted.png |
| `mineral-background-dark-user-adjusted.png` | https://api.app.obvious.ai/prepare/files/link/fl_kQo0K9zv/mineral-background-dark-user-adjusted.png |

Pull from there if pixel-accurate masters are ever needed (large print applications,
further procedural-generation training references, etc.). If those links ever go
stale, ask Bryan for the current master location before regenerating from scratch.

## Regenerating a reference

If a texture master is refreshed, produce a new WebP from the updated master at
≤1600px wide and quality ~80–85, replace the corresponding file here, and archive
the new full-resolution original the same way (outside git). No doc changes are
needed as long as the filename and family stay the same.

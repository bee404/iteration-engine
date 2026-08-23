# Banana night-network procedural direction

The Banana fissure texture should behave like a seeded field, not a fixed illustration. The reusable unit is a dark night surface with a sparse, irregular graph of distant illuminated routes.

## Shared rules

- Start from a near-black floor darker than the current Void value, with most of the canvas held in quiet darkness.
- Seed points with a blue-noise or Poisson distribution, then connect only a selective subset of points. Do not build a complete mesh.
- Deform routes with low-frequency noise so they retain the original organic crack character without becoming uniform polygons.
- Vary route length, width, brightness, and interruption. Most paths should fade, break, or disappear into the field.
- Use Banana as a low-coverage light signal, with occasional soft bloom and no second saturated accent.
- Add restrained mineral grain after the network is rendered.
- Apply a feathered edge mask by default. Let most routes lose opacity near the frame boundary so the network appears to emerge into view, while allowing a small number of intentional edge entrants for variation.
- Use a toroidal or wrapped coordinate system so the texture can repeat across banners, cards, and panels without a hard seam.
- Keep a fixed random seed per approved variant so every placement can reproduce the same texture.

## Version A: Highway night

- More connected than Version B, but still sparse.
- Favor long route segments with a few irregular branches.
- Use several brightness tiers so a handful of paths read as major highways.
- Leave large uninterrupted black areas around the network.

## Version B: Interchange night

- Fewer total routes and more asymmetry.
- Favor isolated clusters, long arcs, and occasional interchange knots.
- Make distance do more of the work: most routes are dim, with only a few bright signals.
- Keep the composition quiet enough to sit behind large type or an avatar-safe layout.

## Review question

Choose whether the system should feel more like a connected transportation map (Version A) or a sparse constellation of distant routes (Version B) before turning this into production code.

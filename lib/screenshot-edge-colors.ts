import { analysisSize, decodeImage, rasterize, type Raster } from "@/lib/screenshot-raster";

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Two flat, full-height colour zones running down a screenshot — the shape a UI with a nav sidebar
 * against a content area makes. `boundary` is where they meet, as a fraction [0,1] of image width.
 */
export interface VerticalColorSplit {
  leading: RgbColor;
  trailing: RgbColor;
  boundary: number;
}

const ANALYSIS_MAX = 480; // longest side of the low-res raster we measure against
const COLOR_TOL = 10; // per-channel distance within which two colours count as the same
const ROW_SAMPLES = 150; // rows sampled per column when deriving that column's dominant colour
const VERTICAL_MARGIN = 0.04; // skip the top/bottom 4%: title bars are not zone colour
const MIN_BAND_FRACTION = 0.06; // narrower runs are borders, scrollbars, or capture margins
const MIN_COVERAGE = 0.86; // the two zones must own this much of the width for the illusion to hold
const MIN_ZONE_DELTA = 8; // below this the zones read as one colour, so there is no split to echo
const MIN_BAND_FLATNESS = 0.8; // share of a zone's pixels that must match its dominant colour
const BUCKET = 4; // colour-quantisation step that makes the per-column mode stable

interface ColumnSample {
  color: RgbColor;
  /** Share of sampled pixels in this column within COLOR_TOL of its dominant colour. */
  flatness: number;
}

interface ColorBand {
  start: number;
  end: number;
  color: RgbColor;
  flatness: number;
}

/**
 * Finds the two flat colour zones a UI screenshot is built from, so the reference container can
 * continue them into its padding (Figma node 118:1234). Returns null whenever the image does not
 * clearly have that structure — a uniform background, a gradient, or a busy/photographic capture —
 * because inventing a split for those would paint an unrelated colour beside the image.
 *
 * Pure: give it a raster, get a verdict. Callers rasterise at the edge.
 */
export function detectVerticalColorSplit(raster: Raster): VerticalColorSplit | null {
  const profile = buildColumnProfile(raster);
  if (!profile) return null;

  // Runs narrower than MIN_BAND_FRACTION are dropped rather than ending the scan, so a hairline card
  // border or the decorative margin a mock-up capture carries does not hide the zones behind it.
  const zones = collectBands(profile).filter(
    (band) => (band.end - band.start) / raster.width >= MIN_BAND_FRACTION,
  );
  if (zones.length !== 2) return null;

  const [leading, trailing] = zones;
  if (!leading || !trailing) return null;

  const coverage = (leading.end - leading.start + (trailing.end - trailing.start)) / raster.width;
  if (coverage < MIN_COVERAGE) return null;
  if (leading.flatness < MIN_BAND_FLATNESS || trailing.flatness < MIN_BAND_FLATNESS) return null;
  if (colorDistance(leading.color, trailing.color) < MIN_ZONE_DELTA) return null;

  return {
    leading: leading.color,
    trailing: trailing.color,
    boundary: trailing.start / raster.width,
  };
}

/** Browser edge: decode, rasterise small, then hand the pixels to the pure detector. */
export async function analyzeScreenshotColorSplit(
  source: string,
): Promise<VerticalColorSplit | null> {
  if (typeof document === "undefined") return null;
  try {
    const image = await decodeImage(source);
    if (!image.naturalWidth || !image.naturalHeight) return null;
    const { width, height } = analysisSize(image.naturalWidth, image.naturalHeight, ANALYSIS_MAX);
    const raster = rasterize(image, width, height);
    return raster ? detectVerticalColorSplit(raster) : null;
  } catch {
    return null;
  }
}

export function toCssColor({ r, g, b }: RgbColor): string {
  return `rgb(${r} ${g} ${b})`;
}

/** One dominant colour per column, measured down the image's vertical middle. */
function buildColumnProfile(raster: Raster): ColumnSample[] | null {
  const { width, height } = raster;
  if (width < 2 || height < 2) return null;

  const first = Math.floor(height * VERTICAL_MARGIN);
  const last = Math.max(first + 1, Math.ceil(height * (1 - VERTICAL_MARGIN)));
  const step = Math.max(1, Math.floor(height / ROW_SAMPLES));

  const rows: number[] = [];
  for (let y = first; y < last && y < height; y += step) rows.push(y);
  if (rows.length === 0) return null;

  const profile: ColumnSample[] = [];
  for (let x = 0; x < width; x += 1) profile.push(sampleColumn(raster, x, rows));
  return profile;
}

function sampleColumn(raster: Raster, x: number, rows: number[]): ColumnSample {
  // Mode over coarse colour buckets: robust to the antialiasing and subpixel text that a mean or
  // median would smear into a colour present nowhere in the image.
  const counts = new Map<number, number>();
  for (const y of rows) {
    const key = bucketKey(raster, x, y);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let bestKey = 0;
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }

  const color = bucketColor(bestKey);
  let matching = 0;
  for (const y of rows) {
    if (colorDistance(readPixel(raster, x, y), color) <= COLOR_TOL) matching += 1;
  }
  return { color, flatness: matching / rows.length };
}

/**
 * Groups columns into runs of one colour. Membership is bounded by the run's total spread rather
 * than by distance from its opening column: anchoring on the first column lets a run drift, so a
 * colour sitting between two real zones could otherwise swallow both into a single band.
 */
function collectBands(profile: ColumnSample[]): ColorBand[] {
  const bands: ColorBand[] = [];
  let start = 0;
  let spread = openSpread();

  for (let x = 0; x < profile.length; x += 1) {
    const sample = profile[x];
    if (!sample) continue;
    const widened = widen(spread, sample.color);
    if (x > start && spreadExceeds(widened, COLOR_TOL)) {
      bands.push(closeBand(profile, start, x));
      start = x;
      spread = widen(openSpread(), sample.color);
      continue;
    }
    spread = widened;
  }
  bands.push(closeBand(profile, start, profile.length));
  return bands;
}

/** A band is described by the colour most of its columns actually are, not by where it started. */
function closeBand(profile: ColumnSample[], start: number, end: number): ColorBand {
  const counts = new Map<number, { color: RgbColor; count: number }>();
  let total = 0;

  for (let x = start; x < end; x += 1) {
    const sample = profile[x];
    if (!sample) continue;
    total += sample.flatness;
    const key = packColor(sample.color);
    const seen = counts.get(key);
    if (seen) seen.count += 1;
    else counts.set(key, { color: sample.color, count: 1 });
  }

  let color: RgbColor = { r: 0, g: 0, b: 0 };
  let best = -1;
  for (const entry of counts.values()) {
    if (entry.count > best) {
      color = entry.color;
      best = entry.count;
    }
  }

  return { start, end, color, flatness: total / Math.max(1, end - start) };
}

interface ChannelSpread {
  min: RgbColor;
  max: RgbColor;
}

function openSpread(): ChannelSpread {
  return { min: { r: 255, g: 255, b: 255 }, max: { r: 0, g: 0, b: 0 } };
}

function widen({ min, max }: ChannelSpread, color: RgbColor): ChannelSpread {
  return {
    min: { r: Math.min(min.r, color.r), g: Math.min(min.g, color.g), b: Math.min(min.b, color.b) },
    max: { r: Math.max(max.r, color.r), g: Math.max(max.g, color.g), b: Math.max(max.b, color.b) },
  };
}

function spreadExceeds({ min, max }: ChannelSpread, tolerance: number): boolean {
  return colorDistance(min, max) > tolerance;
}

function packColor({ r, g, b }: RgbColor): number {
  return (r << 16) | (g << 8) | b;
}

function bucketKey(raster: Raster, x: number, y: number): number {
  const { r, g, b } = readPixel(raster, x, y);
  return (Math.floor(r / BUCKET) << 16) | (Math.floor(g / BUCKET) << 8) | Math.floor(b / BUCKET);
}

function bucketColor(key: number): RgbColor {
  const half = Math.floor(BUCKET / 2);
  return {
    r: Math.min(255, ((key >> 16) & 0xff) * BUCKET + half),
    g: Math.min(255, ((key >> 8) & 0xff) * BUCKET + half),
    b: Math.min(255, (key & 0xff) * BUCKET + half),
  };
}

function readPixel(raster: Raster, x: number, y: number): RgbColor {
  const offset = (y * raster.width + x) * 4;
  return {
    r: raster.data[offset] ?? 0,
    g: raster.data[offset + 1] ?? 0,
    b: raster.data[offset + 2] ?? 0,
  };
}

function colorDistance(a: RgbColor, b: RgbColor): number {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
}

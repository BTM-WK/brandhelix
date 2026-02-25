// Satori + Sharp pipeline — React → SVG → PNG
// Server-side only. Do NOT import in client components.

import satori, { type SatoriOptions } from 'satori';
import sharp from 'sharp';
import type { ReactNode } from 'react';

// Re-export SatoriOptions for consumers
export type { SatoriOptions };

// ── Font cache ────────────────────────────────────────────────────────────────
// Noto Sans KR covers the full Korean (Hangul) Unicode block.
// We fetch the regular (400) weight from Google Fonts' static CDN and cache
// the ArrayBuffer in a module-level variable so it is loaded only once per
// server process lifetime.

const NOTO_SANS_KR_URL =
  'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.0.woff';

let cachedFontData: ArrayBuffer | null = null;

/**
 * Load Noto Sans KR from Google Fonts CDN and cache the result.
 * Returns the font as an ArrayBuffer suitable for Satori.
 */
async function loadKoreanFont(): Promise<ArrayBuffer> {
  if (cachedFontData !== null) {
    return cachedFontData;
  }

  const response = await fetch(NOTO_SANS_KR_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Noto Sans KR font: ${response.status} ${response.statusText}`
    );
  }

  cachedFontData = await response.arrayBuffer();
  return cachedFontData;
}

// ── Core pipeline steps ───────────────────────────────────────────────────────

/**
 * Convert a React element to an SVG string using Satori.
 *
 * @param element   - The React element to render (must use inline styles only).
 * @param options   - Satori options (width, height, fonts, etc.).
 * @returns         SVG markup as a string.
 */
export async function renderToSvg(
  element: ReactNode,
  options: SatoriOptions
): Promise<string> {
  // Satori expects the element typed as React.ReactNode but its own type
  // signature uses JSX.Element. The cast is safe here because we validate
  // usage via the public helpers below.
  const svg = await satori(element as Parameters<typeof satori>[0], options);
  return svg;
}

/**
 * Convert an SVG string to a PNG Buffer using Sharp.
 *
 * @param svg     - SVG markup produced by renderToSvg.
 * @param width   - Output width in pixels.
 * @param height  - Output height in pixels.
 * @returns       PNG image as a Node.js Buffer.
 */
export async function svgToPng(
  svg: string,
  width: number,
  height: number
): Promise<Buffer> {
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toBuffer();

  return pngBuffer;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render a React element to a PNG Buffer.
 *
 * Combines renderToSvg + svgToPng in one call. Automatically loads and caches
 * the Noto Sans KR font so Korean text renders correctly.
 *
 * @param element   - The React element to render (inline styles only, no Tailwind).
 * @param width     - Canvas width in pixels.
 * @param height    - Canvas height in pixels.
 * @param options   - Optional partial SatoriOptions to override defaults.
 *                    The `fonts` array from this argument is merged after the
 *                    default Korean font, so callers can add extra typefaces.
 * @returns         PNG image as a Node.js Buffer.
 */
export async function generateImage(
  element: ReactNode,
  width: number,
  height: number,
  options?: Partial<SatoriOptions>
): Promise<Buffer> {
  const koreanFontData = await loadKoreanFont();

  const defaultFont: SatoriOptions['fonts'][number] = {
    name: 'Noto Sans KR',
    data: koreanFontData,
    weight: 400,
    style: 'normal',
  };

  const extraFonts: SatoriOptions['fonts'] = options?.fonts ?? [];

  const satoriOptions: SatoriOptions = {
    ...options,
    width,
    height,
    fonts: [defaultFont, ...extraFonts],
  };

  const svg = await renderToSvg(element, satoriOptions);
  return svgToPng(svg, width, height);
}

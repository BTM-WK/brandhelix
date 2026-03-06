// Shortform Builder — Script + subtitle text + image sequence + thumbnail
// Server-side only. Uses the satori-pipeline to convert JSX templates to PNG buffers.
// 숏폼(틱톡/유튜브 Shorts) 썸네일 이미지를 Satori 기반으로 생성한다.

import { generateImage } from '@/lib/image/satori-pipeline';
import type { ShortformType } from '@/types/shortform';

// The actual JSX templates live in templates.tsx; this file owns the async
// image generation API that wraps them.
// Import for local use; re-exported at the bottom of this file.
import type { ShortformTemplateProps } from './templates';
import { renderShortformThumbnail } from './templates';

// ── Image dimensions ───────────────────────────────────────────────────────────

/** Shortform thumbnail: 9:16 ratio (세로형 풀스크린) */
const SHORTFORM_WIDTH = 1080;
const SHORTFORM_HEIGHT = 1920;

// ── Core builder ──────────────────────────────────────────────────────────────

/**
 * Generate a single shortform thumbnail image as a PNG Buffer.
 *
 * Renders the appropriate Satori template for the given shortform type,
 * then converts the SVG output to a 1080x1920 PNG via Sharp.
 *
 * @param type   - Shortform content type (e.g. 'hook_product').
 * @param props  - Template props including designTone, brandName, hookLine, etc.
 * @returns      PNG image as a Node.js Buffer (ready for R2 upload).
 *
 * @example
 * import { buildShortformThumbnail } from '@/engines/channel-builder/shortform-builder';
 *
 * const png = await buildShortformThumbnail('hook_product', {
 *   designTone:     'modern_minimal',
 *   brandName:      'BrandHelix',
 *   hookLine:       '이걸 모르면 손해!',
 *   shortformType:  'hook_product',
 *   productName:    'Glow Serum',
 * });
 */
export async function buildShortformThumbnail(
  type: ShortformType,
  props: ShortformTemplateProps
): Promise<Buffer> {
  const element = renderShortformThumbnail(type, props);
  return generateImage(element, SHORTFORM_WIDTH, SHORTFORM_HEIGHT);
}

// ── Re-exports ─────────────────────────────────────────────────────────────────
// Allow consumers to import the renderer and its props directly from this barrel.

export { renderShortformThumbnail };
export type { ShortformTemplateProps };

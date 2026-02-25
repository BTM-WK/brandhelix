// Instagram Builder — React component → Satori (SVG) → Sharp (PNG 1080×1350) → R2
// Server-side only. Uses the satori-pipeline to convert JSX templates to PNG buffers.

import { generateImage } from '@/lib/image/satori-pipeline';
import type { InstagramType } from '@/types/instagram';

// The actual JSX templates live in templates.tsx; this file owns the async
// image generation API that wraps them.
// Import for local use; re-exported at the bottom of this file.
import type { InstagramTemplateProps } from './templates';
import { renderInstagramTemplate } from './templates';

// ── Image dimensions ───────────────────────────────────────────────────────────

/** Instagram feed post: 4:5 ratio */
const INSTAGRAM_WIDTH = 1080;
const INSTAGRAM_HEIGHT = 1350;

// ── Core builders ─────────────────────────────────────────────────────────────

/**
 * Generate a single Instagram image as a PNG Buffer.
 *
 * Renders the appropriate Satori template for the given type, then converts
 * the SVG output to a 1080×1350 PNG via Sharp.
 *
 * @param type   - Instagram content type (e.g. 'hero_product').
 * @param props  - Template props including designTone, brandName, copy, etc.
 * @returns      PNG image as a Node.js Buffer (ready for R2 upload).
 *
 * @example
 * import { buildInstagramImage } from '@/engines/channel-builder/instagram-builder';
 *
 * const png = await buildInstagramImage('hero_product', {
 *   designTone: 'modern_minimal',
 *   brandName:  'BrandHelix',
 *   productName: 'Glow Serum',
 *   subtitle:    '피부 속부터 채워주는 세럼',
 * });
 */
export async function buildInstagramImage(
  type: InstagramType,
  props: InstagramTemplateProps
): Promise<Buffer> {
  const element = renderInstagramTemplate(type, props);
  return generateImage(element, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);
}

/**
 * Generate multiple Instagram images for a carousel post.
 *
 * Each element of `slides` becomes one PNG Buffer. The array index is used
 * to inject `slideNumber` (1-based) and `totalSlides` unless the caller has
 * already set them on each slide props object.
 *
 * @param type   - Instagram content type; should be a carousel type
 *                 (e.g. 'info_card_carousel', 'routine_guide', 'before_after').
 * @param slides - Array of per-slide props. Slide order matches array order.
 * @returns      Array of PNG Buffers in slide order.
 *
 * @example
 * import { buildInstagramCarousel } from '@/engines/channel-builder/instagram-builder';
 *
 * const buffers = await buildInstagramCarousel('info_card_carousel', [
 *   { designTone: 'natural_organic', brandName: 'Brand', title: '첫 번째 카드', bodyText: '...' },
 *   { designTone: 'natural_organic', brandName: 'Brand', title: '두 번째 카드', bodyText: '...' },
 *   { designTone: 'natural_organic', brandName: 'Brand', title: '세 번째 카드', bodyText: '...' },
 * ]);
 * // buffers.length === 3
 */
export async function buildInstagramCarousel(
  type: InstagramType,
  slides: InstagramTemplateProps[]
): Promise<Buffer[]> {
  if (slides.length === 0) {
    throw new Error('buildInstagramCarousel: slides array must not be empty');
  }

  const total = slides.length;

  // Generate all slides concurrently for efficiency
  const buffers = await Promise.all(
    slides.map((slideProps, index) => {
      // Inject slide position if the caller did not provide it
      const propsWithPosition: InstagramTemplateProps = {
        slideNumber: index + 1,
        totalSlides: total,
        ...slideProps,
      };

      return buildInstagramImage(type, propsWithPosition);
    })
  );

  return buffers;
}

// ── Re-exports ─────────────────────────────────────────────────────────────────
// Allow consumers to import the renderer and its props directly from this barrel.

export { renderInstagramTemplate };
export type { InstagramTemplateProps };

// POST /api/images/instagram — Instagram image generation API
// Supports single images and multi-slide carousels (1080×1350 PNG)

import { NextRequest, NextResponse } from 'next/server';
import {
  buildInstagramImage,
  buildInstagramCarousel,
} from '@/engines/channel-builder/instagram-builder';
import type { InstagramTemplateProps } from '@/engines/channel-builder/instagram-builder';
import { INSTAGRAM_TYPES } from '@/types/instagram';
import type { InstagramType } from '@/types/instagram';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Instagram feed image dimensions (4:5 ratio) */
const INSTAGRAM_WIDTH = 1080 as const;
const INSTAGRAM_HEIGHT = 1350 as const;

/** Types that produce multiple slides and use buildInstagramCarousel */
const CAROUSEL_TYPES: Set<InstagramType> = new Set([
  'info_card_carousel',
  'routine_guide',
  'before_after',
]);

/**
 * Default number of slides per carousel type when the caller does not
 * provide a slideCount. Chosen to match each type's typical use case.
 */
const DEFAULT_SLIDE_COUNTS: Record<string, number> = {
  info_card_carousel: 5,
  routine_guide: 4,
  before_after: 2,
};

// ── Valid InstagramType values (derived from the INSTAGRAM_TYPES registry) ────
const VALID_INSTAGRAM_TYPES = new Set<string>(INSTAGRAM_TYPES.map((t) => t.id));

// ── Request body shape ────────────────────────────────────────────────────────

/**
 * Flat content fields accepted by the API.
 * They map 1:1 onto InstagramTemplateProps (minus designTone/brandName).
 */
interface ContentFields {
  title?: string;
  subtitle?: string;
  bodyText?: string;
  productName?: string;
  steps?: string[];
  beforeText?: string;
  afterText?: string;
  eventTitle?: string;
  eventDate?: string;
  discount?: string;
}

interface InstagramImageRequestBody {
  /** Instagram content type (required) */
  type: InstagramType;
  /** Copy/text fields for the template (required) */
  content: ContentFields;
  /** Design tone id (default: 'modern_minimal') */
  designTone?: string;
  /** Brand name shown as a label on the image */
  brandName?: string;
  /**
   * Number of carousel slides to generate.
   * Ignored for single-image types (hero_product, brand_mood, event_promo).
   * Falls back to DEFAULT_SLIDE_COUNTS[type] when omitted.
   */
  slideCount?: number;
}

// ── Response item shape ───────────────────────────────────────────────────────

interface InstagramImageData {
  /** data:image/png;base64,... */
  imageBase64: string;
  width: typeof INSTAGRAM_WIDTH;
  height: typeof INSTAGRAM_HEIGHT;
  slideNumber: number;
}

// ── Helper: Buffer → data URI ─────────────────────────────────────────────────

function bufferToDataUri(buf: Buffer): string {
  return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
}

// ── Helper: sanitise a string field from the request body ─────────────────────

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ── POST handler ──────────────────────────────────────────────────────────────

/**
 * Generate one or more Instagram images and return them as base64 data URIs.
 *
 * Request body: InstagramImageRequestBody
 *
 * Success:
 *   { data: { images: InstagramImageData[], type, slideCount }, error: null }
 *
 * Errors (400 / 500):
 *   { data: null, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InstagramImageRequestBody;

    const {
      type,
      content,
      designTone = 'modern_minimal',
      brandName,
      slideCount: requestedSlideCount,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { data: null, error: 'type is required' },
        { status: 400 }
      );
    }

    if (!VALID_INSTAGRAM_TYPES.has(type)) {
      return NextResponse.json(
        {
          data: null,
          error: `type must be one of: ${[...VALID_INSTAGRAM_TYPES].join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return NextResponse.json(
        { data: null, error: 'content is required and must be an object' },
        { status: 400 }
      );
    }

    // ── Build base InstagramTemplateProps ─────────────────────────────────────
    // The builder expects flat props (not a nested content object), so we
    // spread content fields directly onto the props while sanitising each one.

    const baseProps: InstagramTemplateProps = {
      designTone,
      brandName: cleanString(brandName),
      title: cleanString(content.title),
      subtitle: cleanString(content.subtitle),
      bodyText: cleanString(content.bodyText),
      productName: cleanString(content.productName),
      steps: Array.isArray(content.steps)
        ? content.steps.filter((s): s is string => typeof s === 'string')
        : undefined,
      beforeText: cleanString(content.beforeText),
      afterText: cleanString(content.afterText),
      eventTitle: cleanString(content.eventTitle),
      eventDate: cleanString(content.eventDate),
      discount: cleanString(content.discount),
    };

    // ── Generate images ───────────────────────────────────────────────────────

    let images: InstagramImageData[];

    if (CAROUSEL_TYPES.has(type)) {
      // Determine how many slides to generate
      const finalSlideCount =
        typeof requestedSlideCount === 'number' && requestedSlideCount > 0
          ? requestedSlideCount
          : (DEFAULT_SLIDE_COUNTS[type] ?? 3);

      // Build a per-slide props array; slideNumber/totalSlides are injected by
      // buildInstagramCarousel automatically (caller props spread over them)
      const slides: InstagramTemplateProps[] = Array.from(
        { length: finalSlideCount },
        () => ({ ...baseProps })
      );

      const buffers = await buildInstagramCarousel(type, slides);

      images = buffers.map((buf, idx) => ({
        imageBase64: bufferToDataUri(buf),
        width: INSTAGRAM_WIDTH,
        height: INSTAGRAM_HEIGHT,
        slideNumber: idx + 1,
      }));
    } else {
      // Single-image types: hero_product, brand_mood, event_promo
      const buf = await buildInstagramImage(type, { ...baseProps, slideNumber: 1 });

      images = [
        {
          imageBase64: bufferToDataUri(buf),
          width: INSTAGRAM_WIDTH,
          height: INSTAGRAM_HEIGHT,
          slideNumber: 1,
        },
      ];
    }

    return NextResponse.json({
      data: {
        images,
        type,
        slideCount: images.length,
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}

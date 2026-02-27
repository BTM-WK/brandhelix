import { NextRequest, NextResponse } from 'next/server';
import { buildShortformThumbnail } from '@/engines/channel-builder/shortform-builder';
import type { ShortformTemplateProps } from '@/engines/channel-builder/shortform-builder';

// ── Request body shape ────────────────────────────────────────────────────────

interface ShortformThumbnailRequest {
  hookLine: string;
  shortformType: string;
  designTone?: string;
  brandName?: string;
  productName?: string;
  title?: string;
  subtitle?: string;
}

// ── Valid shortform type ids ──────────────────────────────────────────────────

const VALID_SHORTFORM_TYPES = new Set([
  'hook_product',
  'how_to_tutorial',
  'myth_buster',
  'before_after_reveal',
  'trend_challenge',
]);

// ── POST /api/images/shortform ──────────────────────────────────────────────

/**
 * Generate a 1080x1920 shortform thumbnail PNG (9:16 vertical).
 *
 * Request body (JSON):
 *   hookLine       {string}   -- required: main hook text (first 3 seconds)
 *   shortformType  {string}   -- required: one of the 5 shortform types
 *   designTone     {string?}  -- design tone id (default: 'modern_minimal')
 *   brandName      {string?}  -- optional brand name overlay
 *   productName    {string?}  -- optional product name
 *   title          {string?}  -- optional video title
 *   subtitle       {string?}  -- optional subtitle text
 *
 * Success response:
 *   { data: { image: string, width: 1080, height: 1920 }, error: null }
 *
 * Error response (400 / 500):
 *   { data: null, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ShortformThumbnailRequest;

    const {
      hookLine,
      shortformType,
      designTone = 'modern_minimal',
      brandName,
      productName,
      title,
      subtitle,
    } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!hookLine || typeof hookLine !== 'string' || hookLine.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'hookLine is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    if (!shortformType || typeof shortformType !== 'string' || shortformType.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'shortformType is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    if (!VALID_SHORTFORM_TYPES.has(shortformType.trim())) {
      return NextResponse.json(
        {
          data: null,
          error: `Invalid shortformType "${shortformType}". Must be one of: ${[...VALID_SHORTFORM_TYPES].join(', ')}`,
        },
        { status: 400 },
      );
    }

    // ── Build PNG via shortform builder (Satori + Sharp 1080×1920) ──────────
    const props: ShortformTemplateProps = {
      hookLine: hookLine.trim(),
      shortformType: shortformType.trim(),
      designTone,
      brandName: brandName?.trim() ?? 'Brand',
      productName: productName?.trim(),
      title: title?.trim(),
      subtitle: subtitle?.trim(),
    };

    const pngBuffer = await buildShortformThumbnail(
      shortformType.trim() as Parameters<typeof buildShortformThumbnail>[0],
      props
    );

    const base64 = pngBuffer.toString('base64');
    const image = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      data: {
        image,
        width: 1080,
        height: 1920,
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 },
    );
  }
}

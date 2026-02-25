import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/image/satori-pipeline';
import { renderBlogThumbnail } from '@/lib/image/blog-thumbnail';

// ── Request body shape ────────────────────────────────────────────────────────

interface ThumbnailRequestBody {
  title: string;
  blogType: string;
  brandName?: string;
  designTone?: string;
  keywords?: string[];
}

// ── POST /api/images/thumbnail ────────────────────────────────────────────────

/**
 * Generate a 1200×630 blog thumbnail PNG.
 *
 * Request body (JSON):
 *   title       {string}   — required: blog post title
 *   blogType    {string}   — required: e.g. 'seo_filler', 'science_series'
 *   brandName   {string?}  — optional brand name overlay (top-left)
 *   designTone  {string?}  — design tone id (default: 'modern_minimal')
 *   keywords    {string[]?}— optional keyword chip tags (max 4 shown)
 *
 * Success response:
 *   { data: { imageBase64: string, width: 1200, height: 630 }, error: null }
 *
 * Error response (400 / 500):
 *   { data: null, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ThumbnailRequestBody;

    const { title, blogType, brandName, designTone = 'modern_minimal', keywords } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!blogType || typeof blogType !== 'string' || blogType.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'blogType is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // ── Build JSX element via blog-thumbnail helper ───────────────────────────
    const element = renderBlogThumbnail({
      title: title.trim(),
      blogType: blogType.trim(),
      brandName: brandName?.trim(),
      designTone,
      keywords: Array.isArray(keywords) ? keywords : [],
    });

    // ── Render to PNG via Satori + Sharp pipeline ─────────────────────────────
    const pngBuffer = await generateImage(element, 1200, 630);

    // Convert Buffer / Uint8Array to base64 data URL.
    // Cast through unknown first because generateImage returns unknown until
    // the Satori pipeline is fully implemented (the type widens later).
    const base64 = Buffer.from(pngBuffer as unknown as Uint8Array).toString('base64');
    const imageBase64 = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      data: {
        imageBase64,
        width: 1200,
        height: 630,
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

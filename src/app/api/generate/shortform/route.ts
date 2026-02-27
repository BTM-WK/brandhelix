import { NextRequest, NextResponse } from 'next/server';
import { generateShortformContent } from '@/engines/content/generators';
import type {
  ShortformBrandContext,
  ShortformGenerationContext,
} from '@/engines/content/generators';
import type { ShortformType } from '@/types/shortform';

// ── Valid shortform types ────────────────────────────────────────────────────
const VALID_SHORTFORM_TYPES = [
  'hook_product',
  'how_to_tutorial',
  'myth_buster',
  'before_after_reveal',
  'trend_challenge',
] as const;

// ── Error response helper ────────────────────────────────────────────────────
function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ data: null, error: message }, { status });
}

// ── Request body interface ───────────────────────────────────────────────────
interface ShortformGenerateRequestBody {
  shortformType: ShortformType;
  productName?: string;
  keywords?: string[];
  copyStyle?: string;
  designTone?: string;
  additionalPrompt?: string;
  trendReference?: string;
  brandDNA?: {
    // Company Identity
    companyName?: string;
    industry?: string;
    mainProducts?: string[];
    // Brand Core
    brandName?: string;
    brandSlogan?: string;
    usp?: string;
    coreValues?: string[];
    // Target Audience
    primaryAge?: string;
    gender?: string;
    interests?: string[];
    painPoints?: string[];
    // Verbal Identity
    toneOfVoice?: string[];
    keyMessages?: string[];
    forbiddenWords?: string[];
    // Visual Identity / Style
    designTone?: string;
    copyStyle?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ShortformGenerateRequestBody;

    // shortformType 필수 검증
    if (!body.shortformType) {
      return errorResponse('shortformType is required');
    }

    // shortformType 유효성 검증
    if (
      !(VALID_SHORTFORM_TYPES as readonly string[]).includes(body.shortformType)
    ) {
      return errorResponse(
        `shortformType must be one of: ${VALID_SHORTFORM_TYPES.join(', ')}`
      );
    }

    // brandDNA에서 ShortformBrandContext 빌드
    const brandContext: ShortformBrandContext = {
      companyIdentity: {
        companyName: body.brandDNA?.companyName,
        industry: body.brandDNA?.industry,
        mainProducts: body.brandDNA?.mainProducts,
      },
      brandCore: {
        brandName: body.brandDNA?.brandName,
        brandSlogan: body.brandDNA?.brandSlogan,
        usp: body.brandDNA?.usp,
        coreValues: body.brandDNA?.coreValues,
      },
      targetAudience: {
        primaryAge: body.brandDNA?.primaryAge,
        gender: body.brandDNA?.gender,
        interests: body.brandDNA?.interests,
        painPoints: body.brandDNA?.painPoints,
      },
      verbalIdentity: {
        toneOfVoice: body.brandDNA?.toneOfVoice,
        keyMessages: body.brandDNA?.keyMessages,
        forbiddenWords: body.brandDNA?.forbiddenWords,
      },
      visualIdentity: {
        designTone: body.brandDNA?.designTone,
      },
    };

    // copyStyle 우선순위: 요청 바디 → brandDNA.copyStyle → 'burnett'
    const copyStyle =
      body.copyStyle ?? body.brandDNA?.copyStyle ?? 'burnett';

    // designTone 우선순위: 요청 바디 → brandDNA.designTone → 'modern_minimal'
    const designTone =
      body.designTone ?? body.brandDNA?.designTone ?? 'modern_minimal';

    // ShortformGenerationContext 빌드
    const context: ShortformGenerationContext = {
      brandContext,
      shortformType: body.shortformType,
      productName: body.productName,
      keywords: body.keywords ?? [],
      copyStyle,
      designTone,
      additionalPrompt: body.additionalPrompt,
      trendReference: body.trendReference,
    };

    const result = await generateShortformContent({ context });

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        ...result.data,
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}

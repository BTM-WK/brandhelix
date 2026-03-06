import { NextRequest, NextResponse } from 'next/server';
import { buildSite } from '@/engines/channel-builder/site-builder';
import type { SiteBrandContext, BuildSiteParams } from '@/engines/channel-builder/site-builder';
import type { SiteTemplateType } from '@/types/site';

// ── Valid template types ────────────────────────────────────────────────────
const VALID_TEMPLATE_TYPES: SiteTemplateType[] = [
  'product_landing',
  'brand_story_page',
  'service_showcase',
  'event_promotion',
];

// ── Error response helper ───────────────────────────────────────────────────
function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ data: null, error: message }, { status });
}

// ── Request body interface ──────────────────────────────────────────────────
interface SiteGenerateRequestBody {
  templateType: string;
  productName?: string;
  copyStyle?: string;
  designTone?: string;
  additionalPrompt?: string;
  brandDNA?: {
    // Company Identity
    companyName?: string;
    industry?: string;
    mainProducts?: string[];
    missionStatement?: string;
    // Brand Core
    brandName?: string;
    brandSlogan?: string;
    brandStory?: string;
    usp?: string;
    coreValues?: string[];
    // Target Audience
    primaryAge?: string;
    painPoints?: string[];
    buyingMotivation?: string[];
    // Verbal Identity
    toneOfVoice?: string[];
    keyMessages?: string[];
    forbiddenWords?: string[];
    // Visual Identity
    designTone?: string;
    // Competitive
    differentiators?: string[];
    // Creative Style
    copyStyle?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SiteGenerateRequestBody;

    // templateType 필수 검증
    if (!body.templateType) {
      return errorResponse('templateType is required');
    }

    // templateType 유효성 검증
    if (!(VALID_TEMPLATE_TYPES as string[]).includes(body.templateType)) {
      return errorResponse(
        `templateType must be one of: ${VALID_TEMPLATE_TYPES.join(', ')}`
      );
    }

    // brandDNA에서 SiteBrandContext 빌드
    const brandContext: SiteBrandContext = {
      companyIdentity: {
        companyName: body.brandDNA?.companyName,
        industry: body.brandDNA?.industry,
        mainProducts: body.brandDNA?.mainProducts,
        missionStatement: body.brandDNA?.missionStatement,
      },
      brandCore: {
        brandName: body.brandDNA?.brandName,
        brandSlogan: body.brandDNA?.brandSlogan,
        brandStory: body.brandDNA?.brandStory,
        usp: body.brandDNA?.usp,
        coreValues: body.brandDNA?.coreValues,
      },
      targetAudience: {
        primaryAge: body.brandDNA?.primaryAge,
        painPoints: body.brandDNA?.painPoints,
        buyingMotivation: body.brandDNA?.buyingMotivation,
      },
      verbalIdentity: {
        toneOfVoice: body.brandDNA?.toneOfVoice,
        keyMessages: body.brandDNA?.keyMessages,
        forbiddenWords: body.brandDNA?.forbiddenWords,
      },
      visualIdentity: {
        designTone: body.brandDNA?.designTone,
      },
      competitivePosition: {
        differentiators: body.brandDNA?.differentiators,
      },
    };

    // copyStyle 우선순위: 요청 바디 → brandDNA.copyStyle → 'burnett'
    const copyStyle =
      body.copyStyle ?? body.brandDNA?.copyStyle ?? 'burnett';

    // designTone 우선순위: 요청 바디 → brandDNA.designTone → 'modern_minimal'
    const designTone =
      body.designTone ?? body.brandDNA?.designTone ?? 'modern_minimal';

    // BuildSiteParams 빌드
    const params: BuildSiteParams = {
      templateType: body.templateType as SiteTemplateType,
      brandContext,
      productName: body.productName,
      copyStyle,
      designTone,
      additionalPrompt: body.additionalPrompt,
    };

    const result = await buildSite(params);

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

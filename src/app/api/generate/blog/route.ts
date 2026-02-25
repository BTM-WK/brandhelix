import { NextRequest, NextResponse } from 'next/server';
import { generateBlogContent } from '@/engines/content/generators/blog-generator';
import type { BlogGenerationContext } from '@/engines/content/generators/blog-generator';
import type { BrandDNA } from '@/types/brand-dna';
import type { BlogType } from '@/types/blog';

// Valid blog types — kept in sync with BlogType union in @/types/blog
const VALID_BLOG_TYPES: BlogType[] = [
  'seo_filler',
  'science_series',
  'lifestyle_empathy',
  'comparison_guide',
  'brand_story',
];

interface BlogGenerateRequestBody {
  brandDNA: BrandDNA;
  blogType: BlogType;
  keywords?: string[];
  productName?: string;
  copyStyle?: string;
  designTone?: string;
  seriesNumber?: number;
  seriesTitle?: string;
  competitors?: Array<{ name: string; websiteUrl?: string; strengths?: string[]; weaknesses?: string[] }>;
  additionalPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BlogGenerateRequestBody;

    const {
      brandDNA,
      blogType,
      keywords,
      productName,
      seriesNumber,
      seriesTitle,
      competitors,
      additionalPrompt,
    } = body;

    // Validate required field: brandDNA
    if (!brandDNA?.layers) {
      return NextResponse.json(
        {
          data: null,
          error: 'brandDNA with layers property is required',
        },
        { status: 400 }
      );
    }

    // Validate required field: blogType
    if (!blogType) {
      return NextResponse.json(
        {
          data: null,
          error: 'blogType is required',
        },
        { status: 400 }
      );
    }

    if (!VALID_BLOG_TYPES.includes(blogType)) {
      return NextResponse.json(
        {
          data: null,
          error: `blogType must be one of: ${VALID_BLOG_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Resolve copyStyle with fallback chain:
    // request body → brandDNA.layers.creativeStyle.copyStyle → 'burnett'
    const copyStyle =
      body.copyStyle ??
      brandDNA.layers.creativeStyle?.copyStyle ??
      'burnett';

    // Resolve designTone with fallback chain:
    // request body → brandDNA.layers.creativeStyle.designTone → 'modern_minimal'
    const designTone =
      body.designTone ??
      brandDNA.layers.creativeStyle?.designTone ??
      'modern_minimal';

    // Build BlogGenerationContext from the flat brandDNA structure
    const context: BlogGenerationContext = {
      brandContext: {
        companyIdentity: brandDNA.layers.companyIdentity
          ? {
              companyName: brandDNA.layers.companyIdentity.companyName,
              industry: brandDNA.layers.companyIdentity.industry,
              mainProducts: brandDNA.layers.companyIdentity.mainProducts,
              missionStatement: brandDNA.layers.companyIdentity.missionStatement,
            }
          : undefined,
        brandCore: brandDNA.layers.brandCore
          ? {
              brandName: brandDNA.layers.brandCore.brandName,
              brandSlogan: brandDNA.layers.brandCore.brandSlogan,
              brandStory: brandDNA.layers.brandCore.brandStory,
              coreValues: brandDNA.layers.brandCore.coreValues,
              usp: brandDNA.layers.brandCore.usp,
            }
          : undefined,
        targetAudience: brandDNA.layers.targetAudience
          ? {
              primaryAge: brandDNA.layers.targetAudience.primaryAge,
              gender: brandDNA.layers.targetAudience.gender,
              interests: brandDNA.layers.targetAudience.interests,
              painPoints: brandDNA.layers.targetAudience.painPoints,
              buyingMotivation: brandDNA.layers.targetAudience.buyingMotivation,
            }
          : undefined,
        verbalIdentity: brandDNA.layers.verbalIdentity
          ? {
              toneOfVoice: brandDNA.layers.verbalIdentity.toneOfVoice,
              keyMessages: brandDNA.layers.verbalIdentity.keyMessages,
              forbiddenWords: brandDNA.layers.verbalIdentity.forbiddenWords,
            }
          : undefined,
        competitivePosition: brandDNA.layers.competitivePosition
          ? {
              directCompetitors: brandDNA.layers.competitivePosition.directCompetitors,
              differentiators: brandDNA.layers.competitivePosition.differentiators,
              marketPosition: brandDNA.layers.competitivePosition.marketPosition,
            }
          : undefined,
      },
      keywords: keywords ?? [],
      productName,
      seriesNumber,
      seriesTitle,
      competitors,
      additionalPrompt,
    };

    const result = await generateBlogContent({
      blogType,
      context,
      copyStyle,
      designTone,
    });

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        ...result.data,
        projectId: brandDNA.projectId,
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

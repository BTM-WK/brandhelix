import { NextRequest, NextResponse } from 'next/server';
import { generateInstagramCaption } from '@/engines/content/generators/instagram-generator';
import type { InstagramCaptionContext } from '@/engines/content/generators/instagram-generator';
import type { BrandDNA } from '@/types/brand-dna';

interface InstagramGenerateRequestBody {
  brandDNA: BrandDNA;
  postType: string;
  productName?: string;
  keywords?: string[];
  copyStyle?: string;
  additionalPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InstagramGenerateRequestBody;

    const {
      brandDNA,
      postType,
      productName,
      keywords,
      additionalPrompt,
    } = body;

    // brandDNA.layers 필수 검증
    if (!brandDNA?.layers) {
      return NextResponse.json(
        {
          data: null,
          error: 'brandDNA에 layers 속성이 필요합니다',
        },
        { status: 400 }
      );
    }

    // postType 필수 검증
    if (!postType) {
      return NextResponse.json(
        {
          data: null,
          error: 'postType은 필수 항목입니다',
        },
        { status: 400 }
      );
    }

    // copyStyle 우선순위: 요청 바디 → brandDNA.layers.creativeStyle.copyStyle → 'burnett'
    const copyStyle =
      body.copyStyle ??
      brandDNA.layers.creativeStyle?.copyStyle ??
      'burnett';

    // brandDNA layers에서 InstagramCaptionContext 빌드
    const context: InstagramCaptionContext = {
      brandContext: {
        companyName: brandDNA.layers.companyIdentity?.companyName,
        brandName: brandDNA.layers.brandCore?.brandName,
        brandSlogan: brandDNA.layers.brandCore?.brandSlogan,
        industry: brandDNA.layers.companyIdentity?.industry,
        toneOfVoice: brandDNA.layers.verbalIdentity?.toneOfVoice,
        keyMessages: brandDNA.layers.verbalIdentity?.keyMessages,
        usp: brandDNA.layers.brandCore?.usp,
        targetAge: brandDNA.layers.targetAudience?.primaryAge,
        targetGender: brandDNA.layers.targetAudience?.gender,
      },
      postType,
      productName,
      keywords,
      additionalPrompt,
    };

    const result = await generateInstagramCaption(context, copyStyle);

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

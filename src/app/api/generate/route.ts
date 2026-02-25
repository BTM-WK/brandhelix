import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/claude';
import type { BrandDNA } from '@/types/brand-dna';
import type { GenerateContentInput } from '@/types/content';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandDNA, input } = body as {
      brandDNA: BrandDNA;
      input: GenerateContentInput;
    };

    // Validation
    if (!brandDNA?.layers || !input?.projectId || !input?.channel || !input?.contentType) {
      return NextResponse.json(
        { data: null, error: 'brandDNA, input.projectId, input.channel, and input.contentType are required' },
        { status: 400 }
      );
    }

    // Generate content via 2-phase AI
    const result = await generateContent(brandDNA, input);
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: 500 });
    }

    // MVP: Return generated content directly. Later: save to generated_contents table
    return NextResponse.json({
      data: {
        ...result.data,
        projectId: input.projectId,
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { crawlWebsite } from '@/lib/crawler';
import { analyzeBrandDNA } from '@/lib/claude';
import type { BrandDNALayers } from '@/types/brand-dna';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userInput, websiteUrl } = body as {
      projectId: string;
      userInput: Partial<BrandDNALayers>;
      websiteUrl?: string;
    };

    if (!projectId) {
      return NextResponse.json({ data: null, error: 'projectId is required' }, { status: 400 });
    }

    // Step 1: Crawl website if URL provided
    let crawlData = null;
    if (websiteUrl) {
      const crawlResult = await crawlWebsite(websiteUrl);
      if (crawlResult.error) {
        // Non-blocking: log warning but continue with analysis
        console.warn('[Crawl Warning]', crawlResult.error);
      } else {
        crawlData = crawlResult.data;
      }
    }

    // Step 2: Analyze with Claude AI
    const analysisResult = await analyzeBrandDNA(userInput || {}, crawlData);
    if (analysisResult.error) {
      return NextResponse.json({ data: null, error: analysisResult.error }, { status: 500 });
    }

    // Step 3: Return result
    // MVP: Return analysis directly. Later: save to Supabase brand_dna table
    return NextResponse.json({
      data: {
        projectId,
        layers: analysisResult.data,
        crawlData,
        completenessScore: 100, // AI completed all layers
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

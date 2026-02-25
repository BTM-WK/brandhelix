// Claude API wrapper — analyzeBrandDNA + 2-phase generateContent

import Anthropic from '@anthropic-ai/sdk';
import type { BrandDNALayers, BrandDNA } from '@/types/brand-dna';
import type { GeneratedContent, GenerateContentInput } from '@/types/content';
import type { CrawlData } from '@/lib/crawler';
import { calculateCost, trackTokenUsage } from '@/lib/claude/token-tracker';

// ── Model constants ────────────────────────────────────────────────────────────
const MODELS = {
  SONNET: 'claude-sonnet-4-5-20250514',
  HAIKU: 'claude-haiku-4-5-20241022',
} as const;

// ── Singleton client ───────────────────────────────────────────────────────────
let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return client;
}

// ── JSON extraction helper ─────────────────────────────────────────────────────
// Handles three common Claude response shapes:
//   1. Raw JSON string
//   2. ```json ... ``` fenced block
//   3. First { ... } object found in prose
function extractJSON(text: string): Record<string, unknown> | null {
  // 1. Try direct parse first (Claude sometimes returns clean JSON)
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not raw JSON — fall through
  }

  // 2. Look for ```json ... ``` fenced blocks
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      const parsed = JSON.parse(fencedMatch[1].trim());
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Malformed JSON inside fence — fall through
    }
  }

  // 3. Find the outermost { ... } object in the text
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Could not parse extracted fragment
    }
  }

  return null;
}

// ── analyzeBrandDNA ────────────────────────────────────────────────────────────
export async function analyzeBrandDNA(
  userInput: Partial<BrandDNALayers>,
  crawlData?: CrawlData | null,
  // userId/projectId forwarded to token tracker (optional for standalone calls)
  meta?: { userId: string; projectId: string }
): Promise<{ data: BrandDNALayers | null; error: string | null }> {
  const systemPrompt = `너는 브랜드 마케팅 전문가이다. 주어진 정보를 분석하여 8-Layer Brand DNA 프로필을 JSON으로 완성하라.

반드시 아래 8개 레이어를 모두 포함한 유효한 JSON 객체를 반환하라. JSON 외의 텍스트를 포함하지 마라.

레이어 가이드:
1. companyIdentity — 회사명, 업종, 주요 제품/서비스, 비즈니스 모델, 미션
2. brandCore — 브랜드명, 슬로건, 브랜드 스토리, 핵심 가치, 브랜드 퍼스낼리티, USP
3. targetAudience — 주요 연령대, 성별, 지역, 소득 수준, 관심사, 페인포인트, 구매 동기
4. visualIdentity — 주요 색상(hex), 보조 색상, 폰트 스타일, 이미지 스타일, 디자인 톤
5. verbalIdentity — 브랜드 보이스/톤, 작성 스타일, 핵심 메시지, 금기 단어, 카피 스타일, 해시태그
6. competitivePosition — 직접 경쟁사, 차별화 요소, 시장 포지션
7. channelStrategy — 주력 채널, 채널별 목표 및 우선순위, 발행 빈도
8. creativeStyle — 카피 스타일(8가지 중 하나), 디자인 톤(6가지 중 하나), 무드 키워드

카피 스타일 옵션: ogilvy, burnett, bernbach, clow, lee_jeseok, brunch_essay, kurly, editorial
디자인 톤 옵션: modern_minimal, natural_organic, clinical_science, premium_luxury, friendly_casual, bold_energetic

주어진 정보가 부족한 레이어는 합리적으로 추론하여 채워라.`;

  const userMessage = JSON.stringify(
    {
      userInput,
      crawlData: crawlData ?? null,
    },
    null,
    2
  );

  try {
    const claude = getClaudeClient();

    const response = await claude.messages.create({
      model: MODELS.SONNET,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Track token usage
    const usage = response.usage;
    const tokensIn = usage.input_tokens;
    const tokensOut = usage.output_tokens;
    const cost = calculateCost(MODELS.SONNET, tokensIn, tokensOut);

    if (meta) {
      await trackTokenUsage(meta.userId, meta.projectId, {
        model: MODELS.SONNET,
        tokensIn,
        tokensOut,
        cost,
      });
    }

    // Extract text from the response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { data: null, error: 'Claude returned no text content' };
    }

    const parsed = extractJSON(textBlock.text);
    if (!parsed) {
      return {
        data: null,
        error: 'Failed to extract valid JSON from Claude response',
      };
    }

    return { data: parsed as BrandDNALayers, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `analyzeBrandDNA failed: ${message}` };
  }
}

// ── generateContent ────────────────────────────────────────────────────────────
export async function generateContent(
  brandDNA: BrandDNA,
  input: GenerateContentInput,
  meta?: { userId: string; projectId: string }
): Promise<{ data: Partial<GeneratedContent> | null; error: string | null }> {
  const { channel, contentType, copyStyle, designTone, keywords, productName, additionalPrompt } =
    input;

  // Select relevant DNA layers per channel to keep prompts focused
  const relevantLayers = buildRelevantLayers(brandDNA.layers, channel);

  // ── Phase 1: Haiku draft ─────────────────────────────────────────────────
  const phase1System = `너는 ${channel} 콘텐츠 전문 작가이다. 브랜드 DNA를 기반으로 ${contentType} 초안을 작성하라.

카피 스타일: ${copyStyle ?? relevantLayers.creativeStyle?.copyStyle ?? 'burnett'}
디자인 톤: ${designTone ?? relevantLayers.visualIdentity?.designTone ?? 'modern_minimal'}

아래 JSON 형식으로만 응답하라:
{
  "title": "콘텐츠 제목",
  "body": {
    "markdown": "본문 (마크다운)",
    "html": "본문 (HTML)"
  }
}`;

  const phase1User = JSON.stringify(
    {
      brandDNAContext: relevantLayers,
      task: {
        channel,
        contentType,
        keywords: keywords ?? [],
        productName: productName ?? null,
        additionalPrompt: additionalPrompt ?? null,
      },
    },
    null,
    2
  );

  let phase1Title = '';
  let phase1Body = '';
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  try {
    const claude = getClaudeClient();

    const phase1Response = await claude.messages.create({
      model: MODELS.HAIKU,
      max_tokens: 2000,
      system: phase1System,
      messages: [{ role: 'user', content: phase1User }],
    });

    const p1Usage = phase1Response.usage;
    totalTokensIn += p1Usage.input_tokens;
    totalTokensOut += p1Usage.output_tokens;

    if (meta) {
      await trackTokenUsage(meta.userId, meta.projectId, {
        model: MODELS.HAIKU,
        tokensIn: p1Usage.input_tokens,
        tokensOut: p1Usage.output_tokens,
        cost: calculateCost(MODELS.HAIKU, p1Usage.input_tokens, p1Usage.output_tokens),
      });
    }

    const p1TextBlock = phase1Response.content.find((b) => b.type === 'text');
    if (!p1TextBlock || p1TextBlock.type !== 'text') {
      return { data: null, error: 'Phase 1 (Haiku) returned no text content' };
    }

    const p1JSON = extractJSON(p1TextBlock.text);
    phase1Title = (p1JSON?.title as string) ?? '';
    const p1Body = p1JSON?.body as Record<string, string> | undefined;
    phase1Body = p1Body?.markdown ?? p1TextBlock.text;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `generateContent Phase 1 failed: ${message}` };
  }

  // ── Phase 2: Sonnet refinement ───────────────────────────────────────────
  const phase2System = `너는 콘텐츠 품질 전문가이다. 초안을 브랜드 톤에 맞게 다듬고 품질을 높여라.

브랜드 카피 스타일: ${copyStyle ?? relevantLayers.creativeStyle?.copyStyle ?? 'burnett'}
디자인 톤: ${designTone ?? relevantLayers.visualIdentity?.designTone ?? 'modern_minimal'}

아래 JSON 형식으로만 응답하라:
{
  "title": "최종 제목",
  "body": {
    "markdown": "최종 본문 (마크다운)",
    "html": "최종 본문 (HTML)"
  }
}`;

  const phase2User = JSON.stringify(
    {
      draft: { title: phase1Title, body: phase1Body },
      brandDNAContext: relevantLayers,
      refinementGoals: [
        '브랜드 톤앤보이스 일관성 강화',
        '금기어 제거',
        'CTA 포함 여부 확인',
        '키워드 자연스럽게 삽입',
        '문장 가독성 향상',
      ],
    },
    null,
    2
  );

  try {
    const claude = getClaudeClient();

    const phase2Response = await claude.messages.create({
      model: MODELS.SONNET,
      max_tokens: 3000,
      system: phase2System,
      messages: [{ role: 'user', content: phase2User }],
    });

    const p2Usage = phase2Response.usage;
    totalTokensIn += p2Usage.input_tokens;
    totalTokensOut += p2Usage.output_tokens;

    if (meta) {
      await trackTokenUsage(meta.userId, meta.projectId, {
        model: MODELS.SONNET,
        tokensIn: p2Usage.input_tokens,
        tokensOut: p2Usage.output_tokens,
        cost: calculateCost(MODELS.SONNET, p2Usage.input_tokens, p2Usage.output_tokens),
      });
    }

    const p2TextBlock = phase2Response.content.find((b) => b.type === 'text');
    if (!p2TextBlock || p2TextBlock.type !== 'text') {
      return { data: null, error: 'Phase 2 (Sonnet) returned no text content' };
    }

    const p2JSON = extractJSON(p2TextBlock.text);
    const finalTitle = (p2JSON?.title as string | undefined) ?? phase1Title;
    const p2Body = p2JSON?.body as Record<string, string> | undefined;
    const finalMarkdown = p2Body?.markdown ?? p2TextBlock.text;
    const finalHtml = p2Body?.html ?? `<p>${finalMarkdown}</p>`;

    // Sum costs for each call using each model's own pricing
    // Phase 1 tokens = totalTokensIn/Out before p2Usage was added
    const p1TokensIn = totalTokensIn - p2Usage.input_tokens;
    const p1TokensOut = totalTokensOut - p2Usage.output_tokens;
    const finalCost =
      calculateCost(MODELS.HAIKU, p1TokensIn, p1TokensOut) +
      calculateCost(MODELS.SONNET, p2Usage.input_tokens, p2Usage.output_tokens);

    const data: Partial<GeneratedContent> = {
      channel,
      contentType,
      title: finalTitle || undefined,
      body: { markdown: finalMarkdown, html: finalHtml },
      copyStyle: copyStyle ?? relevantLayers.creativeStyle?.copyStyle,
      designTone: designTone ?? relevantLayers.visualIdentity?.designTone,
      tokensUsed: totalTokensIn + totalTokensOut,
      generationCost: finalCost,
    };

    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `generateContent Phase 2 failed: ${message}` };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Return only the Brand DNA layers most relevant to the given channel.
 * Keeping context focused reduces token usage and improves output quality.
 */
function buildRelevantLayers(
  layers: BrandDNA['layers'],
  channel: string
): Partial<BrandDNA['layers']> {
  // brandCore + targetAudience + verbalIdentity are relevant for all channels
  const base: Partial<BrandDNA['layers']> = {
    brandCore: layers.brandCore,
    targetAudience: layers.targetAudience,
    verbalIdentity: layers.verbalIdentity,
    creativeStyle: layers.creativeStyle,
  };

  switch (channel) {
    case 'site':
      return {
        ...base,
        companyIdentity: layers.companyIdentity,
        visualIdentity: layers.visualIdentity,
        competitivePosition: layers.competitivePosition,
      };
    case 'blog':
      return {
        ...base,
        companyIdentity: layers.companyIdentity,
        competitivePosition: layers.competitivePosition,
      };
    case 'instagram':
      return {
        ...base,
        visualIdentity: layers.visualIdentity,
      };
    case 'shortform':
      return {
        ...base,
        visualIdentity: layers.visualIdentity,
        channelStrategy: layers.channelStrategy,
      };
    default:
      return { ...base, ...layers };
  }
}

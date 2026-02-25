// Instagram caption and hashtag generator — Engine 2, instagram channel
// Single-phase generation with Haiku (captions are short, single-pass is sufficient)

import Anthropic from '@anthropic-ai/sdk';
import { calculateCost } from '@/lib/claude/token-tracker';

// ── Model constant ─────────────────────────────────────────────────────────────
const HAIKU = 'claude-haiku-4-5-20241022';

// ── Copy style tone descriptors (Korean — mirrors blog-generator mapping) ──────
const COPY_STYLE_INSTRUCTIONS: Record<string, string> = {
  ogilvy:
    '데이비드 오길비 스타일: 구체적인 숫자와 팩트로 독자를 설득하라. 헤드라인에 핵심 이점을 담고, 통계와 비교 수치를 적극 활용하라.',
  burnett:
    '레오 버넷 스타일: 일상의 따뜻한 이야기로 마음을 움직여라. 진솔하고 인간적인 톤, 영웅적 이미지를 자연스럽게 녹여라.',
  bernbach:
    '빌 번바크 스타일: 독자의 예상을 비틀어라. 짧고 강한 문장으로 임팩트를 남기고, 역설적 표현으로 불필요한 미사여구를 걷어내라.',
  clow:
    '리 클로우 스타일: 선언적이고 대담한 매니페스토 톤. 브랜드의 존재 이유를 강하게 주장하고, 독자에게 영감과 소속감을 동시에 선사하라.',
  lee_jeseok:
    '이제석 스타일: 한 줄의 카피가 전부를 담아야 한다. 군더더기 없이 핵심만. 시각적 장면을 단어로 그려내라.',
  brunch_essay:
    '브런치 에세이 스타일: 짧은 문장과 긴 문장을 리드미컬하게 교차하라. 시적인 묘사와 사색적인 어조, 독자가 한 줄씩 음미할 수 있게 써라.',
  kurly:
    '마켓컬리 스타일: 오감을 자극하는 감각적 디테일로 묘사하라. 원산지, 생산자, 재료의 이야기를 구체적으로 전달하라.',
  editorial:
    '에디토리얼 스타일: 쿨하고 절제된 톤. 영어 단어를 자연스럽게 믹스하라. 형용사를 최소화하고 명사와 동사로 밀도 있게 써라.',
};

// ── Context and result types ──────────────────────────────────────────────────

/**
 * Brand DNA subset required to generate an Instagram caption.
 * Only the layers relevant to copywriting are included to keep the prompt tight.
 */
export interface InstagramCaptionContext {
  brandContext: {
    companyName?: string;
    brandName?: string;
    brandSlogan?: string;
    industry?: string;
    toneOfVoice?: string[];
    keyMessages?: string[];
    usp?: string;
    targetAge?: string;
    targetGender?: string;
  };
  postType: string;          // InstagramType id (e.g. 'hero_product')
  productName?: string;
  keywords?: string[];
  additionalPrompt?: string;
}

/**
 * Successful caption generation payload.
 */
export interface InstagramCaptionData {
  /** Full caption: hook → body → CTA (max 2200 chars) */
  caption: string;
  /** 15 hashtags: 5 large (100만+) + 5 medium (10만~100만) + 5 niche (1만~10만) */
  hashtags: string[];
  /** First line of caption — the attention-grabbing hook */
  hookLine: string;
  /** Final call-to-action line */
  cta: string;
  tokensUsed: number;
  generationCost: number;
}

export interface InstagramCaptionResult {
  data: InstagramCaptionData | null;
  error: string | null;
}

// ── JSON extraction helper ─────────────────────────────────────────────────────
// Same 3-step pattern used across the codebase:
//   1. Direct JSON.parse
//   2. ```json ... ``` fence
//   3. Outermost { ... } object
function extractJSON(text: string): Record<string, unknown> | null {
  // 1. Direct parse
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not raw JSON — fall through
  }

  // 2. Fenced code block
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

  // 3. Outermost { ... }
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

// ── System prompt builder ──────────────────────────────────────────────────────

/**
 * Build the Korean system prompt for the Haiku caption generation call.
 */
function buildSystemPrompt(copyStyle?: string): string {
  const styleInstruction =
    (copyStyle && COPY_STYLE_INSTRUCTIONS[copyStyle]) ??
    COPY_STYLE_INSTRUCTIONS['burnett'];

  return `너는 BrandHelix의 인스타그램 마케팅 전문 카피라이터이다.
브랜드 DNA를 기반으로 인스타그램 피드 게시물의 캡션과 해시태그를 작성하는 것이 임무이다.

## 카피 스타일 지침 (최우선 적용)
${styleInstruction}

## 캡션 구조 (반드시 순서대로 작성)

### 1. 훅 (첫 줄) — hookLine
- 스크롤을 멈추게 하는 강렬한 첫 문장
- 유형: 감정적 공감 / 날카로운 질문 / 놀라운 사실 / 강렬한 선언
- 이모지 1~2개 활용 가능
- 30자 이내로 간결하게

### 2. 본문 — body
- 3~5줄 구성, 각 줄은 짧고 명확하게
- 줄바꿈으로 가독성 확보 (인스타그램 줄바꿈 특성 반영)
- 브랜드 톤앤보이스를 일관되게 유지
- 제품/서비스의 핵심 가치를 자연스럽게 녹여라
- 독자의 감정 또는 욕구를 자극하는 표현 포함

### 3. CTA (행동 유도) — cta
- 댓글 유도 / DM 유도 / 링크인바이오 클릭 유도 중 하나 선택
- 브랜드 톤에 맞는 자연스러운 표현으로 작성
- 이모지 1개 활용 가능

## 캡션 전체 길이
- 최대 2200자 이내 (인스타그램 제한)
- 권장: 300~500자 (훅 + 본문 + CTA, 해시태그 제외)

## 해시태그 규칙 (총 15개 필수)
- 대형 해시태그 5개: 게시물 100만+ (예: #뷰티, #스킨케어, #일상)
- 중형 해시태그 5개: 게시물 10만~100만 (예: #데일리스킨케어, #피부관리)
- 니치 해시태그 5개: 게시물 1만~10만 (예: #브랜드명스킨케어, #특정성분효과)
- 브랜드 고유 해시태그 1개 포함 (니치 또는 중형에 포함)
- # 기호 포함하여 반환

## 금기 사항
- "안녕하세요, [브랜드]입니다" 형식의 시작
- 과장 광고 문구 (혁명적, 전례 없는, 최강의)
- 근거 없는 효능 주장
- 5개 이상 글머리 기호 나열

## 응답 형식 (JSON만 반환, 다른 텍스트 없음)
{
  "caption": "훅 + 본문 + CTA를 포함한 완성된 캡션 (해시태그 제외)",
  "hashtags": ["#해시태그1", "#해시태그2", ...],
  "hookLine": "캡션의 첫 줄 (훅 문구만)",
  "cta": "CTA 문구만 단독으로"
}`;
}

// ── User prompt builder ────────────────────────────────────────────────────────

/**
 * Build the user-turn message with brand context and task details.
 */
function buildUserPrompt(context: InstagramCaptionContext): string {
  const { brandContext, postType, productName, keywords, additionalPrompt } = context;

  const userMessage = {
    task: {
      channel: 'instagram',
      postType,
      productName: productName ?? null,
      targetKeywords: keywords ?? [],
    },
    brandDNAContext: {
      companyName: brandContext.companyName ?? null,
      brandName: brandContext.brandName ?? null,
      brandSlogan: brandContext.brandSlogan ?? null,
      industry: brandContext.industry ?? null,
      toneOfVoice: brandContext.toneOfVoice ?? [],
      keyMessages: brandContext.keyMessages ?? [],
      usp: brandContext.usp ?? null,
      targetAudience: {
        age: brandContext.targetAge ?? null,
        gender: brandContext.targetGender ?? null,
      },
    },
    additionalInstructions: additionalPrompt ?? null,
  };

  return JSON.stringify(userMessage, null, 2);
}

// ── Main generation function ───────────────────────────────────────────────────

/**
 * Generate an Instagram caption and hashtag set for a given post type and brand context.
 *
 * Uses a single Claude Haiku call (captions are short and do not require 2-phase refinement).
 *
 * @param context    - Brand context and post-specific details.
 * @param copyStyle  - Optional copy style ID (e.g. 'ogilvy', 'burnett').
 *                     Defaults to 'burnett' if omitted or unrecognised.
 *
 * @returns `{ data: InstagramCaptionData, error: null }` on success,
 *          or `{ data: null, error: string }` on failure.
 */
export async function generateInstagramCaption(
  context: InstagramCaptionContext,
  copyStyle?: string
): Promise<InstagramCaptionResult> {
  const systemPrompt = buildSystemPrompt(copyStyle);
  const userPrompt = buildUserPrompt(context);

  try {
    // Instantiate the Anthropic client directly (no singleton needed for generators)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const response = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Token tracking
    const usage = response.usage;
    const tokensIn = usage.input_tokens;
    const tokensOut = usage.output_tokens;

    // Calculate cost using Haiku pricing
    const generationCost = calculateCost(HAIKU, tokensIn, tokensOut);
    const tokensUsed = tokensIn + tokensOut;

    // Extract text block
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { data: null, error: 'generateInstagramCaption: Claude returned no text content' };
    }

    // Parse JSON response
    const parsed = extractJSON(textBlock.text);
    if (!parsed) {
      return {
        data: null,
        error: 'generateInstagramCaption: Failed to extract JSON from Claude response',
      };
    }

    // Validate and extract required fields
    const caption = typeof parsed.caption === 'string' ? parsed.caption : '';
    const hookLine = typeof parsed.hookLine === 'string' ? parsed.hookLine : '';
    const cta = typeof parsed.cta === 'string' ? parsed.cta : '';
    const hashtags = Array.isArray(parsed.hashtags)
      ? (parsed.hashtags as unknown[])
          .filter((h): h is string => typeof h === 'string')
          .slice(0, 15)
      : [];

    if (!caption) {
      return { data: null, error: 'generateInstagramCaption: Claude returned empty caption' };
    }

    return {
      data: {
        caption,
        hashtags,
        hookLine,
        cta,
        tokensUsed,
        generationCost,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `generateInstagramCaption failed: ${message}` };
  }
}

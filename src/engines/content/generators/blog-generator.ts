// Blog content generator — Engine 2, blog channel
// 2-phase generation: Haiku (draft structure) → Sonnet (quality refinement)

import Anthropic from '@anthropic-ai/sdk';
import { getClaudeClient } from '@/lib/claude';
import { calculateCost, trackTokenUsage } from '@/lib/claude/token-tracker';
import { BLOG_TYPES, getBlogTypeConfig } from '@/types/blog';
import type { BlogType } from '@/types/blog';
import type { BrandDNALayers, CompanyIdentity, BrandCore, TargetAudience, VerbalIdentity, CompetitivePosition } from '@/types/brand-dna';
import type { GeneratedContent } from '@/types/content';

// ── Model constants ────────────────────────────────────────────────────────────
const SONNET = 'claude-sonnet-4-5-20250514';
const HAIKU = 'claude-haiku-4-5-20241022';

// ── Context types ──────────────────────────────────────────────────────────────

/**
 * Brand DNA subset passed into the blog generator.
 * Includes only the layers relevant to blog content creation.
 */
export interface BlogBrandContext {
  companyIdentity?: Pick<CompanyIdentity, 'companyName' | 'industry' | 'mainProducts' | 'missionStatement'>;
  brandCore?: Pick<BrandCore, 'brandName' | 'brandSlogan' | 'brandStory' | 'coreValues' | 'usp'>;
  targetAudience?: Pick<TargetAudience, 'primaryAge' | 'gender' | 'interests' | 'painPoints' | 'buyingMotivation'>;
  verbalIdentity?: Pick<VerbalIdentity, 'toneOfVoice' | 'keyMessages' | 'forbiddenWords'>;
  competitivePosition?: Pick<CompetitivePosition, 'directCompetitors' | 'differentiators' | 'marketPosition'>;
}

/**
 * Full context required to generate a single blog article.
 */
export interface BlogGenerationContext {
  /** Relevant Brand DNA layers (companyIdentity, brandCore, targetAudience, verbalIdentity, competitivePosition) */
  brandContext: BlogBrandContext;
  /** Primary and LSI keywords to weave into the article */
  keywords: string[];
  /** Product or service name to feature in the article */
  productName?: string;
  /** Series episode number — only used for science_series type */
  seriesNumber?: number;
  /** Series title — only used for science_series type, e.g. "성분 바이블" */
  seriesTitle?: string;
  /** Competitor list — primarily used for comparison_guide type */
  competitors?: Array<{ name: string; websiteUrl?: string; strengths?: string[]; weaknesses?: string[] }>;
  /** Free-form additional instructions appended to the user prompt */
  additionalPrompt?: string;
}

/**
 * Parameters for generateBlogContent().
 */
export interface GenerateBlogParams {
  blogType: BlogType;
  context: BlogGenerationContext;
  copyStyle: string;    // CopyStyleId from style.ts
  designTone?: string;  // DesignToneId from style.ts (optional for blog)
  /** Used only for token tracking — omit when calling from unauthenticated contexts */
  meta?: { userId: string; projectId: string };
}

// ── JSON extraction helper ─────────────────────────────────────────────────────
// Mirrors the same 3-step pattern used in lib/claude/index.ts.
// Handles: raw JSON | ```json fence | outermost { } object.
function extractJSON(text: string): Record<string, unknown> | null {
  // 1. Try direct parse (Claude sometimes emits clean JSON)
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

// ── Copy style tone descriptors ────────────────────────────────────────────────
// These Korean descriptions are injected into prompts to shape the writing style.
const COPY_STYLE_INSTRUCTIONS: Record<string, string> = {
  ogilvy:
    '데이비드 오길비 스타일: 구체적인 숫자와 팩트를 중심으로 독자를 설득하라. 긴 카피도 허용. 헤드라인에 반드시 핵심 이점을 담아라. 통계, 연구 결과, 비교 수치를 적극 활용하라.',
  burnett:
    '레오 버넷 스타일: 일상의 따뜻한 이야기를 통해 독자의 마음을 움직여라. 진솔하고 인간적인 톤. 영웅 캐릭터나 상징적 이미지를 서술 안에 녹여라. 과장 없이 정직하게.',
  bernbach:
    '빌 번바크 스타일: 독자의 예상을 비틀어라. 짧고 강한 문장으로 임팩트를 남겨라. 역설적 표현이나 반전 구조를 활용하고, 불필요한 미사여구를 모두 걷어내라.',
  clow:
    '리 클로우 스타일: 선언적이고 대담한 매니페스토 톤. 브랜드의 존재 이유와 세계관을 강하게 주장하라. 독자에게 영감과 소속감을 동시에 선사하라. 캐치프레이즈급 문장을 삽입하라.',
  lee_jeseok:
    '이제석 스타일: 한 줄의 카피가 전부를 담아야 한다. 군더더기 없이 핵심만. 시각적 장면을 단어로 그려내라. 소제목 하나하나를 광고 카피 수준으로 연마하라.',
  brunch_essay:
    '브런치 에세이 스타일: 짧은 문장과 긴 문장을 리드미컬하게 교차하라. 시적인 묘사와 사색적인 어조를 유지하라. 독자가 한 줄씩 음미할 수 있게 써라. 감각적이되 지적이어야 한다.',
  kurly:
    '마켓컬리 스타일: 오감을 자극하는 감각적 디테일로 묘사하라. 원산지, 생산자, 재료의 이야기를 구체적으로 전달하라. 독자가 냄새, 맛, 질감을 상상할 수 있게 해라. 신뢰와 품질을 감성으로 전달하라.',
  editorial:
    '에디토리얼 스타일: 쿨하고 절제된 톤. 영어 단어를 자연스럽게 믹스하라. 형용사를 최소화하고 명사와 동사로 밀도 있게 써라. 독자를 취향 있는 사람으로 대우하라. 설명하지 말고 보여줘라.',
};

// ── System prompt builders ─────────────────────────────────────────────────────

/**
 * Build the system prompt for a specific blog type and copy style.
 * The system prompt defines the writer's role, universal rules, and
 * type-specific structural requirements.
 */
export function getBlogSystemPrompt(blogType: BlogType, copyStyle: string): string {
  const config = getBlogTypeConfig(blogType);
  if (!config) {
    throw new Error(`Unknown blog type: ${blogType}`);
  }

  const styleInstruction =
    COPY_STYLE_INSTRUCTIONS[copyStyle] ??
    COPY_STYLE_INSTRUCTIONS['burnett'];

  const structureList = config.structure
    .map((step, i) => `${i + 1}. ${step}`)
    .join('\n');

  return `너는 BrandHelix의 전문 블로그 콘텐츠 라이터이다.
브랜드 DNA를 기반으로 "${config.nameKo}" 유형의 블로그 아티클을 작성하는 것이 임무이다.

## 이 콘텐츠의 목적
${config.purposeKo}

## 카피 스타일 지침 (최우선 적용)
${styleInstruction}

## 보편적 블로그 작성 규칙 (모든 유형 공통)

### 제목 (Title)
- 40자 이내로 작성
- 타겟 키워드를 제목의 앞부분에 배치
- 규칙: ${config.titleRule}
- 예시 참고: "${config.example}"

### 도입부 (Opening)
- 첫 2문장 안에 독자의 페인포인트 또는 공감 요소를 언급할 것
- "안녕하세요, [브랜드]입니다" 형식의 시작 문구는 절대 금지
- 독자가 계속 읽고 싶어지는 강력한 훅(Hook)으로 시작할 것

### 본문 (Body)
- 단락은 3~4문장으로 구성
- 300자마다 소제목(##) 삽입 — 독자 가독성 확보
- 본문 전체에서 제품/서비스 직접 언급은 20% 이하로 제한
- 소제목은 본문 내용을 함축하는 카피 수준으로 작성

### CTA (행동 유도)
- 본문 중간 1회 + 하단 1회, 총 2회 삽입
- 중간 CTA: 독자의 관심이 절정에 달한 시점 (1/2~2/3 지점)
- 하단 CTA: 명확한 행동 문구 포함 (예: "지금 무료로 경험해보세요", "전문가에게 문의하기")

### SEO 최적화
- 주요 키워드 밀도: 본문 전체의 1.5~2.5% 유지
- 내부 링크 2개 삽입 (placeholder: [관련글: OOO] 형식으로 표기)
- 메타 디스크립션: 150자 이내, 핵심 키워드 + 독자 이익 포함

### 금기 사항
- 과장 광고 문구 (예: "혁명적인", "전례 없는", "최강의")
- 근거 없는 효능 주장
- 문맥 없는 영어 혼용
- 5줄 이상의 글머리 기호 나열 (단 비교 테이블 제외)
- 독자를 하대하는 단정적 표현

## 이 콘텐츠 유형의 구조 (순서대로 따를 것)
${structureList}

## 글자 수 목표
최소 ${config.lengthRange.min}자 ~ 최대 ${config.lengthRange.max}자 (한글 기준, 공백 제외)

## 이미지 명세 (이미지 삽입 위치 표기용)
- 크기: ${config.imageSpec.width}x${config.imageSpec.height}px
- 권장 장수: ${config.imageSpec.count}
- 이미지 삽입 위치는 [이미지: 설명] 형식으로 마크다운 내에 표기

## 응답 형식 (JSON만 반환, 다른 텍스트 없음)
{
  "title": "최종 블로그 제목",
  "seoMeta": {
    "description": "메타 디스크립션 (150자 이내)",
    "keywords": ["키워드1", "키워드2", "키워드3"]
  },
  "body": {
    "markdown": "완성된 블로그 본문 (마크다운 형식, 소제목/이미지/CTA 포함)",
    "html": "완성된 블로그 본문 (HTML 형식)"
  }
}`;
}

// ── User prompt builder ────────────────────────────────────────────────────────

/**
 * Build the user-turn message that provides the brand context and
 * task-specific instructions for the given blog type.
 */
export function getBlogUserPrompt(blogType: BlogType, context: BlogGenerationContext): string {
  const {
    brandContext,
    keywords,
    productName,
    seriesNumber,
    seriesTitle,
    competitors,
    additionalPrompt,
  } = context;

  // Build the brand context section
  const brandSection = JSON.stringify(
    {
      companyIdentity: brandContext.companyIdentity ?? null,
      brandCore: brandContext.brandCore ?? null,
      targetAudience: brandContext.targetAudience ?? null,
      verbalIdentity: brandContext.verbalIdentity ?? null,
      competitivePosition: brandContext.competitivePosition ?? null,
    },
    null,
    2
  );

  // Build type-specific task instructions
  let typeSpecificInstructions = '';

  switch (blogType) {
    case 'seo_filler':
      typeSpecificInstructions = `
## SEO 필러 콘텐츠 작성 지침
- 아래 키워드를 제목, 첫 단락, 소제목, 본문에 자연스럽게 분산 배치하라
- 주요 키워드: ${keywords.join(', ')}
- 독자의 검색 의도(정보 탐색 단계)에 맞게 정보성 위주로 작성
- 제품(${productName ?? '자사 제품'})은 본문 중반 이후에 한 번만 자연스럽게 언급
- 소제목은 독자가 검색할 법한 질문 형태로 작성 (예: "OO는 정말 효과가 있을까?")`;
      break;

    case 'science_series':
      typeSpecificInstructions = `
## 성분/과학 시리즈 작성 지침
- 시리즈명: [${seriesTitle ?? '성분 바이블'} #${seriesNumber ?? 1}]
- 이번 편 주제 성분/기술: ${keywords[0] ?? productName ?? '주요 성분'}
- 과학적 메커니즘을 정확하게 설명하되, 독자가 이해할 수 있는 언어로 번역하라
- 관련 연구나 임상 데이터를 언급할 경우 "[연구 출처]" 형식으로 placeholder 삽입
- 자사 제품(${productName ?? '자사 제품'})에 해당 성분이 적용된 방식을 자연스럽게 연결
- 마지막 단락에 반드시 다음 편 예고를 포함하라
- 관련 키워드: ${keywords.join(', ')}`;
      break;

    case 'lifestyle_empathy':
      typeSpecificInstructions = `
## 라이프스타일 공감 콘텐츠 작성 지침
- 타겟 독자의 구체적인 일상 순간에서 시작하라 (시간, 장소, 감정을 구체적으로 묘사)
- 페인포인트: ${brandContext.targetAudience?.painPoints?.join(', ') ?? keywords.join(', ')}
- 제품(${productName ?? '자사 제품'})을 해결책이 아닌 "발견"으로 자연스럽게 소개하라
- 감각적 묘사 (시각, 청각, 촉각, 후각)를 최소 3곳 이상 삽입하라
- 마무리는 독자의 공감과 참여를 유도하는 질문 또는 초대로 끝내라
- 관련 키워드: ${keywords.join(', ')}`;
      break;

    case 'comparison_guide':
      typeSpecificInstructions = `
## 비교·가이드 콘텐츠 작성 지침
- 비교 대상: ${competitors?.map((c) => c.name).join(', ') ?? '주요 경쟁 제품들'} vs ${productName ?? '자사 제품'}
- 비교 기준 항목을 명확히 정의한 후 마크다운 테이블을 반드시 포함하라
- 테이블 형식: | 기준 | ${productName ?? '자사 제품'} | ${competitors?.[0]?.name ?? '경쟁사 A'} | ${competitors?.[1]?.name ?? '경쟁사 B'} |
- 객관적인 어조를 유지하되, 자사 제품의 핵심 차별점은 명확히 부각하라
- 차별점: ${brandContext.competitivePosition?.differentiators?.join(', ') ?? '제품 고유의 강점'}
- "이런 분께 추천" 섹션에서 각 제품의 이상적인 사용자를 구체적으로 제시
- 관련 키워드: ${keywords.join(', ')}`;
      break;

    case 'brand_story':
      typeSpecificInstructions = `
## 브랜드 스토리·비하인드 작성 지침
- 브랜드 스토리: ${brandContext.brandCore?.brandStory ?? '브랜드의 탄생 배경과 철학'}
- 핵심 가치: ${brandContext.brandCore?.coreValues?.join(', ') ?? '브랜드 핵심 가치'}
- USP: ${brandContext.brandCore?.usp ?? '브랜드 고유의 강점'}
- 구체적인 에피소드, 실패 경험, 전환점을 서사에 포함하라 (추상적 미사여구 금지)
- 창업자 또는 개발팀의 인간적인 면을 드러내는 디테일을 삽입하라
- 마무리는 독자를 브랜드 여정의 동반자로 초대하는 메시지로 끝내라
- 관련 키워드: ${keywords.join(', ')}`;
      break;
  }

  // Assemble the full user message
  const userMessage = {
    task: {
      blogType,
      productName: productName ?? null,
      targetKeywords: keywords,
    },
    brandDNAContext: JSON.parse(brandSection) as Record<string, unknown>,
    typeSpecificInstructions: typeSpecificInstructions.trim(),
    forbiddenWords: brandContext.verbalIdentity?.forbiddenWords ?? [],
    additionalInstructions: additionalPrompt ?? null,
  };

  return JSON.stringify(userMessage, null, 2);
}

// ── Main generation function ───────────────────────────────────────────────────

/**
 * Generate a full blog article using 2-phase Claude generation.
 *
 * Phase 1 (Haiku): Produces a fast structural draft — establishes sections,
 *                  SEO skeleton, and content scaffold.
 * Phase 2 (Sonnet): Refines tone, prose quality, CTA effectiveness, and
 *                   brand voice consistency.
 *
 * Returns `{ data: Partial<GeneratedContent>, error: null }` on success,
 * or `{ data: null, error: "message" }` on failure.
 */
export async function generateBlogContent(
  params: GenerateBlogParams
): Promise<{ data: Partial<GeneratedContent> | null; error: string | null }> {
  const { blogType, context, copyStyle, designTone, meta } = params;

  // Validate blog type
  const config = getBlogTypeConfig(blogType);
  if (!config) {
    return { data: null, error: `Unknown blog type: ${blogType}` };
  }

  const systemPrompt = getBlogSystemPrompt(blogType, copyStyle);
  const userPrompt = getBlogUserPrompt(blogType, context);

  let totalTokensIn = 0;
  let totalTokensOut = 0;

  // ── Phase 1: Haiku — fast structural draft ────────────────────────────────
  let phase1Title = '';
  let phase1Markdown = '';
  let phase1SeoMeta: Record<string, unknown> = {};

  try {
    const claude: Anthropic = getClaudeClient();

    const phase1Response = await claude.messages.create({
      model: HAIKU,
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const p1Usage = phase1Response.usage;
    totalTokensIn += p1Usage.input_tokens;
    totalTokensOut += p1Usage.output_tokens;

    if (meta) {
      await trackTokenUsage(meta.userId, meta.projectId, {
        model: HAIKU,
        tokensIn: p1Usage.input_tokens,
        tokensOut: p1Usage.output_tokens,
        cost: calculateCost(HAIKU, p1Usage.input_tokens, p1Usage.output_tokens),
      });
    }

    const p1TextBlock = phase1Response.content.find((b) => b.type === 'text');
    if (!p1TextBlock || p1TextBlock.type !== 'text') {
      return { data: null, error: 'Phase 1 (Haiku): Claude returned no text content' };
    }

    const p1JSON = extractJSON(p1TextBlock.text);
    if (!p1JSON) {
      return { data: null, error: 'Phase 1 (Haiku): Failed to extract JSON from response' };
    }

    phase1Title = (p1JSON.title as string) ?? '';
    const p1Body = p1JSON.body as Record<string, string> | undefined;
    phase1Markdown = p1Body?.markdown ?? p1TextBlock.text;
    phase1SeoMeta = (p1JSON.seoMeta as Record<string, unknown>) ?? {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `generateBlogContent Phase 1 failed: ${message}` };
  }

  // ── Phase 2: Sonnet — tone refinement and quality polish ─────────────────
  const phase2SystemPrompt = `너는 BrandHelix의 블로그 품질 전문 에디터이다.
Haiku가 작성한 블로그 초안을 다음 기준에 따라 완성도 높게 다듬어라.

## 품질 향상 목표
1. 브랜드 톤앤보이스 일관성 강화: 카피 스타일 "${copyStyle}"이 본문 전체에 일관되게 적용되었는지 확인하고 보완
2. 금기어 제거: 초안에 포함된 금기 단어를 대체 표현으로 교체
3. CTA 효과성 점검: 중간 CTA + 하단 CTA가 모두 포함되어 있는지, 자연스럽게 전환되는지 확인
4. 키워드 밀도 조정: 키워드 밀도를 1.5~2.5% 범위 내로 최적화 (과도한 반복 또는 부족한 삽입 모두 수정)
5. 문장 가독성 향상: 단락 구조(3~4문장), 소제목 간격(300자), 능동형 문장 비율 점검
6. 도입부 강화: 첫 2문장이 충분한 훅(Hook)을 가지고 있는지 확인하고 필요 시 재작성
7. 마무리 완성: 독자의 다음 행동을 유도하는 자연스러운 마무리인지 확인

## 응답 형식 (JSON만 반환, 다른 텍스트 없음)
{
  "title": "최종 블로그 제목",
  "seoMeta": {
    "description": "메타 디스크립션 (150자 이내)",
    "keywords": ["키워드1", "키워드2", "키워드3"]
  },
  "body": {
    "markdown": "최종 블로그 본문 (마크다운)",
    "html": "최종 블로그 본문 (HTML, p/h2/h3/ul/table 태그 사용)"
  }
}`;

  const phase2UserMessage = JSON.stringify(
    {
      draft: {
        title: phase1Title,
        seoMeta: phase1SeoMeta,
        body: { markdown: phase1Markdown },
      },
      refinementContext: {
        blogType,
        copyStyle,
        targetKeywords: context.keywords,
        forbiddenWords: context.brandContext.verbalIdentity?.forbiddenWords ?? [],
        lengthTarget: `${config.lengthRange.min}~${config.lengthRange.max}자`,
      },
    },
    null,
    2
  );

  try {
    const claude: Anthropic = getClaudeClient();

    const phase2Response = await claude.messages.create({
      model: SONNET,
      max_tokens: 4000,
      system: phase2SystemPrompt,
      messages: [{ role: 'user', content: phase2UserMessage }],
    });

    const p2Usage = phase2Response.usage;
    totalTokensIn += p2Usage.input_tokens;
    totalTokensOut += p2Usage.output_tokens;

    if (meta) {
      await trackTokenUsage(meta.userId, meta.projectId, {
        model: SONNET,
        tokensIn: p2Usage.input_tokens,
        tokensOut: p2Usage.output_tokens,
        cost: calculateCost(SONNET, p2Usage.input_tokens, p2Usage.output_tokens),
      });
    }

    const p2TextBlock = phase2Response.content.find((b) => b.type === 'text');
    if (!p2TextBlock || p2TextBlock.type !== 'text') {
      return { data: null, error: 'Phase 2 (Sonnet): Claude returned no text content' };
    }

    const p2JSON = extractJSON(p2TextBlock.text);

    // Fall back to Phase 1 output if Phase 2 JSON extraction fails
    const finalTitle = (p2JSON?.title as string | undefined) ?? phase1Title;
    const p2Body = p2JSON?.body as Record<string, string> | undefined;
    const finalMarkdown = p2Body?.markdown ?? phase1Markdown;
    const finalHtml =
      p2Body?.html ??
      `<article>${finalMarkdown.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}</article>`;

    const finalSeoMeta = (p2JSON?.seoMeta as Record<string, unknown> | undefined) ?? phase1SeoMeta;
    const finalDescription = (finalSeoMeta?.description as string | undefined) ?? '';
    const finalKeywords = (finalSeoMeta?.keywords as string[] | undefined) ?? context.keywords;

    // Calculate total cost: Phase 1 tokens were already accumulated into totalTokensIn/Out
    const p1TokensIn = totalTokensIn - p2Usage.input_tokens;
    const p1TokensOut = totalTokensOut - p2Usage.output_tokens;
    const finalCost =
      calculateCost(HAIKU, p1TokensIn, p1TokensOut) +
      calculateCost(SONNET, p2Usage.input_tokens, p2Usage.output_tokens);

    const data: Partial<GeneratedContent> = {
      channel: 'blog',
      contentType: blogType,
      title: finalTitle || undefined,
      body: {
        markdown: finalMarkdown,
        html: finalHtml,
        seoMeta: {
          description: finalDescription,
          keywords: finalKeywords,
        },
      },
      copyStyle,
      designTone: designTone ?? undefined,
      tokensUsed: totalTokensIn + totalTokensOut,
      generationCost: finalCost,
    };

    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `generateBlogContent Phase 2 failed: ${message}` };
  }
}

// ── Named re-exports for convenience ──────────────────────────────────────────
export { BLOG_TYPES, getBlogTypeConfig };
export type { BlogType };

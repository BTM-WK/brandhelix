// Site Builder — Engine 3, site-builder
// 브랜드 DNA를 기반으로 판매사이트/랜딩페이지를 생성한다.
// 2-phase generation: Haiku (섹션 카피 초안) → Sonnet (브랜드 톤 정제)
// → 섹션별 HTML 렌더링 → 전체 페이지 조립

import Anthropic from '@anthropic-ai/sdk';
import { getClaudeClient } from '@/lib/claude';
import { calculateCost, trackTokenUsage } from '@/lib/claude/token-tracker';
import type { SiteTemplateType, SiteSectionType } from '@/types/site';
import { getSiteTemplateConfig } from '@/types/site';
import { generateDesignTokens, designTokensToCss } from './design-tokens';
import type { SiteDesignTokens } from './design-tokens';
import { renderSection } from './sections';
import type { SectionCopy, SectionRenderOptions } from './sections';

// ── Model constants ────────────────────────────────────────────────────────────
const SONNET = 'claude-sonnet-4-5-20250514';
const HAIKU = 'claude-haiku-4-5-20241022';

// ── Brand Context for Site Builder ──────────────────────────────────────────

export interface SiteBrandContext {
  companyIdentity?: {
    companyName?: string;
    industry?: string;
    mainProducts?: string[];
    missionStatement?: string;
  };
  brandCore?: {
    brandName?: string;
    brandSlogan?: string;
    brandStory?: string;
    usp?: string;
    coreValues?: string[];
  };
  targetAudience?: {
    primaryAge?: string;
    painPoints?: string[];
    buyingMotivation?: string[];
  };
  verbalIdentity?: {
    toneOfVoice?: string[];
    keyMessages?: string[];
    forbiddenWords?: string[];
  };
  visualIdentity?: {
    designTone?: string;
  };
  competitivePosition?: {
    differentiators?: string[];
  };
}

// ── Build Site Params ───────────────────────────────────────────────────────

export interface BuildSiteParams {
  templateType: SiteTemplateType;
  brandContext: SiteBrandContext;
  productName?: string;
  copyStyle: string;
  designTone: string;
  additionalPrompt?: string;
  meta?: { userId: string; projectId: string };
}

// ── Build Site Result ───────────────────────────────────────────────────────

export interface BuildSiteResult {
  data: {
    html: string;                                    // 조립된 전체 HTML 페이지
    sections: Record<string, string>;                // 섹션별 HTML 조각
    copy: Record<string, Record<string, string>>;    // 섹션별 카피 데이터
    designTokens: Record<string, string>;            // CSS custom properties
  } | null;
  error: string | null;
  tokensUsed: number;
  generationCost: number;
}

// ── JSON extraction helper ─────────────────────────────────────────────────────
// 3-step pattern: raw JSON → fenced block → outermost { }
// 코드베이스 전체에서 동일한 패턴 사용 (blog-generator, shortform-generator 등)
function extractJSON(text: string): Record<string, unknown> | null {
  // 1. Direct parse (Claude가 깨끗한 JSON을 반환하는 경우)
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not raw JSON — fall through
  }

  // 2. ```json ... ``` fenced block
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

  // 3. Outermost { ... } object
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

// ── HTML escape (페이지 title 등 조립용) ─────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Copy style instructions (Korean, 사이트 카피 최적화) ─────────────────────
const COPY_STYLE_INSTRUCTIONS: Record<string, string> = {
  ogilvy:
    '데이비드 오길비 스타일: 구체적인 숫자와 팩트로 신뢰를 구축하라. 헤드라인에 핵심 이점 수치를 담아라. 긴 카피도 허용하되, 데이터 기반으로 설득하라.',
  burnett:
    '레오 버넷 스타일: 일상의 따뜻한 이야기로 공감을 이끌어라. 진솔하고 인간적인 톤. 과장 없이 정직하게 제품의 가치를 전달하라.',
  bernbach:
    '빌 번바크 스타일: 독자의 예상을 뒤집어라. 짧고 강한 헤드라인으로 임팩트를 남겨라. 역설적 표현과 반전 구조를 활용하라.',
  clow:
    '리 클로우 스타일: 선언적이고 대담한 매니페스토 톤. 브랜드의 존재 이유를 강하게 외쳐라. 영감과 소속감을 동시에 전달하라.',
  lee_jeseok:
    '이제석 스타일: 한 줄이 전부를 말해야 한다. 군더더기 없이 핵심만. 헤드라인 하나로 페이지 전체의 메시지를 완결하라.',
  brunch_essay:
    '브런치 에세이 스타일: 짧은 문장과 긴 문장을 리드미컬하게 교차. 시적이고 사색적인 어조. 감각적이되 지적이어야 한다.',
  kurly:
    '마켓컬리 스타일: 오감을 자극하는 감각적 디테일. 원산지, 생산자, 재료의 이야기. 신뢰와 품질을 감성으로 전달하라.',
  editorial:
    '에디토리얼 스타일: 쿨하고 절제된 톤. 영어 단어를 자연스럽게 믹스. 형용사 최소화, 명사와 동사로 밀도 있게. 설명하지 말고 보여줘라.',
};

// ── Section copy key guide builder ───────────────────────────────────────────
// 각 섹션 타입에 필요한 카피 키와 설명을 프롬프트에 삽입하기 위한 가이드

function buildSectionCopyGuide(sectionType: SiteSectionType): string {
  switch (sectionType) {
    case 'hero':
      return `"hero": { "headline": "메인 헤드라인 (30자 이내)", "subheadline": "부제목 (50자 이내)", "ctaText": "CTA 버튼 텍스트 (7자 이내)" }`;
    case 'features':
      return `"features": { "sectionTitle": "섹션 제목", "sectionSubtitle": "섹션 부제목", "feature1Title": "특장점1 제목", "feature1Description": "특장점1 설명", "feature1Icon": "이모지 아이콘", "feature2Title": "특장점2 제목", "feature2Description": "특장점2 설명", "feature2Icon": "이모지 아이콘", "feature3Title": "특장점3 제목", "feature3Description": "특장점3 설명", "feature3Icon": "이모지 아이콘" }`;
    case 'product_detail':
      return `"product_detail": { "sectionTitle": "카테고리 라벨", "productName": "제품명", "description": "제품 상세 설명 (100자 이내)", "highlights": ["핵심 특징1", "핵심 특징2", "핵심 특징3"], "imageAlt": "이미지 설명" }`;
    case 'testimonials':
      return `"testimonials": { "sectionTitle": "섹션 제목", "sectionSubtitle": "섹션 부제목", "testimonial1Quote": "고객 후기1", "testimonial1Author": "작성자1 이름", "testimonial1Role": "작성자1 직함", "testimonial2Quote": "고객 후기2", "testimonial2Author": "작성자2 이름", "testimonial2Role": "작성자2 직함", "testimonial3Quote": "고객 후기3", "testimonial3Author": "작성자3 이름", "testimonial3Role": "작성자3 직함" }`;
    case 'faq':
      return `"faq": { "sectionTitle": "섹션 제목", "sectionSubtitle": "섹션 부제목", "faq1Question": "질문1", "faq1Answer": "답변1", "faq2Question": "질문2", "faq2Answer": "답변2", "faq3Question": "질문3", "faq3Answer": "답변3", "faq4Question": "질문4", "faq4Answer": "답변4" }`;
    case 'cta':
      return `"cta": { "headline": "CTA 헤드라인", "description": "CTA 설명", "ctaText": "주요 버튼 텍스트 (7자 이내)", "secondaryCtaText": "보조 버튼 텍스트 (선택)" }`;
    case 'brand_story':
      return `"brand_story": { "sectionTitle": "섹션 제목", "story": "브랜드 스토리 본문 (200자 이내)", "quote": "인용문/대표 문구", "values": ["핵심가치1", "핵심가치2", "핵심가치3"] }`;
    case 'gallery':
      return `"gallery": { "sectionTitle": "섹션 제목", "sectionSubtitle": "섹션 부제목", "captions": ["이미지1 설명", "이미지2 설명", "이미지3 설명", "이미지4 설명"] }`;
    case 'pricing':
      return `"pricing": { "sectionTitle": "섹션 제목", "sectionSubtitle": "섹션 부제목", "plan1Name": "플랜1 이름", "plan1Price": "₩0", "plan1Period": "/월", "plan1Description": "설명", "plan1Features": ["기능1", "기능2"], "plan1CtaText": "선택", "plan2Name": "플랜2 이름", "plan2Price": "₩29,000", "plan2Period": "/월", "plan2Description": "설명", "plan2Features": ["기능1", "기능2", "기능3"], "plan2CtaText": "선택", "plan2Popular": "true", "plan3Name": "플랜3 이름", "plan3Price": "₩79,000", "plan3Period": "/월", "plan3Description": "설명", "plan3Features": ["기능1", "기능2", "기능3", "기능4"], "plan3CtaText": "선택" }`;
    case 'footer':
      return `"footer": { "description": "짧은 브랜드 소개", "email": "이메일", "phone": "전화번호", "address": "주소", "navLinks": ["링크1", "링크2", "링크3"], "socialLinks": ["Instagram", "Facebook", "YouTube"] }`;
    default:
      return `"${sectionType}": {}`;
  }
}

// ── System prompt builder ────────────────────────────────────────────────────

function buildCopyGenerationSystemPrompt(
  templateType: SiteTemplateType,
  copyStyle: string,
  sectionTypes: SiteSectionType[]
): string {
  const styleInstruction =
    COPY_STYLE_INSTRUCTIONS[copyStyle] ?? COPY_STYLE_INSTRUCTIONS['burnett'];

  // 섹션별 카피 키 가이드 생성
  const sectionGuides = sectionTypes.map(buildSectionCopyGuide);

  const templateConfig = getSiteTemplateConfig(templateType);
  const templateName = templateConfig?.nameKo ?? templateType;

  return `너는 판매사이트/랜딩페이지 전문 카피라이터이다.
브랜드 DNA를 기반으로 "${templateName}" 템플릿의 각 섹션별 카피를 생성하라.

## 카피 스타일 지침 (최우선 적용)
${styleInstruction}

## 규칙
1. 제목(headline)은 간결하고 임팩트 있게 (30자 이내)
2. 본문(description/story)은 명확하고 설득력 있게
3. CTA는 행동 유도적으로 (3~7자)
4. 브랜드 금기어 사용 금지
5. 타겟 오디언스의 언어로 작성
6. 각 섹션의 카피는 서로 연결되는 하나의 스토리를 구성해야 한다
7. 한국어로 작성 (영어 키워드는 자연스럽게 혼용 가능)

## 응답 형식 (JSON만 반환, 다른 텍스트 없음)
각 섹션의 카피를 아래 형식으로 반환하라:
{
  ${sectionGuides.join(',\n  ')}
}`;
}

// ── User prompt builder ──────────────────────────────────────────────────────

function buildCopyGenerationUserPrompt(params: BuildSiteParams): string {
  const {
    templateType,
    brandContext,
    copyStyle,
    designTone,
    productName,
    additionalPrompt,
  } = params;

  const userMessage = {
    task: {
      templateType,
      productName: productName ?? null,
      copyStyle,
      designTone,
    },
    brandDNAContext: {
      companyIdentity: brandContext.companyIdentity ?? null,
      brandCore: brandContext.brandCore ?? null,
      targetAudience: brandContext.targetAudience ?? null,
      verbalIdentity: brandContext.verbalIdentity ?? null,
      visualIdentity: brandContext.visualIdentity ?? null,
      competitivePosition: brandContext.competitivePosition ?? null,
    },
    forbiddenWords: brandContext.verbalIdentity?.forbiddenWords ?? [],
    additionalInstructions: additionalPrompt ?? null,
  };

  return JSON.stringify(userMessage, null, 2);
}

// ── Phase 2 system prompt ────────────────────────────────────────────────────

function buildRefinementSystemPrompt(copyStyle: string): string {
  return `너는 BrandHelix의 사이트 카피 품질 전문 에디터이다.
Haiku가 작성한 랜딩페이지 카피 초안을 브랜드 톤에 맞게 다듬어라.

## 품질 향상 목표
1. 브랜드 톤앤보이스 일관성: 카피 스타일 "${copyStyle}"이 모든 섹션에 일관되게 적용되었는지 확인
2. 헤드라인 임팩트: 각 섹션 제목이 독자를 끌어당기는 힘이 있는지 점검
3. CTA 효과성: CTA 문구가 명확하고 행동 유도적인지 확인
4. 금기어 제거: 브랜드 금기어를 대체 표현으로 교체
5. 스토리 흐름: 섹션 간 카피가 자연스러운 흐름을 이루는지 확인
6. 문장 간결성: 불필요한 미사여구 제거, 핵심만 전달
7. 타겟 언어: 타겟 오디언스가 사용하는 언어와 일치하는지 확인

## 응답 형식
입력과 동일한 JSON 구조로 다듬어진 카피를 반환하라.
JSON만 반환하고, 다른 텍스트는 포함하지 마라.`;
}

// ── Section copy normalization ───────────────────────────────────────────────

/**
 * Claude 응답에서 섹션별 카피를 추출하고 안전한 타입으로 정규화한다.
 */
function normalizeSectionCopy(
  rawCopy: Record<string, unknown>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const [sectionKey, sectionData] of Object.entries(rawCopy)) {
    if (!sectionData || typeof sectionData !== 'object') continue;

    const normalizedSection: Record<string, string> = {};
    for (const [copyKey, copyValue] of Object.entries(
      sectionData as Record<string, unknown>
    )) {
      if (typeof copyValue === 'string') {
        normalizedSection[copyKey] = copyValue;
      } else if (Array.isArray(copyValue)) {
        // 배열 값은 JSON 문자열로 저장 (SectionCopy가 string[] 지원)
        normalizedSection[copyKey] = JSON.stringify(copyValue);
      }
    }

    result[sectionKey] = normalizedSection;
  }

  return result;
}

/**
 * 정규화된 카피를 SectionCopy 타입으로 변환 (JSON 배열 복원 포함)
 */
function toSectionCopy(normalizedCopy: Record<string, string>): SectionCopy {
  const copy: SectionCopy = {};
  for (const [key, value] of Object.entries(normalizedCopy)) {
    // JSON 배열로 파싱 시도
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (
          Array.isArray(parsed) &&
          parsed.every((v: unknown) => typeof v === 'string')
        ) {
          copy[key] = parsed as string[];
          continue;
        }
      } catch {
        // 파싱 실패 시 문자열로 유지
      }
    }
    copy[key] = value;
  }
  return copy;
}

// ── Full HTML page assembly ──────────────────────────────────────────────────

function assembleFullPage(
  sections: string[],
  cssTokens: string,
  brandName: string
): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(brandName)}</title>
  <style>
    :root {
${cssTokens}
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-body); color: var(--color-text); background: var(--color-bg); }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; height: auto; }
    /* Responsive utility */
    @media (max-width: 768px) {
      :root {
        --spacing-section: 48px;
      }
    }
    /* Details/summary reset for FAQ */
    details summary::-webkit-details-marker { display: none; }
    details[open] summary span:last-child { transform: rotate(45deg); }
    /* Smooth scroll */
    html { scroll-behavior: smooth; }
    /* Button hover effects */
    a:hover { opacity: 0.9; }
  </style>
</head>
<body>
${sections.join('\n')}
</body>
</html>`;
}

// ── Main build function ──────────────────────────────────────────────────────

/**
 * 브랜드 DNA 기반으로 판매사이트/랜딩페이지를 생성한다.
 *
 * Pipeline:
 * 1. 디자인 톤 → CSS custom properties 생성 (design-tokens.ts)
 * 2. 템플릿 타입에 따른 섹션 구성 결정 (types/site.ts)
 * 3. Phase 1 (Haiku): 섹션별 카피 초안 생성
 * 4. Phase 2 (Sonnet): 브랜드 톤 정제
 * 5. 섹션별 HTML 렌더링 (sections.ts)
 * 6. 전체 페이지 조립
 *
 * @returns BuildSiteResult — data가 null이면 error 참조
 */
export async function buildSite(
  params: BuildSiteParams
): Promise<BuildSiteResult> {
  const { templateType, brandContext, copyStyle, designTone, meta } = params;

  const brandName =
    brandContext.brandCore?.brandName ??
    brandContext.companyIdentity?.companyName ??
    'BrandHelix Site';

  let totalTokensIn = 0;
  let totalTokensOut = 0;

  // ── Step 1: 디자인 토큰 생성 ─────────────────────────────────────────────
  const designTokens: SiteDesignTokens = generateDesignTokens(designTone);
  const cssTokens = designTokensToCss(designTokens);
  // indent for :root block
  const indentedCssTokens = cssTokens
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');

  // ── Step 2: 템플릿 섹션 구성 확인 ────────────────────────────────────────
  const templateConfig = getSiteTemplateConfig(templateType);
  const sectionTypes: SiteSectionType[] = templateConfig
    ? [...templateConfig.sections]
    : ['hero', 'features', 'product_detail', 'testimonials', 'faq', 'cta', 'footer'];

  // ── Step 3: Phase 1 (Haiku) — 섹션별 카피 초안 생성 ──────────────────────
  const phase1SystemPrompt = buildCopyGenerationSystemPrompt(
    templateType,
    copyStyle,
    sectionTypes
  );
  const phase1UserPrompt = buildCopyGenerationUserPrompt(params);

  let phase1Copy: Record<string, unknown> | null = null;

  try {
    const claude: Anthropic = getClaudeClient();

    const phase1Response = await claude.messages.create({
      model: HAIKU,
      max_tokens: 4000,
      system: phase1SystemPrompt,
      messages: [{ role: 'user', content: phase1UserPrompt }],
    });

    const p1Usage = phase1Response.usage;
    totalTokensIn += p1Usage.input_tokens;
    totalTokensOut += p1Usage.output_tokens;

    // Token tracking
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
      return {
        data: null,
        error: 'Phase 1 (Haiku): Claude returned no text content',
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: calculateCost(
          HAIKU,
          totalTokensIn,
          totalTokensOut
        ),
      };
    }

    phase1Copy = extractJSON(p1TextBlock.text);
    if (!phase1Copy) {
      return {
        data: null,
        error: 'Phase 1 (Haiku): Failed to extract JSON from response',
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: calculateCost(
          HAIKU,
          totalTokensIn,
          totalTokensOut
        ),
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      data: null,
      error: `buildSite Phase 1 failed: ${message}`,
      tokensUsed: totalTokensIn + totalTokensOut,
      generationCost: calculateCost(HAIKU, totalTokensIn, totalTokensOut),
    };
  }

  // ── Step 4: Phase 2 (Sonnet) — 브랜드 톤 정제 ───────────────────────────
  const phase2SystemPrompt = buildRefinementSystemPrompt(copyStyle);
  const phase2UserPrompt = JSON.stringify(
    {
      draft: phase1Copy,
      refinementContext: {
        templateType,
        copyStyle,
        designTone,
        forbiddenWords:
          brandContext.verbalIdentity?.forbiddenWords ?? [],
        brandName,
        usp: brandContext.brandCore?.usp ?? null,
      },
    },
    null,
    2
  );

  let finalCopyRaw: Record<string, unknown>;
  // Phase 2 토큰 분리 추적용
  let p2TokensIn = 0;
  let p2TokensOut = 0;

  try {
    const claude: Anthropic = getClaudeClient();

    const phase2Response = await claude.messages.create({
      model: SONNET,
      max_tokens: 4000,
      system: phase2SystemPrompt,
      messages: [{ role: 'user', content: phase2UserPrompt }],
    });

    const p2Usage = phase2Response.usage;
    p2TokensIn = p2Usage.input_tokens;
    p2TokensOut = p2Usage.output_tokens;
    totalTokensIn += p2TokensIn;
    totalTokensOut += p2TokensOut;

    // Token tracking
    if (meta) {
      await trackTokenUsage(meta.userId, meta.projectId, {
        model: SONNET,
        tokensIn: p2TokensIn,
        tokensOut: p2TokensOut,
        cost: calculateCost(SONNET, p2TokensIn, p2TokensOut),
      });
    }

    const p2TextBlock = phase2Response.content.find(
      (b) => b.type === 'text'
    );
    if (!p2TextBlock || p2TextBlock.type !== 'text') {
      // Phase 2 텍스트 없음 → Phase 1 결과로 폴백
      finalCopyRaw = phase1Copy;
    } else {
      const p2JSON = extractJSON(p2TextBlock.text);
      // Phase 2 JSON 추출 실패 시 Phase 1 결과로 폴백
      finalCopyRaw = p2JSON ?? phase1Copy;
    }
  } catch (err: unknown) {
    // Phase 2 에러 시에도 Phase 1 결과로 계속 진행 (degraded mode)
    console.warn(
      `[buildSite] Phase 2 failed, using Phase 1 draft:`,
      err instanceof Error ? err.message : String(err)
    );
    finalCopyRaw = phase1Copy;
  }

  // ── Step 5: 섹션별 HTML 렌더링 ──────────────────────────────────────────
  const normalizedCopy = normalizeSectionCopy(finalCopyRaw);
  const renderOptions: SectionRenderOptions = {
    brandName,
    designTone,
  };

  const sectionHtmlMap: Record<string, string> = {};
  const renderedSections: string[] = [];

  for (const sectionType of sectionTypes) {
    const sectionCopyData = normalizedCopy[sectionType] ?? {};
    const copyForRender = toSectionCopy(sectionCopyData);

    // footer에는 brandName을 명시적으로 전달
    if (sectionType === 'footer' && !copyForRender.brandName) {
      copyForRender.brandName = brandName;
    }

    const html = renderSection(sectionType, copyForRender, renderOptions);
    if (html) {
      sectionHtmlMap[sectionType] = html;
      renderedSections.push(html);
    }
  }

  // ── Step 6: 전체 페이지 조립 ─────────────────────────────────────────────
  const fullHtml = assembleFullPage(
    renderedSections,
    indentedCssTokens,
    brandName
  );

  // ── Step 7: 비용 계산 ────────────────────────────────────────────────────
  // Phase 1(Haiku)과 Phase 2(Sonnet)의 토큰을 분리하여 정확한 비용 산출
  const p1TokensIn = totalTokensIn - p2TokensIn;
  const p1TokensOut = totalTokensOut - p2TokensOut;
  const finalCost =
    calculateCost(HAIKU, p1TokensIn, p1TokensOut) +
    calculateCost(SONNET, p2TokensIn, p2TokensOut);

  return {
    data: {
      html: fullHtml,
      sections: sectionHtmlMap,
      copy: normalizedCopy,
      designTokens: { ...designTokens },
    },
    error: null,
    tokensUsed: totalTokensIn + totalTokensOut,
    generationCost: finalCost,
  };
}

// ── Re-exports ───────────────────────────────────────────────────────────────

export { renderSection } from './sections';
export type { SectionCopy, SectionRenderOptions, SectionType } from './sections';
export { SECTION_TYPES } from './sections';

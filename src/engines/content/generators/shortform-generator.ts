// Shortform script generator — Engine 2, shortform channel (TikTok / YouTube Shorts / Reels)
// 2-phase generation: Haiku (draft structure) → Sonnet (quality refinement)

import Anthropic from '@anthropic-ai/sdk';
import { getClaudeClient } from '@/lib/claude';
import { calculateCost, trackTokenUsage } from '@/lib/claude/token-tracker';
import { SHORTFORM_TYPES, getShortformTypeConfig } from '@/types/shortform';
import type { ShortformType } from '@/types/shortform';

// ── Model constants ────────────────────────────────────────────────────────────
const SONNET = 'claude-sonnet-4-5-20250514';
const HAIKU = 'claude-haiku-4-5-20241022';

// ── Context types ──────────────────────────────────────────────────────────────

/**
 * Brand DNA subset passed into the shortform generator.
 * Includes only the layers relevant to shortform script creation.
 */
export interface ShortformBrandContext {
  companyIdentity?: {
    companyName?: string;
    industry?: string;
    mainProducts?: string[];
  };
  brandCore?: {
    brandName?: string;
    brandSlogan?: string;
    usp?: string;
    coreValues?: string[];
  };
  targetAudience?: {
    primaryAge?: string;
    gender?: string;
    interests?: string[];
    painPoints?: string[];
  };
  verbalIdentity?: {
    toneOfVoice?: string[];
    keyMessages?: string[];
    forbiddenWords?: string[];
  };
  visualIdentity?: {
    designTone?: string;
  };
}

/**
 * Full context required to generate a single shortform script.
 */
export interface ShortformGenerationContext {
  /** Shortform type identifier (e.g. 'hook_product', 'how_to_tutorial') */
  shortformType: string;
  /** Relevant Brand DNA layers */
  brandContext: ShortformBrandContext;
  /** Copy style id (e.g. 'ogilvy', 'burnett') */
  copyStyle: string;
  /** Design tone id (e.g. 'modern_minimal', 'premium_luxury') */
  designTone: string;
  /** Product or service name to feature */
  productName?: string;
  /** Target keywords */
  keywords?: string[];
  /** Free-form additional instructions */
  additionalPrompt?: string;
  /** Trend or challenge reference — primarily used for trend_challenge type */
  trendReference?: string;
}

/**
 * Individual scene definition in the generated shortform script.
 */
export interface ShortformScene {
  /** Scene sequential number (1-based) */
  sceneNumber: number;
  /** Duration string, e.g. "0-3초" */
  duration: string;
  /** 나레이션/대사 텍스트 */
  narration: string;
  /** 화면 구성 설명 */
  visualDescription: string;
  /** 화면에 표시할 텍스트 오버레이 */
  textOverlay?: string;
  /** 전환 효과 (예: "컷", "스와이프", "줌인") */
  transition?: string;
}

/**
 * Final shortform script generation result.
 */
export interface ShortformScriptResult {
  /** 첫 3초 훅 문장 */
  hookLine: string;
  /** 영상 제목 */
  title: string;
  /** 씬 배열 */
  scenes: ShortformScene[];
  /** CTA 문구 */
  cta: string;
  /** 자막 배열 (씬 순서대로) */
  subtitles: string[];
  /** 추천 해시태그 (15개) */
  hashtags: string[];
  /** BGM 추천 키워드 */
  bgmSuggestion?: string;
  /** 예상 총 길이 (예: "약 25초") */
  totalDuration: string;
  /** 추천 플랫폼 (TikTok/YouTube Shorts/Instagram Reels) */
  platform: string;
}

/**
 * Parameters for generateShortformContent().
 */
export interface GenerateShortformParams {
  context: ShortformGenerationContext;
  /** Used only for token tracking — omit when calling from unauthenticated contexts */
  meta?: { userId: string; projectId: string };
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

// ── Copy style tone descriptors (Korean — adapted for shortform brevity) ──────
// Shortform versions are punchier and more concise than blog-generator equivalents.
const COPY_STYLE_INSTRUCTIONS: Record<string, string> = {
  ogilvy:
    '데이비드 오길비 스타일: 구체적인 숫자와 팩트로 설득하라. 나레이션에 핵심 수치를 자연스럽게 녹여라. 짧은 시간 안에 신뢰를 구축하는 근거 기반 화법.',
  burnett:
    '레오 버넷 스타일: 일상의 따뜻한 순간에서 시작하라. 진솔하고 인간적인 톤으로 공감을 유도하라. 과장 없이 진심으로 다가가는 스토리텔링.',
  bernbach:
    '빌 번바크 스타일: 예상을 비틀어라. 짧고 강한 한 줄로 임팩트를 남겨라. 반전 구조를 활용하고, 모든 군더더기를 걷어내라.',
  clow:
    '리 클로우 스타일: 선언적이고 대담한 톤. 브랜드의 존재 이유를 강하게 외쳐라. 시청자에게 영감과 소속감을 동시에 선사하는 매니페스토 화법.',
  lee_jeseok:
    '이제석 스타일: 한 줄이 전부다. 군더더기 없이 핵심만. 화면과 텍스트가 합쳐져 하나의 완결된 메시지가 되게 하라.',
  brunch_essay:
    '브런치 에세이 스타일: 짧은 문장과 긴 문장을 리드미컬하게 교차하라. 시적이고 사색적인 나레이션. 시청자가 한 줄씩 음미할 수 있게.',
  kurly:
    '마켓컬리 스타일: 오감을 자극하는 감각적 디테일. 원산지, 생산자, 재료의 이야기를 구체적으로. 시청자가 질감과 향을 상상할 수 있게 묘사하라.',
  editorial:
    '에디토리얼 스타일: 쿨하고 절제된 톤. 영어 단어를 자연스럽게 믹스. 형용사 최소화, 명사와 동사로 밀도 있게. 설명하지 말고 보여줘라.',
};

// ── Type-specific prompt instructions (Korean) ──────────────────────────────────

/**
 * Return type-specific Korean instructions for the shortform type.
 * These are injected into the Phase 1 system prompt to guide scene structure.
 */
function getShortformTypeInstructions(type: string): string {
  const instructions: Record<string, string> = {
    hook_product:
      '제품의 가장 매력적인 특징을 3초 안에 보여주는 훅으로 시작하라. ' +
      '핵심 USP를 1~2개만 집중 전달하라. ' +
      '시각적 임팩트가 강한 제품 클로즈업을 활용하라. ' +
      '과도한 정보 전달보다 한 가지 메시지에 집중. ' +
      '마지막 씬에서 제품명과 CTA를 동시에 노출하라.',

    how_to_tutorial:
      '실용적 문제 해결로 시작하라. "이거 아직도 이렇게 하세요?" 같은 질문 훅 활용. ' +
      '각 스텝은 간결하고 따라하기 쉽게 구성하라. ' +
      '숫자로 단계를 명확히 구분하라 (Step 1, Step 2...). ' +
      '마지막에 전후 비교로 효과를 증명하라. ' +
      '화면에 핵심 포인트를 텍스트 오버레이로 강조하라.',

    myth_buster:
      '충격적인 오해/미신으로 시작하여 호기심을 유발하라. ' +
      '"이거 진짜라고 믿고 계세요?" 같은 도발적 훅. ' +
      '과학적 근거나 전문가 의견을 인용하라. ' +
      '❌→✅ 시각적 전환으로 반전 효과를 연출하라. ' +
      '진실 설명 후 자연스럽게 제품/서비스로 연결하라. ' +
      '자막은 크고 명확하게, 핵심 팩트를 강조하라.',

    before_after_reveal:
      'Before 상태를 시청자가 공감할 수 있도록 구체적으로 묘사하라. ' +
      '"솔직히 이거 너무 심했거든요" 같은 솔직한 훅으로 시작. ' +
      '제품/서비스 적용 과정을 간단히 보여줘라. ' +
      'After 공개는 극적인 트랜지션(스와이프, 줌아웃 등)으로 연출하라. ' +
      '구체적 수치/기간을 텍스트 오버레이로 표시하라 (예: "3일 후", "1주 사용 결과"). ' +
      '동일 앵글/조명으로 비교의 신뢰도를 높여라.',

    trend_challenge:
      '현재 유행하는 트렌드 포맷을 활용하라. ' +
      '인기 사운드/음악을 기반으로 한 구성을 제안하라. ' +
      '브랜드/제품을 트렌드에 자연스럽게 녹여내되, 반전 요소를 추가하라. ' +
      '참여를 유도하는 챌린지 해시태그를 생성하라. ' +
      '시청자가 따라 하고 싶게 만드는 간결한 포맷을 유지하라. ' +
      '브랜드 색깔이 드러나는 차별화된 변형을 제안하라.',
  };

  return instructions[type] ?? instructions['hook_product'];
}

// ── System prompt builders ─────────────────────────────────────────────────────

/**
 * Build the Phase 1 (Haiku) system prompt for shortform script generation.
 * Defines the writer's role, type-specific rules, copy style, and JSON schema.
 */
function buildPhase1SystemPrompt(
  shortformType: string,
  copyStyle: string,
  designTone: string
): string {
  const config = getShortformTypeConfig(shortformType as ShortformType);
  const typeInstructions = getShortformTypeInstructions(shortformType);

  const styleInstruction =
    COPY_STYLE_INSTRUCTIONS[copyStyle] ??
    COPY_STYLE_INSTRUCTIONS['burnett'];

  // 씬 구조 가이드 (from type config)
  const structureGuide = config
    ? config.structure.map((step, i) => `${i + 1}. ${step}`).join('\n')
    : '1. Hook (0-3초)\n2. 본문 (3-20초)\n3. CTA (20-30초)';

  const durationGuide = config
    ? `${config.durationRange.min}~${config.durationRange.max}초`
    : '15~30초';

  const sceneCountGuide = config
    ? `${config.sceneCount.min}~${config.sceneCount.max}개`
    : '3~5개';

  const platformTips = config
    ? config.platformTips.map((tip) => `- ${tip}`).join('\n')
    : '- 첫 3초 안에 훅 필수\n- 세로형 9:16 비율';

  const hashtagRule = config?.hashtagRule ?? '총 15개 해시태그 (대형 5 + 중형 5 + 니치 5)';

  return `너는 BrandHelix의 숏폼(틱톡/유튜브 숏츠/인스타그램 릴스) 전문 스크립트 라이터이다.
브랜드 DNA를 기반으로 "${config?.nameKo ?? shortformType}" 유형의 숏폼 스크립트를 작성하는 것이 임무이다.

## 이 콘텐츠의 목적
${config?.purpose ?? '브랜드 메시지를 숏폼 영상으로 전달'}

## 카피 스타일 지침 (최우선 적용)
${styleInstruction}

## 디자인 톤
${designTone} 스타일에 맞는 시각적 분위기를 화면 구성 설명에 반영하라.

## 유형별 작성 지침
${typeInstructions}

## 보편적 숏폼 작성 규칙

### 훅 (첫 3초) — hookLine
- 스크롤을 멈추게 하는 강렬한 첫 문장
- 유형: 충격적 질문 / 놀라운 사실 / 도발적 선언 / 감정 공감
- 30자 이내로 간결하게
- 이 한 줄이 영상의 시청 유지율을 결정한다

### 나레이션 (narration)
- 자연스러운 구어체 사용 (문어체 금지)
- 한 씬당 나레이션 2~3문장 이내
- 말하는 듯한 리듬감 유지
- 전문 용어는 쉽게 풀어서 설명

### 텍스트 오버레이 (textOverlay)
- 한 줄 15자 이내 (가독성)
- 핵심 키워드만 추출하여 표시
- 이모지 1~2개 적절히 활용 가능

### 자막 (subtitles)
- 나레이션과 1:1 대응
- 한 줄 15자 이내, 최대 2줄까지
- 시청자가 소리 없이도 내용을 파악할 수 있게

### CTA (행동 유도)
- 영상 마지막에 명확한 행동 유도
- 팔로우 / 좋아요 / 댓글 / 링크 클릭 중 택 1
- 브랜드 톤에 맞는 자연스러운 표현

### 해시태그 규칙
- ${hashtagRule}
- 총 15개: 대형(100만+) 5개 + 중형(10만~100만) 5개 + 니치(1만~10만) 5개
- 브랜드 고유 해시태그 1개 포함
- # 기호 포함하여 반환

### 금기 사항
- "안녕하세요, [브랜드]입니다" 형식의 시작
- 과장 광고 문구 (혁명적, 전례 없는, 최강의)
- 근거 없는 효능 주장
- 딱딱한 문어체 나레이션
- 5초 이상 정적인 화면 구성

## 씬 구조 가이드 (순서대로 따를 것)
${structureGuide}

## 플랫폼 팁
${platformTips}

## 영상 길이 목표
${durationGuide}

## 씬 개수
${sceneCountGuide}

## 응답 형식 (JSON만 반환, 다른 텍스트 없음)
{
  "hookLine": "첫 3초 훅 문장",
  "title": "영상 제목",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "0-3초",
      "narration": "나레이션 텍스트",
      "visualDescription": "화면 구성 설명",
      "textOverlay": "화면 표시 텍스트",
      "transition": "컷"
    }
  ],
  "cta": "CTA 문구",
  "subtitles": ["자막1", "자막2"],
  "hashtags": ["#해시태그1", "#해시태그2"],
  "bgmSuggestion": "BGM 추천 키워드/분위기",
  "totalDuration": "약 25초",
  "platform": "TikTok"
}`;
}

/**
 * Build the Phase 2 (Sonnet) system prompt for quality refinement.
 * Focuses on brand tone consistency, hook strength, and subtitle readability.
 */
function buildPhase2SystemPrompt(copyStyle: string): string {
  return `너는 BrandHelix의 숏폼 콘텐츠 품질 전문가이다.
Haiku가 작성한 숏폼 스크립트 초안을 브랜드 톤에 맞게 다듬어라.

## 품질 체크리스트 (모든 항목 점검 필수)

1. **훅 강도**: 첫 3초 훅이 충분히 강렬한가? 스크롤을 멈출 만한 임팩트가 있는가?
   - 약하다면 더 도발적이거나 감성적인 훅으로 재작성하라
2. **나레이션 자연스러움**: 구어체인가? 실제로 말하는 듯한 리듬감이 있는가?
   - 문어체가 섞여 있다면 구어체로 전환하라
3. **씬 전환 매끄러움**: 씬 간 전환이 자연스러운가? 시각적 흐름이 끊기지 않는가?
   - 전환이 어색하면 트랜지션 효과를 조정하라
4. **CTA 명확성**: CTA가 명확하고 행동 유도적인가? 구체적인 액션이 있는가?
   - 모호하다면 더 구체적인 행동 문구로 교체하라
5. **금기어 검사**: 브랜드 금기어가 포함되지 않았는가?
   - 발견 시 대체 표현으로 즉시 교체하라
6. **자막 가독성**: 자막이 읽기 쉬운 길이인가? (한 줄 15자 이내)
   - 길면 분할하거나 축약하라
7. **해시태그 적절성**: 대형(5) + 중형(5) + 니치(5) 균형이 맞는가?
   - 부족하면 보충, 중복이면 교체하라
8. **카피 스타일 일관성**: "${copyStyle}" 스타일이 전체에 걸쳐 일관되게 적용되었는가?
   - 스타일에서 벗어난 부분을 수정하라
9. **영상 길이 적절성**: 각 씬 duration의 합이 전체 목표 길이와 일치하는가?
   - totalDuration 값을 씬 합산과 일치하도록 조정하라
10. **플랫폼 최적화**: 추천 플랫폼에 맞는 포맷과 특성이 반영되었는가?

## 카피 스타일 참고
카피 스타일: "${copyStyle}"
이 스타일의 특성을 나레이션, 훅, CTA 전반에 일관되게 적용하라.

## 응답 형식 (JSON만 반환, 다른 텍스트 없음)
{
  "hookLine": "최종 훅 문장",
  "title": "최종 영상 제목",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "0-3초",
      "narration": "최종 나레이션",
      "visualDescription": "최종 화면 구성",
      "textOverlay": "최종 텍스트 오버레이",
      "transition": "전환 효과"
    }
  ],
  "cta": "최종 CTA 문구",
  "subtitles": ["최종 자막1", "최종 자막2"],
  "hashtags": ["#해시태그1", "#해시태그2"],
  "bgmSuggestion": "BGM 추천",
  "totalDuration": "약 25초",
  "platform": "TikTok"
}`;
}

// ── User prompt builder ────────────────────────────────────────────────────────

/**
 * Build the user-turn message with brand context and task details
 * for Phase 1 (Haiku draft generation).
 */
function buildPhase1UserPrompt(context: ShortformGenerationContext): string {
  const {
    shortformType,
    brandContext,
    productName,
    keywords,
    additionalPrompt,
    trendReference,
  } = context;

  // Build the brand context section
  const brandSection = {
    companyIdentity: brandContext.companyIdentity ?? null,
    brandCore: brandContext.brandCore ?? null,
    targetAudience: brandContext.targetAudience ?? null,
    verbalIdentity: brandContext.verbalIdentity ?? null,
    visualIdentity: brandContext.visualIdentity ?? null,
  };

  // Build type-specific task details
  const taskDetails: Record<string, unknown> = {
    channel: 'shortform',
    shortformType,
    productName: productName ?? null,
    targetKeywords: keywords ?? [],
  };

  // trend_challenge 유형은 트렌드 참조 정보 추가
  if (shortformType === 'trend_challenge' && trendReference) {
    taskDetails.trendReference = trendReference;
  }

  const userMessage = {
    task: taskDetails,
    brandDNAContext: brandSection,
    forbiddenWords: brandContext.verbalIdentity?.forbiddenWords ?? [],
    additionalInstructions: additionalPrompt ?? null,
  };

  return JSON.stringify(userMessage, null, 2);
}

/**
 * Build the user-turn message for Phase 2 (Sonnet quality refinement).
 * Includes the Phase 1 draft and refinement context.
 */
function buildPhase2UserPrompt(
  draft: Record<string, unknown>,
  context: ShortformGenerationContext
): string {
  const config = getShortformTypeConfig(context.shortformType as ShortformType);

  const userMessage = {
    draft,
    refinementContext: {
      shortformType: context.shortformType,
      copyStyle: context.copyStyle,
      designTone: context.designTone,
      targetKeywords: context.keywords ?? [],
      forbiddenWords: context.brandContext.verbalIdentity?.forbiddenWords ?? [],
      durationTarget: config
        ? `${config.durationRange.min}~${config.durationRange.max}초`
        : '15~30초',
      sceneCountTarget: config
        ? `${config.sceneCount.min}~${config.sceneCount.max}개`
        : '3~5개',
    },
  };

  return JSON.stringify(userMessage, null, 2);
}

// ── Scene validation & normalization ───────────────────────────────────────────

/**
 * Validate and normalize a raw scene object from Claude JSON.
 * Returns a properly typed ShortformScene or null if invalid.
 */
function normalizeScene(raw: unknown, index: number): ShortformScene | null {
  if (!raw || typeof raw !== 'object') return null;

  const scene = raw as Record<string, unknown>;

  const narration = typeof scene.narration === 'string' ? scene.narration : '';
  const visualDescription =
    typeof scene.visualDescription === 'string' ? scene.visualDescription : '';

  // narration과 visualDescription 둘 다 비어있으면 무효 씬
  if (!narration && !visualDescription) return null;

  return {
    sceneNumber: typeof scene.sceneNumber === 'number' ? scene.sceneNumber : index + 1,
    duration: typeof scene.duration === 'string' ? scene.duration : `씬 ${index + 1}`,
    narration,
    visualDescription,
    textOverlay: typeof scene.textOverlay === 'string' ? scene.textOverlay : undefined,
    transition: typeof scene.transition === 'string' ? scene.transition : undefined,
  };
}

/**
 * Parse and validate the full shortform script result from Claude JSON.
 * Applies sensible defaults for missing optional fields.
 */
function parseShortformResult(json: Record<string, unknown>): ShortformScriptResult | null {
  // Required fields
  const hookLine = typeof json.hookLine === 'string' ? json.hookLine : '';
  const title = typeof json.title === 'string' ? json.title : '';
  const cta = typeof json.cta === 'string' ? json.cta : '';

  if (!hookLine && !title) {
    return null; // insufficient output
  }

  // Scenes array
  const rawScenes = Array.isArray(json.scenes) ? json.scenes : [];
  const scenes = rawScenes
    .map((s, i) => normalizeScene(s, i))
    .filter((s): s is ShortformScene => s !== null);

  if (scenes.length === 0) {
    return null; // no valid scenes
  }

  // Subtitles
  const subtitles = Array.isArray(json.subtitles)
    ? (json.subtitles as unknown[]).filter((s): s is string => typeof s === 'string')
    : scenes.map((s) => s.narration); // fallback: narration을 자막으로 사용

  // Hashtags (max 15)
  const hashtags = Array.isArray(json.hashtags)
    ? (json.hashtags as unknown[])
        .filter((h): h is string => typeof h === 'string')
        .slice(0, 15)
    : [];

  // Optional fields
  const bgmSuggestion = typeof json.bgmSuggestion === 'string' ? json.bgmSuggestion : undefined;
  const totalDuration = typeof json.totalDuration === 'string' ? json.totalDuration : '약 30초';
  const platform = typeof json.platform === 'string' ? json.platform : 'TikTok';

  return {
    hookLine,
    title,
    scenes,
    cta,
    subtitles,
    hashtags,
    bgmSuggestion,
    totalDuration,
    platform,
  };
}

// ── Main generation function ───────────────────────────────────────────────────

/**
 * Generate a full shortform script using 2-phase Claude generation.
 *
 * Phase 1 (Haiku): Produces a fast structural draft — establishes scenes,
 *                  narration flow, and content scaffold.
 * Phase 2 (Sonnet): Refines hook strength, narration naturalness, subtitle
 *                   readability, and brand voice consistency.
 *
 * @returns `{ data, error, tokensUsed, generationCost }` — data is null on failure.
 */
export async function generateShortformContent(
  params: GenerateShortformParams
): Promise<{
  data: ShortformScriptResult | null;
  error: string | null;
  tokensUsed: number;
  generationCost: number;
}> {
  const { context, meta } = params;
  const { shortformType, copyStyle, designTone } = context;

  // Validate shortform type
  const config = getShortformTypeConfig(shortformType as ShortformType);
  if (!config) {
    return {
      data: null,
      error: `Unknown shortform type: ${shortformType}`,
      tokensUsed: 0,
      generationCost: 0,
    };
  }

  const phase1SystemPrompt = buildPhase1SystemPrompt(shortformType, copyStyle, designTone);
  const phase1UserPrompt = buildPhase1UserPrompt(context);

  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let phase1JSON: Record<string, unknown> | null = null;

  // ── Phase 1: Haiku — fast structural draft ────────────────────────────────
  try {
    const claude: Anthropic = getClaudeClient();

    const phase1Response = await claude.messages.create({
      model: HAIKU,
      max_tokens: 2500,
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

    // Extract text content
    const p1TextBlock = phase1Response.content.find((b) => b.type === 'text');
    if (!p1TextBlock || p1TextBlock.type !== 'text') {
      return {
        data: null,
        error: 'Phase 1 (Haiku): Claude returned no text content',
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: calculateCost(HAIKU, totalTokensIn, totalTokensOut),
      };
    }

    phase1JSON = extractJSON(p1TextBlock.text);
    if (!phase1JSON) {
      return {
        data: null,
        error: 'Phase 1 (Haiku): Failed to extract JSON from response',
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: calculateCost(HAIKU, totalTokensIn, totalTokensOut),
      };
    }

    // Validate Phase 1 has minimum viable structure
    const phase1Result = parseShortformResult(phase1JSON);
    if (!phase1Result) {
      return {
        data: null,
        error: 'Phase 1 (Haiku): Generated script missing required fields (hookLine, title, or scenes)',
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: calculateCost(HAIKU, totalTokensIn, totalTokensOut),
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      data: null,
      error: `generateShortformContent Phase 1 failed: ${message}`,
      tokensUsed: totalTokensIn + totalTokensOut,
      generationCost: calculateCost(HAIKU, totalTokensIn, totalTokensOut),
    };
  }

  // ── Phase 2: Sonnet — quality refinement ──────────────────────────────────
  const phase2SystemPrompt = buildPhase2SystemPrompt(copyStyle);
  const phase2UserPrompt = buildPhase2UserPrompt(phase1JSON, context);

  try {
    const claude: Anthropic = getClaudeClient();

    const phase2Response = await claude.messages.create({
      model: SONNET,
      max_tokens: 3000,
      system: phase2SystemPrompt,
      messages: [{ role: 'user', content: phase2UserPrompt }],
    });

    const p2Usage = phase2Response.usage;
    totalTokensIn += p2Usage.input_tokens;
    totalTokensOut += p2Usage.output_tokens;

    // Token tracking
    if (meta) {
      await trackTokenUsage(meta.userId, meta.projectId, {
        model: SONNET,
        tokensIn: p2Usage.input_tokens,
        tokensOut: p2Usage.output_tokens,
        cost: calculateCost(SONNET, p2Usage.input_tokens, p2Usage.output_tokens),
      });
    }

    // Extract text content
    const p2TextBlock = phase2Response.content.find((b) => b.type === 'text');
    if (!p2TextBlock || p2TextBlock.type !== 'text') {
      // Fall back to Phase 1 result if Phase 2 returns no text
      const fallbackResult = parseShortformResult(phase1JSON);
      const p1Cost = calculateCost(
        HAIKU,
        totalTokensIn - p2Usage.input_tokens,
        totalTokensOut - p2Usage.output_tokens
      );
      return {
        data: fallbackResult,
        error: fallbackResult
          ? null
          : 'Phase 2 (Sonnet): Claude returned no text content, Phase 1 fallback also failed',
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: p1Cost + calculateCost(SONNET, p2Usage.input_tokens, p2Usage.output_tokens),
      };
    }

    const p2JSON = extractJSON(p2TextBlock.text);

    // Use Phase 2 result if valid, otherwise fall back to Phase 1
    const finalJSON = p2JSON ?? phase1JSON;
    const finalResult = parseShortformResult(finalJSON);

    // Calculate total cost across both phases
    const p1TokensIn = totalTokensIn - p2Usage.input_tokens;
    const p1TokensOut = totalTokensOut - p2Usage.output_tokens;
    const finalCost =
      calculateCost(HAIKU, p1TokensIn, p1TokensOut) +
      calculateCost(SONNET, p2Usage.input_tokens, p2Usage.output_tokens);

    if (!finalResult) {
      return {
        data: null,
        error: 'Both phases completed but failed to produce a valid shortform script',
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: finalCost,
      };
    }

    return {
      data: finalResult,
      error: null,
      tokensUsed: totalTokensIn + totalTokensOut,
      generationCost: finalCost,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Attempt to return Phase 1 result as fallback
    const fallbackResult = parseShortformResult(phase1JSON);
    const fallbackCost = calculateCost(HAIKU, totalTokensIn, totalTokensOut);

    if (fallbackResult) {
      return {
        data: fallbackResult,
        error: `Phase 2 failed (${message}), returning Phase 1 draft`,
        tokensUsed: totalTokensIn + totalTokensOut,
        generationCost: fallbackCost,
      };
    }

    return {
      data: null,
      error: `generateShortformContent Phase 2 failed: ${message}`,
      tokensUsed: totalTokensIn + totalTokensOut,
      generationCost: fallbackCost,
    };
  }
}

// ── Named re-exports for convenience ──────────────────────────────────────────
export { SHORTFORM_TYPES, getShortformTypeConfig };
export type { ShortformType };

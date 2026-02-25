// Instagram content types for BrandHelix Engine 3 — Channel Builder
// 인스타그램 콘텐츠 타입 정의 (1080×1350 / 4:5 비율 기준)

// ── Instagram type identifiers ─────────────────────────────────────────────────

export type InstagramType =
  | 'hero_product'       // 히어로 제품 이미지
  | 'info_card_carousel' // 정보 카드 캐러셀
  | 'routine_guide'      // 루틴 가이드
  | 'before_after'       // 비포/애프터
  | 'brand_mood'         // 브랜드 무드
  | 'event_promo';       // 이벤트/프로모션

// ── Instagram type configuration interface ────────────────────────────────────

export interface InstagramTypeConfig {
  /** Unique identifier matching InstagramType */
  id: InstagramType;
  /** English label */
  name: string;
  /** Korean label */
  nameKo: string;
  /** English purpose description */
  purpose: string;
  /** Korean purpose description (used in prompts and UI) */
  purposeKo: string;
  /** Output image dimensions in pixels (always 1080×1350 for feed) */
  imageSize: { width: number; height: number };
  /** Number of carousel slides (single-image types use min=max=1) */
  slideCount: { min: number; max: number };
  /** Korean rules for the post caption */
  captionRule: string;
  /** Korean rules for hashtag selection and count */
  hashtagRule: string;
}

// ── Instagram type configurations ─────────────────────────────────────────────

export const INSTAGRAM_TYPES: readonly InstagramTypeConfig[] = [
  {
    id: 'hero_product',
    name: 'Hero Product Image',
    nameKo: '히어로 제품 이미지',
    purpose: 'Maximize the core product visual as a single hero image',
    purposeKo:
      '제품의 핵심 비주얼을 극대화한 메인 이미지. 제품명과 핵심 가치를 강렬하게 전달하며, ' +
      '브랜드의 첫인상을 결정하는 대표 이미지로 활용된다. 시선을 압도하는 단 하나의 비주얼로 완결.',
    imageSize: { width: 1080, height: 1350 },
    slideCount: { min: 1, max: 1 },
    captionRule:
      '첫 줄에 제품의 핵심 가치나 혜택을 한 문장으로 압축. 두 번째 줄부터 제품 특징을 ' +
      '2~3가지 간결하게 나열. 마지막에 프로필 링크 유도 CTA 삽입. 전체 500자 이내.',
    hashtagRule:
      '제품 카테고리 해시태그 3~5개 + 브랜드 고유 해시태그 1개 + 감성/라이프스타일 ' +
      '해시태그 2~3개. 총 8~12개 이내. 본문 하단에 줄바꿈 후 배치.',
  },
  {
    id: 'info_card_carousel',
    name: 'Info Card Carousel',
    nameKo: '정보 카드 캐러셀',
    purpose:
      'Deliver structured information in a swipeable multi-slide card format',
    purposeKo:
      '정보를 카드 형태의 슬라이드로 나누어 제공하는 캐러셀. 첫 장에서 주제를 제시하고 ' +
      '이후 슬라이드에서 세부 정보를 전달. 저장률과 공유율이 높은 교육형 콘텐츠 포맷.',
    imageSize: { width: 1080, height: 1350 },
    slideCount: { min: 3, max: 7 },
    captionRule:
      '첫 줄에 "이 글을 저장해두세요 👇" 또는 "알아두면 유용한 정보" 등 저장 유도 문구. ' +
      '캐러셀 내용을 한 줄로 요약. 슬라이드 수 언급 (예: "총 5장"). CTA로 마무리. 400자 이내.',
    hashtagRule:
      '정보성 해시태그 3~4개 (예: #뷰티팁 #스킨케어정보) + 주제 키워드 해시태그 3~4개 + ' +
      '브랜드 해시태그 1개. 총 8~10개.',
  },
  {
    id: 'routine_guide',
    name: 'Routine Guide',
    nameKo: '루틴 가이드',
    purpose: 'Explain step-by-step product usage routines across multiple slides',
    purposeKo:
      '스텝별 사용법과 루틴을 단계적으로 안내하는 가이드 콘텐츠. 각 슬라이드가 하나의 ' +
      '단계를 담당하며, 사용자가 제품을 올바르게 활용할 수 있도록 돕는다. ' +
      '신규 고객 온보딩과 재구매 유도에 효과적.',
    imageSize: { width: 1080, height: 1350 },
    slideCount: { min: 3, max: 5 },
    captionRule:
      '제목에 "OO 루틴 완성 가이드" 또는 "N단계로 완성하는 OO" 형식 사용. ' +
      '각 단계의 핵심만 1~2문장으로 요약. 제품 구매 링크 CTA 포함. 300자 이내.',
    hashtagRule:
      '루틴/사용법 관련 해시태그 3~4개 (예: #스킨케어루틴 #아침루틴) + 제품 카테고리 ' +
      '해시태그 2~3개 + 브랜드 해시태그 1개. 총 7~9개.',
  },
  {
    id: 'before_after',
    name: 'Before / After',
    nameKo: '비포/애프터',
    purpose: 'Show product effectiveness through compelling before and after comparison',
    purposeKo:
      '사용 전후 비교를 통해 제품의 효과를 직관적으로 전달하는 콘텐츠. ' +
      '실제 변화를 시각적으로 보여주어 신뢰도와 전환율을 높인다. ' +
      '리뷰 및 사례 기반 콘텐츠로 소셜 프루프 역할을 한다.',
    imageSize: { width: 1080, height: 1350 },
    slideCount: { min: 2, max: 3 },
    captionRule:
      '변화의 핵심 수치나 결과를 첫 줄에 강조 (예: "2주 만에 달라진 모공 크기"). ' +
      '사용 기간, 사용 방법 간략히 안내. 후기 인용 가능. 진정성 있는 어조 유지. ' +
      '구매 링크 CTA로 마무리. 400자 이내.',
    hashtagRule:
      '효과/결과 관련 해시태그 3~4개 (예: #전후비교 #피부변화) + 피부/뷰티 고민 ' +
      '해시태그 2~3개 + 브랜드 해시태그 1개. 총 7~10개.',
  },
  {
    id: 'brand_mood',
    name: 'Brand Mood',
    nameKo: '브랜드 무드',
    purpose: 'Convey brand atmosphere and emotional identity through mood imagery',
    purposeKo:
      '브랜드 분위기와 감성을 전달하는 무드 이미지. 직접적인 제품 판매보다 브랜드 ' +
      '아이덴티티와 세계관을 구축하는 데 집중. 브랜드 팬층 형성과 감성적 연결에 효과적.',
    imageSize: { width: 1080, height: 1350 },
    slideCount: { min: 1, max: 2 },
    captionRule:
      '브랜드의 철학이나 가치관을 담은 짧고 감성적인 문장. 시적이거나 선언적인 어조 사용. ' +
      '제품 언급은 최소화하고 감성과 분위기 중심으로 서술. 200자 이내로 간결하게.',
    hashtagRule:
      '감성/무드 해시태그 4~5개 (예: #브랜드무드 #감성스타그램) + 라이프스타일 ' +
      '해시태그 2~3개 + 브랜드 고유 해시태그 1개. 총 8~10개.',
  },
  {
    id: 'event_promo',
    name: 'Event / Promotion',
    nameKo: '이벤트/프로모션',
    purpose: 'Drive immediate action through discount, event, or promotional announcements',
    purposeKo:
      '할인, 이벤트, 프로모션을 알리는 안내 이미지. 기간 한정 특가, 신제품 론칭, ' +
      '공동구매 등 즉각적인 행동을 유도하는 콘텐츠. 명확한 혜택과 CTA가 핵심.',
    imageSize: { width: 1080, height: 1350 },
    slideCount: { min: 1, max: 3 },
    captionRule:
      '첫 줄에 할인율 또는 이벤트 핵심 혜택을 굵게 강조 (이모지 활용 권장). ' +
      '이벤트 기간, 참여 방법, 조건을 명확히 안내. 긴급성 유도 문구 포함 ' +
      '(예: "선착순 50명"). 프로필 링크 클릭 CTA로 마무리. 300자 이내.',
    hashtagRule:
      '이벤트/할인 해시태그 3~4개 (예: #특가세일 #한정수량) + 제품 카테고리 ' +
      '해시태그 2~3개 + 브랜드 해시태그 1개. 총 7~9개.',
  },
] as const;

// ── Lookup helper ──────────────────────────────────────────────────────────────

/**
 * Find an InstagramTypeConfig by its InstagramType id.
 * Returns undefined if the id is not recognised.
 *
 * @example
 * const config = getInstagramTypeConfig('hero_product');
 * if (config) {
 *   console.log(config.slideCount); // { min: 1, max: 1 }
 * }
 */
export function getInstagramTypeConfig(
  id: InstagramType
): InstagramTypeConfig | undefined {
  return INSTAGRAM_TYPES.find((t) => t.id === id);
}

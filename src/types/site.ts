// Site template types for BrandHelix Engine 3 — Channel Builder (Site Builder)
// 판매사이트 템플릿 타입 및 섹션 정의

import type { DesignToneId } from '@/types/style';

// ── Site Template Types ─────────────────────────────────────────────────────

/** 사이트 템플릿 유형 — 4종 */
export type SiteTemplateType =
  | 'product_landing'   // 제품 랜딩페이지
  | 'brand_story_page'  // 브랜드 스토리 페이지
  | 'service_showcase'  // 서비스 쇼케이스
  | 'event_promotion';  // 이벤트/프로모션 페이지

export interface SiteTemplateConfig {
  /** Unique identifier matching SiteTemplateType */
  id: SiteTemplateType;
  /** English label */
  name: string;
  /** Korean label */
  nameKo: string;
  /** Korean description of the template */
  description: string;
  /** 기본 섹션 구성 (순서대로 렌더링) */
  sections: SiteSectionType[];
  /** 권장 섹션 수 */
  recommendedSections: number;
  /** 이 템플릿의 목적 (Korean) */
  purpose: string;
}

// ── Section Types ───────────────────────────────────────────────────────────

/** 사이트 섹션 유형 — 10종 */
export type SiteSectionType =
  | 'hero'            // 히어로 배너
  | 'features'        // 특장점 그리드
  | 'product_detail'  // 제품 상세
  | 'testimonials'    // 고객 후기
  | 'faq'             // FAQ 아코디언
  | 'cta'             // CTA 섹션
  | 'brand_story'     // 브랜드 스토리
  | 'gallery'         // 이미지 갤러리
  | 'pricing'         // 가격표
  | 'footer';         // 푸터

export interface SiteSectionConfig {
  /** Section type identifier */
  type: SiteSectionType;
  /** English label */
  name: string;
  /** Korean label */
  nameKo: string;
  /** Korean description */
  description: string;
  /** 필요한 카피 키 목록 (반드시 포함해야 하는 필드) */
  requiredCopy: string[];
  /** 선택적 카피 키 목록 (있으면 좋지만 필수 아님) */
  optionalCopy: string[];
}

// ── Site Template Input ─────────────────────────────────────────────────────

/** 사이트 생성 요청 시 필요한 입력 */
export interface SiteGenerateInput {
  projectId: string;
  template: SiteTemplateType;
  designTone: DesignToneId;
  copyStyle?: string;
  /** 사용자가 원하는 섹션 구성 (미지정 시 템플릿 기본값 사용) */
  customSections?: SiteSectionType[];
  /** 추가 지시사항 */
  additionalPrompt?: string;
}

// ── Site Template Configurations ────────────────────────────────────────────

export const SITE_TEMPLATES: readonly SiteTemplateConfig[] = [
  {
    id: 'product_landing',
    name: 'Product Landing',
    nameKo: '제품 랜딩페이지',
    description:
      '하나의 제품/서비스를 집중 소개하고 구매/문의 전환을 유도하는 랜딩페이지',
    sections: [
      'hero',
      'features',
      'product_detail',
      'testimonials',
      'faq',
      'cta',
      'footer',
    ],
    recommendedSections: 7,
    purpose: '제품의 핵심 가치를 전달하고 구매 전환율을 극대화',
  },
  {
    id: 'brand_story_page',
    name: 'Brand Story',
    nameKo: '브랜드 스토리 페이지',
    description:
      '브랜드의 철학, 역사, 가치를 전달하는 스토리텔링 중심 페이지',
    sections: [
      'hero',
      'brand_story',
      'features',
      'testimonials',
      'gallery',
      'cta',
      'footer',
    ],
    recommendedSections: 7,
    purpose: '브랜드에 대한 신뢰와 공감을 구축',
  },
  {
    id: 'service_showcase',
    name: 'Service Showcase',
    nameKo: '서비스 쇼케이스',
    description:
      '여러 서비스/솔루션을 체계적으로 소개하고 비교할 수 있는 페이지',
    sections: [
      'hero',
      'features',
      'pricing',
      'testimonials',
      'faq',
      'cta',
      'footer',
    ],
    recommendedSections: 7,
    purpose: '서비스의 차별점을 명확히 전달하고 문의를 유도',
  },
  {
    id: 'event_promotion',
    name: 'Event Promotion',
    nameKo: '이벤트/프로모션 페이지',
    description:
      '한정 이벤트, 세일, 론칭 등을 홍보하는 긴급성 중심 페이지',
    sections: [
      'hero',
      'product_detail',
      'features',
      'cta',
      'faq',
      'footer',
    ],
    recommendedSections: 6,
    purpose: '긴급감을 조성하고 즉시 행동(참여/구매)을 유도',
  },
] as const;

// ── Site Section Configurations ─────────────────────────────────────────────

export const SITE_SECTIONS: readonly SiteSectionConfig[] = [
  {
    type: 'hero',
    name: 'Hero Banner',
    nameKo: '히어로 배너',
    description: '페이지 최상단 대형 배너. 강렬한 헤드라인과 CTA 버튼으로 첫인상 결정',
    requiredCopy: ['headline', 'subheadline', 'ctaText'],
    optionalCopy: ['ctaSubtext'],
  },
  {
    type: 'features',
    name: 'Features',
    nameKo: '특장점',
    description: '3~4개 핵심 특장점을 그리드 레이아웃으로 시각화',
    requiredCopy: ['sectionTitle'],
    optionalCopy: [
      'sectionSubtitle',
      'feature1Title', 'feature1Description',
      'feature2Title', 'feature2Description',
      'feature3Title', 'feature3Description',
      'feature4Title', 'feature4Description',
    ],
  },
  {
    type: 'product_detail',
    name: 'Product Detail',
    nameKo: '제품 상세',
    description: '제품/서비스 상세 정보를 이미지와 함께 풍부하게 전달',
    requiredCopy: ['headline', 'bodyText'],
    optionalCopy: ['specs', 'ingredients', 'benefits'],
  },
  {
    type: 'testimonials',
    name: 'Testimonials',
    nameKo: '고객 후기',
    description: '고객 리뷰/추천사로 소셜 프루프(social proof) 구축',
    requiredCopy: ['sectionTitle'],
    optionalCopy: [
      'testimonial1', 'testimonial1Author',
      'testimonial2', 'testimonial2Author',
      'testimonial3', 'testimonial3Author',
    ],
  },
  {
    type: 'faq',
    name: 'FAQ',
    nameKo: '자주 묻는 질문',
    description: '아코디언 형태의 FAQ로 고객 의문을 선제적으로 해소',
    requiredCopy: ['sectionTitle'],
    optionalCopy: [
      'q1', 'a1', 'q2', 'a2', 'q3', 'a3',
      'q4', 'a4', 'q5', 'a5',
    ],
  },
  {
    type: 'cta',
    name: 'Call to Action',
    nameKo: 'CTA',
    description: '전환 유도 섹션. 명확한 행동 버튼과 설득 카피로 전환율 극대화',
    requiredCopy: ['headline', 'ctaText'],
    optionalCopy: ['subheadline', 'ctaSubtext'],
  },
  {
    type: 'brand_story',
    name: 'Brand Story',
    nameKo: '브랜드 스토리',
    description: '브랜드 철학, 역사, 가치를 스토리텔링으로 전달',
    requiredCopy: ['headline', 'bodyText'],
    optionalCopy: ['quote', 'quoteAuthor', 'milestones'],
  },
  {
    type: 'gallery',
    name: 'Image Gallery',
    nameKo: '이미지 갤러리',
    description: '제품/브랜드 이미지를 그리드 레이아웃으로 시각적으로 전시',
    requiredCopy: ['sectionTitle'],
    optionalCopy: ['sectionSubtitle'],
  },
  {
    type: 'pricing',
    name: 'Pricing',
    nameKo: '가격표',
    description: '요금제/가격을 비교 테이블로 보여주고 최적 선택을 유도',
    requiredCopy: ['sectionTitle'],
    optionalCopy: [
      'plan1Name', 'plan1Price', 'plan1Features',
      'plan2Name', 'plan2Price', 'plan2Features',
      'plan3Name', 'plan3Price', 'plan3Features',
    ],
  },
  {
    type: 'footer',
    name: 'Footer',
    nameKo: '푸터',
    description: '연락처, 소셜 링크, 카피라이트 등 필수 정보를 하단에 배치',
    requiredCopy: ['copyright'],
    optionalCopy: ['companyName', 'address', 'email', 'phone', 'socialLinks'],
  },
] as const;

// ── Lookup Helpers ──────────────────────────────────────────────────────────

/**
 * Find a SiteTemplateConfig by its SiteTemplateType id.
 * Returns undefined if the id is not recognised.
 *
 * @example
 * const config = getSiteTemplateConfig('product_landing');
 * if (config) {
 *   console.log(config.sections); // ['hero', 'features', ...]
 * }
 */
export function getSiteTemplateConfig(
  id: SiteTemplateType
): SiteTemplateConfig | undefined {
  return SITE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Find a SiteSectionConfig by its SiteSectionType.
 * Returns undefined if the type is not recognised.
 *
 * @example
 * const section = getSiteSectionConfig('hero');
 * if (section) {
 *   console.log(section.requiredCopy); // ['headline', 'subheadline', 'ctaText']
 * }
 */
export function getSiteSectionConfig(
  type: SiteSectionType
): SiteSectionConfig | undefined {
  return SITE_SECTIONS.find((s) => s.type === type);
}

/**
 * 주어진 템플릿의 모든 섹션에 필요한 카피 키 목록을 반환.
 * 사이트 생성 시 어떤 카피를 생성해야 하는지 확인할 때 사용.
 */
export function getRequiredCopyKeys(
  templateId: SiteTemplateType
): { section: SiteSectionType; requiredCopy: string[]; optionalCopy: string[] }[] {
  const template = getSiteTemplateConfig(templateId);
  if (!template) return [];

  return template.sections
    .map((sectionType) => {
      const sectionConfig = getSiteSectionConfig(sectionType);
      if (!sectionConfig) return null;
      return {
        section: sectionType,
        requiredCopy: [...sectionConfig.requiredCopy],
        optionalCopy: [...sectionConfig.optionalCopy],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

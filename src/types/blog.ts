// Blog content types for BrandHelix Engine 2 — Content Generator

// ── Blog type identifiers ─────────────────────────────────────────────────────
export type BlogType =
  | 'seo_filler'
  | 'science_series'
  | 'lifestyle_empathy'
  | 'comparison_guide'
  | 'brand_story';

// ── Blog type configuration interface ─────────────────────────────────────────
export interface BlogTypeConfig {
  id: BlogType;
  name: string;           // English label
  nameKo: string;         // Korean label
  purpose: string;        // English purpose description
  purposeKo: string;      // Korean purpose description (used in prompts)
  structure: string[];    // Ordered list of content structure steps
  lengthRange: {
    min: number;          // Minimum character count (한글 기준)
    max: number;          // Maximum character count
  };
  imageSpec: {
    width: number;        // Thumbnail width (px)
    height: number;       // Thumbnail height (px)
    count: string;        // Recommended image count description (e.g. "2~3장")
  };
  titleRule: string;      // Korean formatting rules for the title
  example: string;        // Example blog title in Korean
}

// ── Blog type configurations ───────────────────────────────────────────────────
export const BLOG_TYPES: readonly BlogTypeConfig[] = [
  {
    id: 'seo_filler',
    name: 'SEO Filler Content',
    nameKo: 'SEO 필러 콘텐츠',
    purpose: 'Drive organic search traffic through keyword-centric articles',
    purposeKo:
      '검색 유입을 목적으로 하는 키워드 중심의 정보성 아티클. 타겟 키워드 기반으로 검색 상위 노출을 노리며, 방문자를 자연스럽게 구매 퍼널로 유입시킨다.',
    structure: [
      '타겟 키워드를 제목과 첫 단락에 자연스럽게 배치',
      '핵심 질문 2~3가지를 소제목으로 구성 (독자의 검색 의도 커버)',
      '각 소제목 아래 300~400자 분량의 설명 작성',
      '중간에 관련 제품/서비스 자연스러운 언급 (전체의 20% 이하)',
      '내부 링크 2개 이상 삽입 (관련 블로그 글 또는 제품 페이지)',
      '하단에 CTA (상담, 무료 체험, 제품 보기 등)',
      '메타 디스크립션 150자 이내 작성',
    ],
    lengthRange: { min: 1500, max: 2000 },
    imageSpec: { width: 1200, height: 628, count: '2~3장' },
    titleRule:
      '40자 이내, 타겟 키워드를 앞부분에 배치, 숫자(예: "5가지", "3단계") 또는 의문문 형식 사용',
    example:
      '콜라겐 부스터 세럼, 피부 탄력에 실제로 효과 있을까? 성분 전문가가 분석했습니다',
  },
  {
    id: 'science_series',
    name: 'Science / Ingredient Series',
    nameKo: '성분/과학 시리즈',
    purpose:
      'Establish expertise through in-depth ingredient or science-based series articles',
    purposeKo:
      '브랜드의 전문성을 포지셔닝하는 성분·연구·기술 기반 시리즈 아티클. 독자에게 과학적 근거를 제공하고, 브랜드를 전문가로 인식시킨다. 시리즈 형태로 구독 및 재방문을 유도한다.',
    structure: [
      '시리즈 번호 및 시리즈명 명시 (예: [성분 바이블 #3])',
      '이번 편에서 다루는 성분/기술 한 가지를 명확히 선언',
      '성분의 과학적 정의 및 작용 메커니즘 설명 (출처 또는 연구 인용)',
      '소비자가 자주 오해하는 점 반박 또는 Q&A 형식 삽입',
      '자사 제품에 해당 성분이 어떻게 적용되었는지 자연스럽게 연결',
      '다음 편 예고 문구로 시리즈 구독 유도',
      '하단 CTA: 성분 함유 제품 보러 가기 / 전문 상담 받기',
    ],
    lengthRange: { min: 1500, max: 2500 },
    imageSpec: { width: 1200, height: 628, count: '3~4장' },
    titleRule:
      '40자 이내, 시리즈명 태그 앞에 표기, 성분명 또는 기술명 포함, 전문성 신호 단어 사용 (연구, 분석, 성분, 원리)',
    example:
      '[성분 바이블 #3] 레티놀 vs 레티날: 피부과 전문의가 밝히는 진짜 차이점',
  },
  {
    id: 'lifestyle_empathy',
    name: 'Lifestyle Empathy',
    nameKo: '라이프스타일 공감 콘텐츠',
    purpose:
      'Build emotional connection and social sharing through relatable lifestyle stories',
    purposeKo:
      '타겟 고객의 일상과 감성에 공감하는 라이프스타일 아티클. SNS 공유를 유도하고, 브랜드를 삶의 일부로 자연스럽게 스며들게 한다. 판매보다 관계 형성에 집중한다.',
    structure: [
      '독자의 일상 속 특정 순간 또는 감정에서 시작 (공감 훅)',
      '그 감정이나 상황을 섬세하게 묘사하는 2~3개 단락',
      '자연스러운 전환: "그런 날, 나는 OOO를 발견했다"',
      '제품/브랜드가 어떻게 그 감정을 해소하거나 향상시켰는지 서술',
      '비주얼 이미지 설명 또는 감각적 묘사 삽입 (색감, 향, 질감 등)',
      '독자에게 자신의 이야기를 댓글로 나누도록 유도하는 마무리',
      '해시태그 3~5개 추천',
    ],
    lengthRange: { min: 1000, max: 1500 },
    imageSpec: { width: 1200, height: 800, count: '3~5장' },
    titleRule:
      '40자 이내, 독자의 감정 또는 상황을 직접 겨냥, 의문문·2인칭·감탄 형식 선호, 숫자 최소화',
    example: '퇴근 후 혼자 마시는 차 한 잔, 당신의 하루 마무리는 어떤가요?',
  },
  {
    id: 'comparison_guide',
    name: 'Comparison / Guide',
    nameKo: '비교·가이드 콘텐츠',
    purpose:
      'Maximize conversion by helping readers make purchase decisions through comparison tables and guides',
    purposeKo:
      '구매 전환율이 가장 높은 콘텐츠 유형. 경쟁 제품 또는 대안을 객관적으로 비교하고, 비교 테이블을 포함하여 독자가 최선의 선택을 내리도록 돕는다. 자사 제품의 강점을 자연스럽게 부각시킨다.',
    structure: [
      '비교 대상 명확히 선언 (A vs B, 또는 OO 고르는 법)',
      '비교 기준 항목 3~5가지 정의 (예: 성분, 가격, 효과, 사용감, 지속력)',
      '비교 테이블 삽입 (마크다운 테이블 형식)',
      '각 기준별 상세 설명 (단락 형태로 표 아래 보충)',
      '자사 제품이 어떤 기준에서 우위에 있는지 객관적 어조로 서술',
      '중간 CTA: 자사 제품 무료 샘플 또는 상세 페이지 링크',
      '"이런 분께 추천" 세그먼트별 추천 정리',
      '하단 CTA: 지금 바로 시작하기 / 전문가에게 문의',
    ],
    lengthRange: { min: 1500, max: 2000 },
    imageSpec: { width: 1200, height: 628, count: '2~3장' },
    titleRule:
      '40자 이내, "vs", "비교", "차이", "어떤 게 맞을까" 등 비교 시그널 포함, 구체적 대상 명시',
    example:
      '닥터자르트 vs 라로슈포제: 민감성 피부라면 어떤 선크림을 골라야 할까?',
  },
  {
    id: 'brand_story',
    name: 'Brand Story / Behind the Brand',
    nameKo: '브랜드 스토리·비하인드',
    purpose:
      'Build brand loyalty and emotional connection through authentic brand narrative',
    purposeKo:
      '브랜드의 탄생 배경, 창업자 철학, 제품 개발 스토리 등 진정성 있는 이야기로 충성 고객을 형성한다. 브랜드를 단순한 제품이 아닌 가치와 스토리를 가진 존재로 인식시킨다.',
    structure: [
      '브랜드 탄생의 결정적 순간 또는 창업자의 문제의식에서 시작',
      '그 문제를 해결하기 위해 어떤 여정을 거쳤는지 서술 (실패, 도전 포함)',
      '핵심 제품/서비스가 어떻게 탄생했는지 구체적 에피소드',
      '브랜드가 지키고자 하는 가치 또는 철학 명확히 선언',
      '고객의 삶에 어떤 변화를 만들고 싶은지 브랜드 비전 공유',
      '비하인드 사진, 초기 프로토타입, 팀 이야기 등 인간적 요소 삽입',
      '마무리: 독자를 브랜드 여정의 일부로 초대하는 메시지',
    ],
    lengthRange: { min: 1000, max: 2000 },
    imageSpec: { width: 1200, height: 800, count: '4~6장' },
    titleRule:
      '40자 이내, 창업자·브랜드·제품의 고유한 스토리 신호 포함, 감성적이고 진정성 있는 어조, 숫자보다 스토리 중심',
    example:
      '피부 트러블로 눈물짓던 밤, 그 시작이 브랜드가 되었습니다',
  },
] as const;

// ── Legacy body types (kept for backward compatibility with existing components) ─
export interface BlogSection {
  heading: string;
  body: string;
}

export interface BlogBody {
  title: string;
  metaDescription: string;
  slug: string;
  sections: BlogSection[];
  conclusion: string;
  cta: string;
  tags: string[];
  estimatedReadTime: number; // minutes
}

export interface GeneratedBlog {
  blogType: BlogType;
  copyStyle: string;
  designTone: string;
  title: string;
  body: BlogBody;
  keywords: string[];
  tokensUsed: number;
  generationCost: number;
}

// ── Lookup helper ──────────────────────────────────────────────────────────────
/**
 * Find a BlogTypeConfig by its BlogType id.
 * Returns undefined if the id is not recognised.
 */
export function getBlogTypeConfig(id: BlogType): BlogTypeConfig | undefined {
  return BLOG_TYPES.find((t) => t.id === id);
}

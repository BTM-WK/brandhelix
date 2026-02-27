// Shortform content types for BrandHelix Engine 3 — Channel Builder
// 숏폼(틱톡/유튜브 Shorts) 콘텐츠 타입 정의 (세로형 9:16 비율 기준)

// ── Shortform type identifiers ───────────────────────────────────────────────

export type ShortformType =
  | 'hook_product'        // 제품 소개 훅
  | 'how_to_tutorial'     // 사용법/튜토리얼
  | 'myth_buster'         // 오해와 진실
  | 'before_after_reveal' // 비포애프터 공개
  | 'trend_challenge';    // 트렌드/챌린지

// ── Shortform type configuration interface ───────────────────────────────────

export interface ShortformTypeConfig {
  /** Unique identifier matching ShortformType */
  id: ShortformType;
  /** English label */
  name: string;
  /** Korean label */
  nameKo: string;
  /** Korean description (2-3 sentences, used in prompts and UI) */
  description: string;
  /** Korean purpose description */
  purpose: string;
  /** Ordered list of scene flow steps with time annotations */
  structure: string[];
  /** Duration range in seconds */
  durationRange: { min: number; max: number };
  /** Number of scenes */
  sceneCount: { min: number; max: number };
  /** Platform-specific tips in Korean */
  platformTips: string[];
  /** Korean string describing hashtag strategy */
  hashtagRule: string;
}

// ── Shortform type configurations ────────────────────────────────────────────

export const SHORTFORM_TYPES: readonly ShortformTypeConfig[] = [
  {
    id: 'hook_product',
    name: 'Hook + Product Highlight',
    nameKo: '제품 소개 훅',
    description:
      '강력한 훅으로 시선을 잡고, 제품의 핵심 가치를 빠르게 전달하는 숏폼. ' +
      '첫 3초의 임팩트가 전체 시청 유지율을 결정하며, 짧은 시간 안에 구매 욕구를 자극한다.',
    purpose: '시선을 사로잡는 훅으로 시작, 제품의 핵심 가치를 빠르게 전달',
    structure: [
      'Hook (0-3초)',
      '제품 등장 (3-10초)',
      '핵심 효과 (10-20초)',
      'CTA (20-30초)',
    ],
    durationRange: { min: 15, max: 30 },
    sceneCount: { min: 3, max: 5 },
    platformTips: [
      '첫 3초 안에 강력한 훅 필수',
      '텍스트 오버레이로 핵심 메시지 강조',
      '세로형 풀스크린 촬영',
    ],
    hashtagRule:
      '제품 카테고리 해시태그 2~3개 + 인기 트렌드 해시태그 2~3개 + 브랜드 고유 해시태그 1개. ' +
      '총 5~7개. 캡션 하단에 배치.',
  },
  {
    id: 'how_to_tutorial',
    name: 'How-to Tutorial',
    nameKo: '사용법 튜토리얼',
    description:
      '제품 사용법을 단계별로 보여주는 실용형 튜토리얼 숏폼. ' +
      '각 단계를 명확히 구분하여 따라 하기 쉽게 구성하며, 저장률과 공유율이 높은 포맷이다. ' +
      '시청자에게 실질적 가치를 제공하여 브랜드 신뢰를 구축한다.',
    purpose: '제품 사용법을 단계별로 보여주며 실용적 가치를 전달',
    structure: [
      '문제 제기 (0-5초)',
      'Step 1 (5-15초)',
      'Step 2 (15-30초)',
      'Step 3 (30-45초)',
      '결과/CTA (45-60초)',
    ],
    durationRange: { min: 30, max: 60 },
    sceneCount: { min: 4, max: 7 },
    platformTips: [
      '숫자 카운트다운으로 단계 표시',
      '핸즈온 클로즈업 필수',
      '마지막에 전후 비교',
    ],
    hashtagRule:
      '사용법/팁 해시태그 2~3개 (예: #사용법 #꿀팁) + 제품 카테고리 해시태그 2~3개 + ' +
      '브랜드 해시태그 1개. 총 6~8개.',
  },
  {
    id: 'myth_buster',
    name: 'Myth Buster',
    nameKo: '오해와 진실',
    description:
      '흔한 오해를 깨뜨리며 전문성을 보여주는 정보형 숏폼. ' +
      '놀라운 팩트로 시작해 반전을 주고, 과학적·전문적 근거로 신뢰를 구축한다. ' +
      '브랜드를 해당 분야의 전문가로 포지셔닝하는 데 효과적이다.',
    purpose: '흔한 오해를 깨며 전문성을 보여주고 브랜드 신뢰도 구축',
    structure: [
      '오해 제시 (0-5초)',
      '반전 (5-10초)',
      '진실 설명 (10-30초)',
      '제품 연결 (30-40초)',
      'CTA (40-45초)',
    ],
    durationRange: { min: 15, max: 45 },
    sceneCount: { min: 3, max: 6 },
    platformTips: [
      '❌/✅ 시각적 대비 효과',
      '자막 크게, 읽기 쉽게',
      '놀라운 팩트로 시작',
    ],
    hashtagRule:
      '정보성 해시태그 2~3개 (예: #오해와진실 #팩트체크) + 주제 키워드 해시태그 2~3개 + ' +
      '브랜드 해시태그 1개. 총 6~8개.',
  },
  {
    id: 'before_after_reveal',
    name: 'Before & After Reveal',
    nameKo: '비포애프터 공개',
    description:
      '사용 전후의 극적인 변화를 보여주는 시연형 숏폼. ' +
      '동일한 앵글과 조명으로 비교하여 제품의 실질적 효과를 증명하며, ' +
      '시각적 충격으로 높은 조회수와 공유를 유도한다.',
    purpose: '변화/효과를 극적으로 시연하여 제품의 실질적 효과를 증명',
    structure: [
      'Before 상태 (0-5초)',
      '사용/적용 과정 (5-15초)',
      'After 공개 (15-25초)',
      'CTA (25-30초)',
    ],
    durationRange: { min: 15, max: 30 },
    sceneCount: { min: 3, max: 5 },
    platformTips: [
      '같은 앵글/조명으로 비교',
      '변환 트랜지션 효과 활용',
      '자막으로 시간/사용량 표시',
    ],
    hashtagRule:
      '효과/변화 해시태그 2~3개 (예: #비포애프터 #변화챌린지) + 제품 카테고리 해시태그 2~3개 + ' +
      '브랜드 해시태그 1개. 총 6~8개.',
  },
  {
    id: 'trend_challenge',
    name: 'Trend / Challenge',
    nameKo: '트렌드/챌린지',
    description:
      '인기 트렌드나 챌린지에 브랜드를 자연스럽게 녹여내는 참여형 숏폼. ' +
      '유행하는 사운드와 포맷을 활용하되, 브랜드만의 반전 요소를 추가하여 ' +
      '바이럴 확산과 브랜드 인지도 향상을 동시에 노린다.',
    purpose: '인기 트렌드에 브랜드를 자연스럽게 녹여 바이럴 확산 유도',
    structure: [
      '트렌드 인트로 (0-3초)',
      '참여/변형 (3-15초)',
      '브랜드 반전 (15-25초)',
      'CTA/해시태그 (25-30초)',
    ],
    durationRange: { min: 15, max: 30 },
    sceneCount: { min: 3, max: 5 },
    platformTips: [
      '인기 사운드/음악 활용',
      '트렌드 해시태그 필수',
      '브랜드 해시태그도 함께',
    ],
    hashtagRule:
      '트렌드 해시태그 3~4개 (해당 챌린지/트렌드 고유 태그 포함) + 브랜드 해시태그 1개 + ' +
      '관련 카테고리 해시태그 1~2개. 총 6~8개.',
  },
] as const;

// ── Lookup helper ──────────────────────────────────────────────────────────────

/**
 * Find a ShortformTypeConfig by its ShortformType id.
 * Returns undefined if the id is not recognised.
 *
 * @example
 * const config = getShortformTypeConfig('hook_product');
 * if (config) {
 *   console.log(config.durationRange); // { min: 15, max: 30 }
 * }
 */
export function getShortformTypeConfig(
  id: ShortformType
): ShortformTypeConfig | undefined {
  return SHORTFORM_TYPES.find((t) => t.id === id);
}

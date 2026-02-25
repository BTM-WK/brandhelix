export const COPY_STYLES = [
  {
    id: 'ogilvy',
    name: 'David Ogilvy',
    nameKo: '데이비드 오길비',
    traits: 'Facts + numbers, long copy OK',
    description: '데이터와 팩트 중심, 설득력 있는 긴 카피',
    example: '73%의 소비자가 선택한 이유, 바로 여기에 있습니다.',
  },
  {
    id: 'burnett',
    name: 'Leo Burnett',
    nameKo: '레오 버넷',
    traits: 'Everyday stories, warm, honest',
    description: '일상의 이야기, 따뜻하고 진솔한 톤',
    example: '엄마가 만들어주던 그 맛, 그대로 담았습니다.',
  },
  {
    id: 'bernbach',
    name: 'Bill Bernbach',
    nameKo: '빌 번바크',
    traits: 'Unexpected twist, short impact',
    description: '예상을 뒤집는 반전, 짧고 강한 임팩트',
    example: '작게 생각하세요. (Think Small)',
  },
  {
    id: 'clow',
    name: 'Lee Clow',
    nameKo: '리 클로우',
    traits: 'Manifesto, bold, inspirational',
    description: '선언적 매니페스토, 대담하고 영감을 주는',
    example: '다르게 생각하라. 세상을 바꿀 수 있다고 믿는 사람들에게.',
  },
  {
    id: 'lee_jeseok',
    name: '이제석',
    nameKo: '이제석 스타일',
    traits: 'One line + one visual = complete',
    description: '한 줄 카피 + 하나의 비주얼로 완결',
    example: '이 광고는 버려진 현수막으로 만들었습니다.',
  },
  {
    id: 'brunch_essay',
    name: '브런치 에세이',
    nameKo: '브런치 에세이',
    traits: 'Poetic, short/long mix, tasteful',
    description: '시적인 문체, 짧고 긴 문장의 조화, 감각적',
    example: '커피 한 잔의 여유. 그것이 하루를 바꾸는 시작이었다.',
  },
  {
    id: 'kurly',
    name: '마켓컬리',
    nameKo: '마켓컬리 스타일',
    traits: 'Sensory details, origin stories',
    description: '감각적 디테일, 원산지와 생산자 스토리',
    example: '새벽 4시, 경북 영주 사과밭에서 갓 수확한 꿀사과.',
  },
  {
    id: 'editorial',
    name: '무신사/29CM',
    nameKo: '에디토리얼',
    traits: 'Cool, English mix, minimal adj',
    description: '쿨한 톤, 영어 믹스, 형용사 최소화',
    example: 'Less is more. 이번 시즌, 우리가 제안하는 단 하나의 룩.',
  },
] as const;

export const DESIGN_TONES = [
  {
    id: 'modern_minimal',
    name: '모던 미니멀',
    colorScheme: 'Monochrome + 1 accent',
    description: '흑백 베이스에 포인트 컬러 하나',
    colors: ['#000000', '#FFFFFF', '#333333', '#F5F5F5'],
    accentExample: '#FF4444',
  },
  {
    id: 'natural_organic',
    name: '내추럴 오가닉',
    colorScheme: 'Earth tones, cream BG',
    description: '자연의 색감, 크림 배경, 부드러운 느낌',
    colors: ['#F5F0E8', '#8B7355', '#6B8E4E', '#D4C5A9'],
    accentExample: '#6B8E4E',
  },
  {
    id: 'clinical_science',
    name: '클리니컬 사이언스',
    colorScheme: 'White + blue/green point',
    description: '깨끗한 화이트 베이스, 블루/그린 포인트',
    colors: ['#FFFFFF', '#F8FAFB', '#0066CC', '#00AA88'],
    accentExample: '#0066CC',
  },
  {
    id: 'premium_luxury',
    name: '프리미엄 럭셔리',
    colorScheme: 'Dark + gold/rose gold',
    description: '다크 배경에 골드/로즈골드 포인트',
    colors: ['#1A1A1A', '#2D2D2D', '#C9A96E', '#B76E79'],
    accentExample: '#C9A96E',
  },
  {
    id: 'friendly_casual',
    name: '친근 캐주얼',
    colorScheme: 'Bright multi-color, pastel',
    description: '밝고 다채로운 파스텔 컬러',
    colors: ['#FFE5E5', '#E5F0FF', '#FFF3E5', '#E5FFE5'],
    accentExample: '#FF6B6B',
  },
  {
    id: 'bold_energetic',
    name: '볼드 에너제틱',
    colorScheme: 'High-contrast, neon',
    description: '고대비, 네온 컬러, 강렬한 인상',
    colors: ['#000000', '#FF0055', '#00FF88', '#FFEE00'],
    accentExample: '#FF0055',
  },
] as const;

export type CopyStyleId = typeof COPY_STYLES[number]['id'];
export type DesignToneId = typeof DESIGN_TONES[number]['id'];

// Industry options for project creation
export const INDUSTRIES = [
  '뷰티/화장품',
  '패션/의류',
  '식품/음료',
  'IT/테크',
  '교육',
  '건강/의료',
  '금융/보험',
  '부동산',
  '여행/숙박',
  '엔터테인먼트',
  '스포츠/피트니스',
  '인테리어/가구',
  '반려동물',
  '자동차',
  '기타',
] as const;

export type IndustryType = typeof INDUSTRIES[number];

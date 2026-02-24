// Copy style and design tone constants

export const COPY_STYLES = [
  { id: 'ogilvy', name: 'David Ogilvy', traits: 'Facts + numbers, long copy OK' },
  { id: 'burnett', name: 'Leo Burnett', traits: 'Everyday stories, warm, honest' },
  { id: 'bernbach', name: 'Bill Bernbach', traits: 'Unexpected twist, short impact' },
  { id: 'clow', name: 'Lee Clow', traits: 'Manifesto, bold, inspirational' },
  { id: 'lee_jeseok', name: '이제석 스타일', traits: 'One line + one visual = complete' },
  { id: 'brunch_essay', name: '브런치 에세이', traits: 'Poetic, short/long mix, tasteful' },
  { id: 'kurly', name: '마켓컬리 스타일', traits: 'Sensory details, origin stories' },
  { id: 'editorial', name: '무신사/29CM 에디토리얼', traits: 'Cool, English mix, minimal adj' },
] as const;

export const DESIGN_TONES = [
  { id: 'modern_minimal', name: '모던 미니멀', colorScheme: 'Monochrome + 1 accent' },
  { id: 'natural_organic', name: '내추럴 오가닉', colorScheme: 'Earth tones, cream BG' },
  { id: 'clinical_science', name: '클리니컬 사이언스', colorScheme: 'White + blue/green point' },
  { id: 'premium_luxury', name: '프리미엄 럭셔리', colorScheme: 'Dark + gold/rose gold' },
  { id: 'friendly_casual', name: '친근 캐주얼', colorScheme: 'Bright multi-color, pastel' },
  { id: 'bold_energetic', name: '볼드 에너제틱', colorScheme: 'High-contrast, neon' },
] as const;

export type CopyStyleId = typeof COPY_STYLES[number]['id'];
export type DesignToneId = typeof DESIGN_TONES[number]['id'];

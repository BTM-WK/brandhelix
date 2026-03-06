// Design Token System for BrandHelix Engine 3 — Site Builder
// 6종 디자인 톤을 CSS Custom Properties로 매핑하는 디자인 토큰 시스템

import type { DesignToneId } from '@/types/style';

// ── Design Token Interface ──────────────────────────────────────────────────

/** CSS Custom Properties로 변환되는 사이트 디자인 토큰 */
export interface SiteDesignTokens {
  // Colors
  '--color-bg': string;
  '--color-bg-secondary': string;
  '--color-text': string;
  '--color-text-muted': string;
  '--color-accent': string;
  '--color-accent-hover': string;
  '--color-border': string;
  // Typography
  '--font-heading': string;
  '--font-body': string;
  '--font-size-hero': string;
  '--font-size-h1': string;
  '--font-size-h2': string;
  '--font-size-h3': string;
  '--font-size-body': string;
  '--font-size-small': string;
  '--font-weight-heading': string;
  '--font-weight-body': string;
  // Spacing
  '--spacing-section': string;
  '--spacing-element': string;
  '--border-radius': string;
  // Effects
  '--shadow-card': string;
  '--shadow-button': string;
  '--transition': string;
}

// ── Design Tone Token Maps ──────────────────────────────────────────────────
// style.ts의 DESIGN_TONES 색상값을 기반으로 각 톤에 맞는 토큰 세트 정의

const TOKEN_MAP: Record<DesignToneId, SiteDesignTokens> = {
  /** 모던 미니멀: 흑백 모노크롬 + 포인트 컬러 1개, 깔끔한 그림자, 직선적 보더 */
  modern_minimal: {
    '--color-bg': '#FFFFFF',
    '--color-bg-secondary': '#F5F5F5',
    '--color-text': '#1A1A1A',
    '--color-text-muted': '#666666',
    '--color-accent': '#FF4444',
    '--color-accent-hover': '#E03333',
    '--color-border': '#E5E5E5',
    '--font-heading': "'Inter', 'Noto Sans KR', sans-serif",
    '--font-body': "'Inter', 'Noto Sans KR', sans-serif",
    '--font-size-hero': '3.5rem',
    '--font-size-h1': '2.5rem',
    '--font-size-h2': '1.75rem',
    '--font-size-h3': '1.25rem',
    '--font-size-body': '1rem',
    '--font-size-small': '0.875rem',
    '--font-weight-heading': '700',
    '--font-weight-body': '400',
    '--spacing-section': '5rem',
    '--spacing-element': '1.5rem',
    '--border-radius': '4px',
    '--shadow-card': '0 1px 3px rgba(0, 0, 0, 0.08)',
    '--shadow-button': '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--transition': 'all 0.2s ease',
  },

  /** 내추럴 오가닉: 어스톤, 따뜻한 세리프/산세리프 혼합, 부드러운 그림자, 둥근 보더 */
  natural_organic: {
    '--color-bg': '#FAF7F2',
    '--color-bg-secondary': '#F5F0E8',
    '--color-text': '#3D3528',
    '--color-text-muted': '#8B7355',
    '--color-accent': '#6B8E4E',
    '--color-accent-hover': '#5A7A40',
    '--color-border': '#D4C5A9',
    '--font-heading': "'Georgia', 'Noto Serif KR', serif",
    '--font-body': "'Noto Sans KR', sans-serif",
    '--font-size-hero': '3rem',
    '--font-size-h1': '2.25rem',
    '--font-size-h2': '1.625rem',
    '--font-size-h3': '1.25rem',
    '--font-size-body': '1rem',
    '--font-size-small': '0.875rem',
    '--font-weight-heading': '600',
    '--font-weight-body': '400',
    '--spacing-section': '4.5rem',
    '--spacing-element': '1.5rem',
    '--border-radius': '12px',
    '--shadow-card': '0 2px 8px rgba(139, 115, 85, 0.1)',
    '--shadow-button': '0 2px 4px rgba(139, 115, 85, 0.08)',
    '--transition': 'all 0.3s ease',
  },

  /** 클리니컬 사이언스: 화이트/블루, 시스템 폰트, 최소 그림자, 정밀한 보더 */
  clinical_science: {
    '--color-bg': '#FFFFFF',
    '--color-bg-secondary': '#F8FAFB',
    '--color-text': '#1B2A3D',
    '--color-text-muted': '#5A7085',
    '--color-accent': '#0066CC',
    '--color-accent-hover': '#0055AA',
    '--color-border': '#DCE4EB',
    '--font-heading': "'Inter', 'Noto Sans KR', system-ui, sans-serif",
    '--font-body': "'Inter', 'Noto Sans KR', system-ui, sans-serif",
    '--font-size-hero': '3rem',
    '--font-size-h1': '2.25rem',
    '--font-size-h2': '1.625rem',
    '--font-size-h3': '1.25rem',
    '--font-size-body': '0.9375rem',
    '--font-size-small': '0.8125rem',
    '--font-weight-heading': '600',
    '--font-weight-body': '400',
    '--spacing-section': '4rem',
    '--spacing-element': '1.25rem',
    '--border-radius': '6px',
    '--shadow-card': '0 1px 2px rgba(0, 102, 204, 0.06)',
    '--shadow-button': 'none',
    '--transition': 'all 0.15s ease',
  },

  /** 프리미엄 럭셔리: 다크 배경 + 골드, 세리프 악센트, 강한 그림자, 최소 반경 */
  premium_luxury: {
    '--color-bg': '#1A1A1A',
    '--color-bg-secondary': '#2D2D2D',
    '--color-text': '#F5F1EA',
    '--color-text-muted': '#A89B8C',
    '--color-accent': '#C9A96E',
    '--color-accent-hover': '#D4B97E',
    '--color-border': '#3D3D3D',
    '--font-heading': "'Playfair Display', 'Noto Serif KR', serif",
    '--font-body': "'Noto Sans KR', sans-serif",
    '--font-size-hero': '3.5rem',
    '--font-size-h1': '2.5rem',
    '--font-size-h2': '1.75rem',
    '--font-size-h3': '1.25rem',
    '--font-size-body': '1rem',
    '--font-size-small': '0.875rem',
    '--font-weight-heading': '700',
    '--font-weight-body': '300',
    '--spacing-section': '5rem',
    '--spacing-element': '1.75rem',
    '--border-radius': '2px',
    '--shadow-card': '0 4px 16px rgba(0, 0, 0, 0.3)',
    '--shadow-button': '0 2px 8px rgba(201, 169, 110, 0.2)',
    '--transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  /** 친근 캐주얼: 밝은 파스텔, 둥근 모서리, 장난스러운 그림자 */
  friendly_casual: {
    '--color-bg': '#FFFDF7',
    '--color-bg-secondary': '#FFF3E5',
    '--color-text': '#2D2D2D',
    '--color-text-muted': '#6B6B6B',
    '--color-accent': '#FF6B6B',
    '--color-accent-hover': '#FF5252',
    '--color-border': '#F0E0D0',
    '--font-heading': "'Noto Sans KR', 'Nunito', sans-serif",
    '--font-body': "'Noto Sans KR', 'Nunito', sans-serif",
    '--font-size-hero': '3rem',
    '--font-size-h1': '2.25rem',
    '--font-size-h2': '1.625rem',
    '--font-size-h3': '1.25rem',
    '--font-size-body': '1rem',
    '--font-size-small': '0.875rem',
    '--font-weight-heading': '700',
    '--font-weight-body': '400',
    '--spacing-section': '4rem',
    '--spacing-element': '1.5rem',
    '--border-radius': '16px',
    '--shadow-card': '0 4px 12px rgba(255, 107, 107, 0.1)',
    '--shadow-button': '0 3px 6px rgba(255, 107, 107, 0.15)',
    '--transition': 'all 0.25s ease',
  },

  /** 볼드 에너제틱: 고대비/네온, 굵은 웨이트, 그림자 없음, 직선 엣지 */
  bold_energetic: {
    '--color-bg': '#0A0A0A',
    '--color-bg-secondary': '#141414',
    '--color-text': '#FFFFFF',
    '--color-text-muted': '#B0B0B0',
    '--color-accent': '#FF0055',
    '--color-accent-hover': '#FF2266',
    '--color-border': '#333333',
    '--font-heading': "'Inter', 'Noto Sans KR', sans-serif",
    '--font-body': "'Inter', 'Noto Sans KR', sans-serif",
    '--font-size-hero': '4rem',
    '--font-size-h1': '2.75rem',
    '--font-size-h2': '2rem',
    '--font-size-h3': '1.375rem',
    '--font-size-body': '1rem',
    '--font-size-small': '0.875rem',
    '--font-weight-heading': '900',
    '--font-weight-body': '400',
    '--spacing-section': '5rem',
    '--spacing-element': '1.5rem',
    '--border-radius': '0px',
    '--shadow-card': 'none',
    '--shadow-button': 'none',
    '--transition': 'all 0.15s ease',
  },
} as const;

// ── Token Generation ────────────────────────────────────────────────────────

/**
 * 디자인 톤 ID를 기반으로 CSS Custom Properties 토큰 세트를 생성.
 * 인식할 수 없는 톤은 modern_minimal을 기본값으로 사용.
 *
 * @example
 * const tokens = generateDesignTokens('premium_luxury');
 * console.log(tokens['--color-bg']); // '#1A1A1A'
 */
export function generateDesignTokens(designTone: string): SiteDesignTokens {
  const toneId = designTone as DesignToneId;
  const tokens = TOKEN_MAP[toneId];

  if (!tokens) {
    // 알 수 없는 톤인 경우 modern_minimal 기본값 반환
    return { ...TOKEN_MAP.modern_minimal };
  }

  return { ...tokens };
}

// ── Conversion Utilities ────────────────────────────────────────────────────

/**
 * 토큰 객체를 CSS Custom Properties 문자열로 변환.
 * :root { } 블록 안에 삽입하거나 <style> 태그에 사용.
 *
 * @example
 * const css = designTokensToCss(tokens);
 * // Output:
 * //   --color-bg: #FFFFFF;
 * //   --color-bg-secondary: #F5F5F5;
 * //   ...
 */
export function designTokensToCss(tokens: SiteDesignTokens): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

/**
 * 토큰 객체를 일반 Record로 변환 (Supabase JSONB 저장용).
 *
 * @example
 * const record = designTokensToRecord(tokens);
 * await supabase.from('generated_sites').update({ design_tokens: record });
 */
export function designTokensToRecord(
  tokens: SiteDesignTokens
): Record<string, string> {
  return { ...tokens };
}

/**
 * Supabase에서 조회한 Record를 SiteDesignTokens로 변환.
 * 필수 키가 누락된 경우 modern_minimal 기본값으로 채움.
 */
export function recordToDesignTokens(
  record: Record<string, string>
): SiteDesignTokens {
  const defaults = TOKEN_MAP.modern_minimal;
  const result = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof SiteDesignTokens)[]) {
    if (record[key]) {
      result[key] = record[key];
    }
  }

  return result;
}

/**
 * :root 선택자를 포함한 완전한 CSS 블록을 생성.
 * 생성된 사이트의 <head>에 주입할 때 사용.
 *
 * @example
 * const styleBlock = generateCssBlock('natural_organic');
 * // Output:
 * // :root {
 * //   --color-bg: #FAF7F2;
 * //   ...
 * // }
 */
export function generateCssBlock(designTone: string): string {
  const tokens = generateDesignTokens(designTone);
  return `:root {\n${designTokensToCss(tokens)}\n}`;
}

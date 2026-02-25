// Blog thumbnail React component for Satori rendering.
// Server-side only — no 'use client'. Satori requires inline styles exclusively;
// Tailwind class names and CSS variables are NOT supported here.

import type { ReactNode } from 'react';
import { DESIGN_TONES, type DesignToneId } from '@/types/style';

// ── Color scheme resolved from a design tone ──────────────────────────────────

interface ToneColorScheme {
  background: string;
  backgroundAlt: string;   // secondary background (badge, bottom bar)
  textPrimary: string;     // main title color
  textSecondary: string;   // brand name / keyword chip text
  accent: string;          // badge background, decorative elements
  accentText: string;      // text that sits on the accent color
}

/**
 * Map a DesignToneId to concrete hex colors.
 * Falls back to modern_minimal when the id is unrecognised.
 */
function resolveToneColors(designTone: string): ToneColorScheme {
  switch (designTone as DesignToneId) {
    case 'modern_minimal':
      return {
        background: '#FFFFFF',
        backgroundAlt: '#F5F5F5',
        textPrimary: '#000000',
        textSecondary: '#333333',
        accent: '#FF4444',
        accentText: '#FFFFFF',
      };

    case 'natural_organic':
      return {
        background: '#F5F0E8',
        backgroundAlt: '#D4C5A9',
        textPrimary: '#8B7355',
        textSecondary: '#6B5E4A',
        accent: '#6B8E4E',
        accentText: '#FFFFFF',
      };

    case 'clinical_science':
      return {
        background: '#FFFFFF',
        backgroundAlt: '#F8FAFB',
        textPrimary: '#0D1B2A',
        textSecondary: '#4A5568',
        accent: '#0066CC',
        accentText: '#FFFFFF',
      };

    case 'premium_luxury':
      return {
        background: '#1A1A1A',
        backgroundAlt: '#2D2D2D',
        textPrimary: '#F5F5F0',
        textSecondary: '#C9A96E',
        accent: '#C9A96E',
        accentText: '#1A1A1A',
      };

    case 'friendly_casual':
      return {
        background: '#FFF3E5',
        backgroundAlt: '#FFE5E5',
        textPrimary: '#2D2D2D',
        textSecondary: '#555555',
        accent: '#FF6B6B',
        accentText: '#FFFFFF',
      };

    case 'bold_energetic':
      return {
        background: '#000000',
        backgroundAlt: '#111111',
        textPrimary: '#FFFFFF',
        textSecondary: '#FFEE00',
        accent: '#FF0055',
        accentText: '#FFFFFF',
      };

    default:
      // Fallback: modern_minimal
      return {
        background: '#FFFFFF',
        backgroundAlt: '#F5F5F5',
        textPrimary: '#000000',
        textSecondary: '#333333',
        accent: '#FF4444',
        accentText: '#FFFFFF',
      };
  }
}

// ── Korean display name for blog type ─────────────────────────────────────────

function blogTypeLabel(blogType: string): string {
  const labels: Record<string, string> = {
    seo_filler: 'SEO 정보 콘텐츠',
    science_series: '성분·과학 시리즈',
    lifestyle_empathy: '라이프스타일',
    comparison_guide: '비교·가이드',
    brand_story: '브랜드 스토리',
  };
  return labels[blogType] ?? blogType;
}

// ── Component props ───────────────────────────────────────────────────────────

export interface BlogThumbnailProps {
  /** Blog post title (displayed centered, large) */
  title: string;
  /** Blog type id from BlogType union */
  blogType: string;
  /** Optional brand name shown top-left */
  brandName?: string;
  /** Design tone id from DesignToneId union */
  designTone: string;
  /** Optional keyword chips displayed at the bottom */
  keywords?: string[];
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a 1200×630 Open Graph / blog thumbnail.
 *
 * Satori constraints respected:
 * - All layout uses flexbox (no CSS grid)
 * - All styles are inline objects (no className, no CSS variables)
 * - Fonts are loaded externally in the pipeline (Noto Sans KR)
 */
export function BlogThumbnail({
  title,
  blogType,
  brandName,
  designTone,
  keywords = [],
}: BlogThumbnailProps): ReactNode {
  const colors = resolveToneColors(designTone);
  const badgeLabel = blogTypeLabel(blogType);

  // Limit keyword chips to 4 to avoid overflow at 1200 wide
  const visibleKeywords = keywords.slice(0, 4);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        backgroundColor: colors.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── Top bar: brand name (left) + blog type badge (right) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '44px',
          paddingLeft: '60px',
          paddingRight: '60px',
          paddingBottom: '0px',
        }}
      >
        {/* Brand name */}
        <span
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: colors.textSecondary,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {brandName ?? ''}
        </span>

        {/* Blog type badge */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: colors.accent,
            color: colors.accentText,
            fontSize: '18px',
            fontWeight: 600,
            borderRadius: '6px',
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* ── Center: title ── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: '80px',
          paddingRight: '80px',
        }}
      >
        <span
          style={{
            fontSize: title.length > 30 ? '46px' : '56px',
            fontWeight: 800,
            color: colors.textPrimary,
            lineHeight: 1.35,
            textAlign: 'center',
            maxWidth: '960px',
          }}
        >
          {title}
        </span>
      </div>

      {/* ── Bottom bar: accent strip + keyword chips ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0px',
        }}
      >
        {/* Keyword chips row */}
        {visibleKeywords.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '12px',
              paddingLeft: '60px',
              paddingRight: '60px',
              paddingBottom: '24px',
              alignItems: 'center',
            }}
          >
            {visibleKeywords.map((kw) => (
              <span
                key={kw}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: colors.backgroundAlt,
                  color: colors.textSecondary,
                  fontSize: '18px',
                  fontWeight: 500,
                  borderRadius: '4px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                }}
              >
                # {kw}
              </span>
            ))}
          </div>
        )}

        {/* Accent bottom strip */}
        <div
          style={{
            display: 'flex',
            width: '1200px',
            height: '8px',
            backgroundColor: colors.accent,
          }}
        />
      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Convenience wrapper that returns the BlogThumbnail as a ReactNode.
 * Pass the result directly to generateImage() from satori-pipeline.ts.
 *
 * @example
 * import { renderBlogThumbnail } from '@/lib/image/blog-thumbnail';
 * import { generateImage } from '@/lib/image/satori-pipeline';
 *
 * const png = await generateImage(
 *   renderBlogThumbnail({ title: '...', blogType: 'seo_filler', designTone: 'modern_minimal' }),
 *   1200,
 *   630
 * );
 */
export function renderBlogThumbnail(props: BlogThumbnailProps): ReactNode {
  return <BlogThumbnail {...props} />;
}

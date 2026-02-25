// Instagram image templates — Satori-compatible React components.
// Server-side only. Satori requires inline styles exclusively;
// no className, no Tailwind, no CSS variables, no CSS grid.
// All layouts use flexbox. Canvas size: 1080×1350 px (4:5 ratio).

import type { ReactNode } from 'react';
import type { DesignToneId } from '@/types/style';
import type { InstagramType } from '@/types/instagram';

// ── Color scheme ──────────────────────────────────────────────────────────────

interface ToneColorScheme {
  background: string;
  backgroundAlt: string;  // secondary / card background
  textPrimary: string;    // main heading color
  textSecondary: string;  // sub-text / label color
  accent: string;         // badge, strip, highlight color
  accentText: string;     // text rendered on the accent background
}

/**
 * Resolve a DesignToneId to a concrete color palette.
 * Mirrors the logic in blog-thumbnail.tsx so tone colors stay consistent
 * across all generated image types.
 * Falls back to modern_minimal for unrecognised values.
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

// ── Shared template props ─────────────────────────────────────────────────────

export interface InstagramTemplateProps {
  /** Design tone id (e.g. 'modern_minimal') */
  designTone: string;
  /** Brand name shown in header or footer */
  brandName?: string;
  /** Primary title / heading */
  title?: string;
  /** Secondary subtitle below the title */
  subtitle?: string;
  /** Body / description text */
  bodyText?: string;
  /** Product name (hero_product, info_card_carousel) */
  productName?: string;
  /** Ordered step labels for routine_guide */
  steps?: string[];
  /** "Before" state label for before_after */
  beforeText?: string;
  /** "After" state label for before_after */
  afterText?: string;
  /** Event / promotion headline for event_promo */
  eventTitle?: string;
  /** Event date or period text for event_promo */
  eventDate?: string;
  /** Discount percentage or value text for event_promo */
  discount?: string;
  /** Current slide number (1-based) for carousel types */
  slideNumber?: number;
  /** Total slide count for carousel types */
  totalSlides?: number;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Render a slide-position indicator: "● ○ ○" style dots */
function SlideDots({
  current,
  total,
  activeColor,
  inactiveColor,
}: {
  current: number;
  total: number;
  activeColor: string;
  inactiveColor: string;
}): ReactNode {
  const dots = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        alignItems: 'center',
      }}
    >
      {dots.map((n) => (
        <div
          key={n}
          style={{
            width: n === current ? '16px' : '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: n === current ? activeColor : inactiveColor,
          }}
        />
      ))}
    </div>
  );
}

// ── Template 1: HeroProductTemplate ──────────────────────────────────────────
//
// Layout (top → bottom):
//   accent strip (top) | brand name (upper-left) |
//   product name (centre, large) | subtitle | bottom bar with brand

function HeroProductTemplate({
  designTone,
  brandName = '',
  title = '',
  subtitle = '',
  productName = '',
}: InstagramTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1350px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Accent top strip */}
      <div
        style={{
          display: 'flex',
          width: '1080px',
          height: '10px',
          backgroundColor: c.accent,
        }}
      />

      {/* Header: brand name */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: '48px',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
      </div>

      {/* Centre: product name (hero) */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: '80px',
          paddingRight: '80px',
        }}
      >
        {/* Product label badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: c.accent,
            color: c.accentText,
            fontSize: '22px',
            fontWeight: 600,
            borderRadius: '4px',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '28px',
            paddingRight: '28px',
            marginBottom: '40px',
          }}
        >
          NEW
        </div>

        {/* Product name */}
        <span
          style={{
            fontSize: productName.length > 12 ? '80px' : '100px',
            fontWeight: 800,
            color: c.textPrimary,
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {productName || title}
        </span>

        {/* Subtitle */}
        {(subtitle || title) && (
          <span
            style={{
              marginTop: '32px',
              fontSize: '30px',
              fontWeight: 400,
              color: c.textSecondary,
              textAlign: 'center',
              lineHeight: 1.55,
              maxWidth: '860px',
            }}
          >
            {subtitle || title}
          </span>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '60px',
          paddingTop: '0px',
        }}
      >
        <span
          style={{
            fontSize: '24px',
            fontWeight: 500,
            color: c.textSecondary,
            letterSpacing: '0.08em',
          }}
        >
          {brandName}
        </span>
        <div
          style={{
            display: 'flex',
            width: '48px',
            height: '4px',
            backgroundColor: c.accent,
          }}
        />
      </div>
    </div>
  );
}

// ── Template 2: InfoCardCarouselTemplate ──────────────────────────────────────
//
// Layout (top → bottom):
//   card number badge + brand (top) |
//   title (large, centre-left) |
//   body text (mid) |
//   slide indicator dots (bottom)

function InfoCardCarouselTemplate({
  designTone,
  brandName = '',
  title = '',
  bodyText = '',
  slideNumber = 1,
  totalSlides = 5,
}: InstagramTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1350px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '60px',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '0px',
        }}
      >
        {/* Slide number badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: c.accent,
            color: c.accentText,
            fontSize: '26px',
            fontWeight: 700,
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            justifyContent: 'center',
          }}
        >
          {slideNumber}
        </div>

        {/* Brand name */}
        <span
          style={{
            fontSize: '26px',
            fontWeight: 600,
            color: c.textSecondary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          marginTop: '48px',
          marginLeft: '70px',
          marginRight: '70px',
          height: '2px',
          backgroundColor: c.backgroundAlt,
        }}
      />

      {/* Title */}
      <div
        style={{
          display: 'flex',
          paddingTop: '56px',
          paddingLeft: '70px',
          paddingRight: '70px',
        }}
      >
        <span
          style={{
            fontSize: title.length > 18 ? '56px' : '68px',
            fontWeight: 800,
            color: c.textPrimary,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
      </div>

      {/* Body text */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          paddingTop: '40px',
          paddingLeft: '70px',
          paddingRight: '70px',
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            fontSize: '32px',
            fontWeight: 400,
            color: c.textSecondary,
            lineHeight: 1.7,
          }}
        >
          {bodyText}
        </span>
      </div>

      {/* Footer: dots */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '60px',
          paddingTop: '0px',
        }}
      >
        <SlideDots
          current={slideNumber}
          total={totalSlides}
          activeColor={c.accent}
          inactiveColor={c.backgroundAlt}
        />
        <span
          style={{
            fontSize: '24px',
            fontWeight: 500,
            color: c.textSecondary,
          }}
        >
          {slideNumber} / {totalSlides}
        </span>
      </div>
    </div>
  );
}

// ── Template 3: RoutineGuideTemplate ─────────────────────────────────────────
//
// Layout (top → bottom):
//   brand name (top) |
//   large step number circle (centre-left) |
//   step title + body |
//   progress bar (bottom)

function RoutineGuideTemplate({
  designTone,
  brandName = '',
  title = '',
  bodyText = '',
  steps = [],
  slideNumber = 1,
  totalSlides = 4,
}: InstagramTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  // Current step text: use steps array if provided, otherwise title
  const stepLabel = steps[slideNumber - 1] ?? title;
  const progressFraction = slideNumber / totalSlides;
  const progressWidth = Math.round(940 * progressFraction); // 1080 - 2×70px padding

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1350px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '60px',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: c.accent,
          }}
        >
          루틴 가이드
        </span>
      </div>

      {/* Step number (large circle) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingTop: '80px',
          paddingLeft: '70px',
          paddingRight: '70px',
          gap: '36px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: c.accent,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '52px',
              fontWeight: 800,
              color: c.accentText,
              lineHeight: 1,
            }}
          >
            {slideNumber}
          </span>
        </div>

        <span
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: c.textSecondary,
          }}
        >
          STEP {slideNumber}
        </span>
      </div>

      {/* Step title */}
      <div
        style={{
          display: 'flex',
          paddingTop: '48px',
          paddingLeft: '70px',
          paddingRight: '70px',
        }}
      >
        <span
          style={{
            fontSize: stepLabel.length > 16 ? '52px' : '64px',
            fontWeight: 800,
            color: c.textPrimary,
            lineHeight: 1.3,
          }}
        >
          {stepLabel}
        </span>
      </div>

      {/* Body text */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          paddingTop: '36px',
          paddingLeft: '70px',
          paddingRight: '70px',
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            fontSize: '30px',
            fontWeight: 400,
            color: c.textSecondary,
            lineHeight: 1.75,
          }}
        >
          {bodyText}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: c.textSecondary,
            }}
          >
            {slideNumber} / {totalSlides} 단계
          </span>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: c.accent,
            }}
          >
            {Math.round(progressFraction * 100)}%
          </span>
        </div>

        {/* Track */}
        <div
          style={{
            display: 'flex',
            width: '940px',
            height: '8px',
            backgroundColor: c.backgroundAlt,
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: `${progressWidth}px`,
              height: '8px',
              backgroundColor: c.accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Template 4: BeforeAfterTemplate ──────────────────────────────────────────
//
// Layout (top → bottom):
//   brand name + title (top) |
//   BEFORE half (dark overlay label, body text) |
//   horizontal divider line |
//   AFTER half (accent overlay label, body text)

function BeforeAfterTemplate({
  designTone,
  brandName = '',
  title = '',
  beforeText = '',
  afterText = '',
}: InstagramTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1350px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '60px',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '44px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
        {title && (
          <span
            style={{
              fontSize: '24px',
              fontWeight: 500,
              color: c.accent,
            }}
          >
            {title}
          </span>
        )}
      </div>

      {/* BEFORE panel */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: c.backgroundAlt,
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingTop: '40px',
          paddingBottom: '40px',
          gap: '28px',
        }}
      >
        {/* Before label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: c.textSecondary,
            color: c.background,
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '28px',
            paddingRight: '28px',
            borderRadius: '4px',
            width: 'fit-content',
          }}
        >
          BEFORE
        </div>

        <span
          style={{
            fontSize: '36px',
            fontWeight: 600,
            color: c.textPrimary,
            lineHeight: 1.5,
          }}
        >
          {beforeText || '제품 사용 전'}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          width: '1080px',
          height: '4px',
          backgroundColor: c.accent,
        }}
      />

      {/* AFTER panel */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: c.background,
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingTop: '40px',
          paddingBottom: '40px',
          gap: '28px',
        }}
      >
        {/* After label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: c.accent,
            color: c.accentText,
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '28px',
            paddingRight: '28px',
            borderRadius: '4px',
            width: 'fit-content',
          }}
        >
          AFTER
        </div>

        <span
          style={{
            fontSize: '36px',
            fontWeight: 600,
            color: c.textPrimary,
            lineHeight: 1.5,
          }}
        >
          {afterText || '제품 사용 후'}
        </span>
      </div>

      {/* Bottom brand bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '28px',
          paddingBottom: '40px',
        }}
      >
        <span
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: c.textSecondary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
      </div>
    </div>
  );
}

// ── Template 5: BrandMoodTemplate ─────────────────────────────────────────────
//
// Layout (top → bottom):
//   top margin (atmospheric) |
//   brand tagline (centre, large and poetic) |
//   brand name (bottom-centre)
//   accent strip (bottom)

function BrandMoodTemplate({
  designTone,
  brandName = '',
  title = '',
  subtitle = '',
}: InstagramTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1350px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top element */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingTop: '60px',
          paddingRight: '70px',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '80px',
            height: '4px',
            backgroundColor: c.accent,
          }}
        />
      </div>

      {/* Spacer */}
      <div style={{ display: 'flex', flex: 1 }} />

      {/* Central mood text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '70px',
          paddingRight: '70px',
          gap: '36px',
        }}
      >
        <span
          style={{
            fontSize: title.length > 20 ? '66px' : '80px',
            fontWeight: 800,
            color: c.textPrimary,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </span>

        {subtitle && (
          <span
            style={{
              fontSize: '34px',
              fontWeight: 400,
              color: c.textSecondary,
              lineHeight: 1.65,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div style={{ display: 'flex', flex: 1 }} />

      {/* Brand name + decorative line */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '0px',
          paddingTop: '0px',
          marginBottom: '36px',
        }}
      >
        <span
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
        <div
          style={{
            display: 'flex',
            width: '120px',
            height: '2px',
            backgroundColor: c.textSecondary,
          }}
        />
      </div>

      {/* Accent bottom strip */}
      <div
        style={{
          display: 'flex',
          width: '1080px',
          height: '10px',
          backgroundColor: c.accent,
        }}
      />
    </div>
  );
}

// ── Template 6: EventPromoTemplate ───────────────────────────────────────────
//
// Layout (top → bottom):
//   brand name + "EVENT" label (top) |
//   event title (large, centre) |
//   discount badge (prominent) |
//   event date |
//   CTA strip (bottom)

function EventPromoTemplate({
  designTone,
  brandName = '',
  eventTitle = '',
  eventDate = '',
  discount = '',
  title = '',
  subtitle = '',
}: InstagramTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  const displayTitle = eventTitle || title;
  const displaySubtitle = subtitle;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1350px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '60px',
          paddingLeft: '70px',
          paddingRight: '70px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: c.accent,
            color: c.accentText,
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '24px',
            paddingRight: '24px',
            borderRadius: '4px',
          }}
        >
          EVENT
        </div>
      </div>

      {/* Event title */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: '70px',
          paddingRight: '70px',
          gap: '36px',
        }}
      >
        <span
          style={{
            fontSize: displayTitle.length > 16 ? '60px' : '76px',
            fontWeight: 800,
            color: c.textPrimary,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {displayTitle}
        </span>

        {displaySubtitle && (
          <span
            style={{
              fontSize: '30px',
              fontWeight: 400,
              color: c.textSecondary,
              lineHeight: 1.6,
            }}
          >
            {displaySubtitle}
          </span>
        )}

        {/* Discount badge */}
        {discount && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: c.accent,
              color: c.accentText,
              fontSize: '52px',
              fontWeight: 800,
              paddingTop: '20px',
              paddingBottom: '20px',
              paddingLeft: '40px',
              paddingRight: '40px',
              borderRadius: '12px',
              width: 'fit-content',
              letterSpacing: '-0.01em',
            }}
          >
            {discount}
          </div>
        )}

        {/* Event date */}
        {eventDate && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '6px',
                height: '36px',
                backgroundColor: c.accent,
                borderRadius: '3px',
              }}
            />
            <span
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: c.textSecondary,
              }}
            >
              {eventDate}
            </span>
          </div>
        )}
      </div>

      {/* CTA strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.accent,
          height: '100px',
        }}
      >
        <span
          style={{
            fontSize: '30px',
            fontWeight: 700,
            color: c.accentText,
            letterSpacing: '0.04em',
          }}
        >
          지금 바로 확인하기 →
        </span>
      </div>
    </div>
  );
}

// ── Template router ───────────────────────────────────────────────────────────

/**
 * Map an InstagramType to the corresponding template component and return
 * the rendered JSX element.
 *
 * Pass the result directly to generateImage() from satori-pipeline.ts:
 *
 * @example
 * import { renderInstagramTemplate } from './templates';
 * import { generateImage } from '@/lib/image/satori-pipeline';
 *
 * const element = renderInstagramTemplate('hero_product', {
 *   designTone: 'modern_minimal',
 *   productName: 'Glow Serum',
 *   brandName: 'BrandHelix',
 * });
 * const png = await generateImage(element, 1080, 1350);
 */
export function renderInstagramTemplate(
  type: InstagramType,
  props: InstagramTemplateProps
): ReactNode {
  switch (type) {
    case 'hero_product':
      return <HeroProductTemplate {...props} />;

    case 'info_card_carousel':
      return <InfoCardCarouselTemplate {...props} />;

    case 'routine_guide':
      return <RoutineGuideTemplate {...props} />;

    case 'before_after':
      return <BeforeAfterTemplate {...props} />;

    case 'brand_mood':
      return <BrandMoodTemplate {...props} />;

    case 'event_promo':
      return <EventPromoTemplate {...props} />;

    default: {
      // TypeScript exhaustiveness guard
      const _exhaustive: never = type;
      throw new Error(`Unknown Instagram template type: ${String(_exhaustive)}`);
    }
  }
}

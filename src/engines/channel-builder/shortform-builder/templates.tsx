// Shortform thumbnail templates — Satori-compatible React components.
// Server-side only. Satori requires inline styles exclusively;
// no className, no Tailwind, no CSS variables, no CSS grid.
// All layouts use flexbox. Canvas size: 1080×1920 px (9:16 ratio).

import type { ReactNode } from 'react';
import type { DesignToneId } from '@/types/style';
import type { ShortformType } from '@/types/shortform';

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
 * Mirrors the logic in instagram templates.tsx so tone colors stay consistent
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

export interface ShortformTemplateProps {
  /** Design tone id (e.g. 'modern_minimal') */
  designTone: string;
  /** Brand name shown in header or footer */
  brandName: string;
  /** 메인 훅 텍스트 — 시청자를 사로잡는 첫 문장 */
  hookLine: string;
  /** 영상 제목 */
  title?: string;
  /** 제품명 */
  productName?: string;
  /** 부제목 또는 설명 */
  subtitle?: string;
  /** 숏폼 타입 — 타입별 시각 처리 결정 */
  shortformType: string;
  /** 장면 수 (optional) */
  sceneCount?: number;
  /** 영상 길이 (e.g. "30초", "15-30s") */
  duration?: string;
}

// ── Template 1: HookProductThumbnail ──────────────────────────────────────────
//
// 제품 소개 훅: 강렬한 훅 텍스트를 중앙에 대형으로 배치하고,
// 제품명을 하단에 표시. 액센트 색상 오버레이로 드라마틱한 분위기 연출.
//
// Layout (top → bottom):
//   accent top strip | brand name (upper-left) |
//   hook text (centre, bold, large) | product name badge |
//   bottom bar with duration

function HookProductThumbnail({
  designTone,
  brandName = '',
  hookLine = '',
  productName = '',
  subtitle = '',
  duration = '',
}: ShortformTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1920px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 상단 액센트 스트립 */}
      <div
        style={{
          display: 'flex',
          width: '1080px',
          height: '12px',
          backgroundColor: c.accent,
        }}
      />

      {/* 헤더: 브랜드명 + SHORTS 배지 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '56px',
          paddingLeft: '72px',
          paddingRight: '72px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '30px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.12em',
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
            letterSpacing: '0.08em',
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: '20px',
            paddingRight: '20px',
            borderRadius: '4px',
          }}
        >
          SHORTS
        </div>
      </div>

      {/* 장식 라인 */}
      <div
        style={{
          display: 'flex',
          marginTop: '48px',
          marginLeft: '72px',
          width: '120px',
          height: '4px',
          backgroundColor: c.accent,
        }}
      />

      {/* 중앙: 훅 텍스트 */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: '80px',
          paddingRight: '80px',
          gap: '48px',
        }}
      >
        {/* 훅 라인 — 핵심 메시지 */}
        <span
          style={{
            fontSize: hookLine.length > 20 ? '72px' : '88px',
            fontWeight: 800,
            color: c.textPrimary,
            textAlign: 'center',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {hookLine}
        </span>

        {/* 부제목 */}
        {subtitle && (
          <span
            style={{
              fontSize: '34px',
              fontWeight: 400,
              color: c.textSecondary,
              textAlign: 'center',
              lineHeight: 1.55,
              maxWidth: '880px',
            }}
          >
            {subtitle}
          </span>
        )}

        {/* 제품명 배지 */}
        {productName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: c.accent,
              color: c.accentText,
              fontSize: '32px',
              fontWeight: 700,
              paddingTop: '16px',
              paddingBottom: '16px',
              paddingLeft: '40px',
              paddingRight: '40px',
              borderRadius: '8px',
              letterSpacing: '0.02em',
            }}
          >
            {productName}
          </div>
        )}
      </div>

      {/* 하단 바: 재생 시간 + 브랜드 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '72px',
          paddingRight: '72px',
          paddingBottom: '64px',
          paddingTop: '0px',
        }}
      >
        {duration && (
          <span
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: c.textSecondary,
            }}
          >
            {duration}
          </span>
        )}
        <div
          style={{
            display: 'flex',
            width: '60px',
            height: '4px',
            backgroundColor: c.accent,
          }}
        />
      </div>

      {/* 하단 액센트 스트립 */}
      <div
        style={{
          display: 'flex',
          width: '1080px',
          height: '12px',
          backgroundColor: c.accent,
        }}
      />
    </div>
  );
}

// ── Template 2: HowToTutorialThumbnail ───────────────────────────────────────
//
// 사용법 튜토리얼: 상단에 "STEP 1·2·3" 시각 인디케이터,
// 중앙에 훅 텍스트, 하단에 튜토리얼 주제 표시.
// 단계별 구조를 시각적으로 암시하여 저장/공유 유도.
//
// Layout (top → bottom):
//   brand name + "TUTORIAL" label |
//   step dots indicator (1·2·3) |
//   hook text (large, centre) |
//   topic / subtitle |
//   bottom progress bar

function HowToTutorialThumbnail({
  designTone,
  brandName = '',
  hookLine = '',
  title = '',
  subtitle = '',
  sceneCount = 3,
  duration = '',
}: ShortformTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  // 스텝 인디케이터 생성 (최소 2, 최대 7)
  const stepCount = Math.max(2, Math.min(sceneCount, 7));
  const steps = Array.from({ length: stepCount }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1920px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 헤더: 브랜드명 + TUTORIAL 라벨 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '64px',
          paddingLeft: '72px',
          paddingRight: '72px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
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
            letterSpacing: '0.08em',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '24px',
            paddingRight: '24px',
            borderRadius: '4px',
          }}
        >
          TUTORIAL
        </div>
      </div>

      {/* 스텝 인디케이터: STEP 1 · 2 · 3 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '80px',
          paddingBottom: '0px',
          gap: '20px',
        }}
      >
        {steps.map((step) => (
          <div
            key={step}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: step === 1 ? c.accent : c.backgroundAlt,
              }}
            >
              <span
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: step === 1 ? c.accentText : c.textSecondary,
                  lineHeight: 1,
                }}
              >
                {step}
              </span>
            </div>

            {/* 스텝 간 연결선 (마지막 제외) */}
            {step < stepCount && (
              <div
                style={{
                  display: 'flex',
                  width: '32px',
                  height: '3px',
                  backgroundColor: c.backgroundAlt,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 스텝 라벨 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '24px',
        }}
      >
        <span
          style={{
            fontSize: '26px',
            fontWeight: 600,
            color: c.accent,
            letterSpacing: '0.14em',
          }}
        >
          STEP 1 · 2 · 3
        </span>
      </div>

      {/* 구분선 */}
      <div
        style={{
          display: 'flex',
          marginTop: '56px',
          marginLeft: '72px',
          marginRight: '72px',
          height: '2px',
          backgroundColor: c.backgroundAlt,
        }}
      />

      {/* 중앙: 훅 텍스트 */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: '80px',
          paddingRight: '80px',
          gap: '40px',
        }}
      >
        <span
          style={{
            fontSize: hookLine.length > 18 ? '68px' : '82px',
            fontWeight: 800,
            color: c.textPrimary,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
          }}
        >
          {hookLine}
        </span>

        {/* 튜토리얼 주제 (title 또는 subtitle) */}
        {(title || subtitle) && (
          <span
            style={{
              fontSize: '34px',
              fontWeight: 400,
              color: c.textSecondary,
              lineHeight: 1.6,
              maxWidth: '880px',
            }}
          >
            {title || subtitle}
          </span>
        )}
      </div>

      {/* 하단 프로그레스 바 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingLeft: '72px',
          paddingRight: '72px',
          paddingBottom: '64px',
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
              fontSize: '24px',
              fontWeight: 500,
              color: c.textSecondary,
            }}
          >
            {stepCount}단계 튜토리얼
          </span>
          {duration && (
            <span
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: c.accent,
              }}
            >
              {duration}
            </span>
          )}
        </div>

        {/* 트랙 */}
        <div
          style={{
            display: 'flex',
            width: '936px',
            height: '8px',
            backgroundColor: c.backgroundAlt,
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '312px',
              height: '8px',
              backgroundColor: c.accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Template 3: MythBusterThumbnail ──────────────────────────────────────────
//
// 오해와 진실: 상단에 큰 "X" 아이콘, 오해 텍스트를 취소선 스타일로,
// 하단에 "O" 아이콘과 진실 텍스트. 볼드한 구분선으로 대비 효과.
// 정보형 콘텐츠의 시각적 충격을 극대화.
//
// Layout (top → bottom):
//   brand name (top-left) |
//   MYTH section: X icon + myth text |
//   bold divider line |
//   TRUTH section: O icon + truth text |
//   bottom brand bar

function MythBusterThumbnail({
  designTone,
  brandName = '',
  hookLine = '',
  title = '',
  subtitle = '',
}: ShortformTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  // hookLine = 오해 텍스트, title 또는 subtitle = 진실 텍스트
  const mythText = hookLine;
  const truthText = title || subtitle || '진실은 여기에';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1920px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 헤더: 브랜드명 + 팩트체크 라벨 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '64px',
          paddingLeft: '72px',
          paddingRight: '72px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
        <span
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: c.accent,
            letterSpacing: '0.06em',
          }}
        >
          FACT CHECK
        </span>
      </div>

      {/* MYTH 섹션 — 오해 */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: '80px',
          paddingRight: '80px',
          gap: '40px',
        }}
      >
        {/* X 아이콘 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            backgroundColor: c.accent,
          }}
        >
          <span
            style={{
              fontSize: '80px',
              fontWeight: 800,
              color: c.accentText,
              lineHeight: 1,
            }}
          >
            X
          </span>
        </div>

        {/* MYTH 라벨 */}
        <span
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: c.accent,
            letterSpacing: '0.18em',
          }}
        >
          MYTH
        </span>

        {/* 오해 텍스트 */}
        <span
          style={{
            fontSize: mythText.length > 20 ? '52px' : '64px',
            fontWeight: 700,
            color: c.textSecondary,
            textAlign: 'center',
            lineHeight: 1.35,
            textDecoration: 'line-through',
            maxWidth: '880px',
          }}
        >
          {mythText}
        </span>
      </div>

      {/* 볼드 구분선 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: '72px',
          paddingRight: '72px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            height: '4px',
            backgroundColor: c.backgroundAlt,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: c.accent,
            marginLeft: '24px',
            marginRight: '24px',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: c.accentText,
              lineHeight: 1,
            }}
          >
            VS
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            height: '4px',
            backgroundColor: c.backgroundAlt,
          }}
        />
      </div>

      {/* TRUTH 섹션 — 진실 */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: '80px',
          paddingRight: '80px',
          gap: '40px',
        }}
      >
        {/* O 아이콘 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            border: `6px solid ${c.accent}`,
          }}
        >
          <span
            style={{
              fontSize: '80px',
              fontWeight: 800,
              color: c.accent,
              lineHeight: 1,
            }}
          >
            O
          </span>
        </div>

        {/* TRUTH 라벨 */}
        <span
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: c.accent,
            letterSpacing: '0.18em',
          }}
        >
          TRUTH
        </span>

        {/* 진실 텍스트 */}
        <span
          style={{
            fontSize: truthText.length > 20 ? '52px' : '64px',
            fontWeight: 800,
            color: c.textPrimary,
            textAlign: 'center',
            lineHeight: 1.35,
            maxWidth: '880px',
          }}
        >
          {truthText}
        </span>
      </div>

      {/* 하단 브랜드 바 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '0px',
          paddingBottom: '56px',
          gap: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '48px',
            height: '3px',
            backgroundColor: c.accent,
          }}
        />
        <span
          style={{
            fontSize: '24px',
            fontWeight: 600,
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
            width: '48px',
            height: '3px',
            backgroundColor: c.accent,
          }}
        />
      </div>
    </div>
  );
}

// ── Template 4: BeforeAfterThumbnail ─────────────────────────────────────────
//
// 비포애프터 공개: 상단 "BEFORE" / 하단 "AFTER" 스플릿 레이아웃.
// 중앙에 변환 텍스트 배치. 동일 앵글에서의 극적 변화를 시각적으로 암시.
// 시각적 충격으로 높은 조회수와 공유 유도.
//
// Layout (top → bottom):
//   brand name (top) |
//   BEFORE half (muted background, "Before" label + text) |
//   central transformation arrow strip |
//   AFTER half (bright, "After" label + text) |
//   bottom accent strip

function BeforeAfterThumbnail({
  designTone,
  brandName = '',
  hookLine = '',
  title = '',
  subtitle = '',
}: ShortformTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  // hookLine = 변환/변화 핵심 메시지
  // title = BEFORE 상태 설명, subtitle = AFTER 상태 설명
  const beforeLabel = title || '사용 전';
  const afterLabel = subtitle || '사용 후';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1920px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 헤더: 브랜드명 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '56px',
          paddingLeft: '72px',
          paddingRight: '72px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: c.textSecondary,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
        <span
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: c.accent,
            letterSpacing: '0.08em',
          }}
        >
          REVEAL
        </span>
      </div>

      {/* BEFORE 패널 */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: c.backgroundAlt,
          marginTop: '48px',
          marginLeft: '0px',
          marginRight: '0px',
          paddingLeft: '80px',
          paddingRight: '80px',
          paddingTop: '48px',
          paddingBottom: '48px',
          gap: '32px',
        }}
      >
        {/* BEFORE 라벨 배지 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: c.textSecondary,
            color: c.background,
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '32px',
            paddingRight: '32px',
            borderRadius: '6px',
            width: 'fit-content',
          }}
        >
          BEFORE
        </div>

        {/* Before 상태 텍스트 */}
        <span
          style={{
            fontSize: beforeLabel.length > 16 ? '44px' : '54px',
            fontWeight: 600,
            color: c.textSecondary,
            lineHeight: 1.4,
            maxWidth: '880px',
          }}
        >
          {beforeLabel}
        </span>
      </div>

      {/* 중앙 변환 스트립 — 훅 메시지 + 화살표 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.accent,
          paddingTop: '48px',
          paddingBottom: '48px',
          paddingLeft: '80px',
          paddingRight: '80px',
          gap: '20px',
        }}
      >
        {/* 변환 화살표 */}
        <span
          style={{
            fontSize: '48px',
            fontWeight: 400,
            color: c.accentText,
            lineHeight: 1,
          }}
        >
          ▼
        </span>

        {/* 훅 메시지 */}
        <span
          style={{
            fontSize: hookLine.length > 16 ? '40px' : '48px',
            fontWeight: 800,
            color: c.accentText,
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {hookLine}
        </span>

        {/* 하향 화살표 */}
        <span
          style={{
            fontSize: '48px',
            fontWeight: 400,
            color: c.accentText,
            lineHeight: 1,
          }}
        >
          ▼
        </span>
      </div>

      {/* AFTER 패널 */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: c.background,
          paddingLeft: '80px',
          paddingRight: '80px',
          paddingTop: '48px',
          paddingBottom: '48px',
          gap: '32px',
        }}
      >
        {/* AFTER 라벨 배지 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: c.accent,
            color: c.accentText,
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '32px',
            paddingRight: '32px',
            borderRadius: '6px',
            width: 'fit-content',
          }}
        >
          AFTER
        </div>

        {/* After 상태 텍스트 */}
        <span
          style={{
            fontSize: afterLabel.length > 16 ? '44px' : '54px',
            fontWeight: 800,
            color: c.textPrimary,
            lineHeight: 1.4,
            maxWidth: '880px',
          }}
        >
          {afterLabel}
        </span>
      </div>

      {/* 하단 브랜드 바 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '0px',
          paddingBottom: '48px',
        }}
      >
        <span
          style={{
            fontSize: '24px',
            fontWeight: 500,
            color: c.textSecondary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </span>
      </div>

      {/* 하단 액센트 스트립 */}
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

// ── Template 5: TrendChallengeThumbnail ──────────────────────────────────────
//
// 트렌드/챌린지: 상단에 트렌딩 화살표 아이콘,
// 중앙에 챌린지 텍스트, 하단에 해시태그 프리뷰.
// 바이럴 확산에 최적화된 레이아웃.
//
// Layout (top → bottom):
//   brand name + trending icon (top) |
//   "TRENDING" label |
//   challenge hook text (centre, extra bold) |
//   hashtag preview strip (bottom) |
//   bottom accent bar

function TrendChallengeThumbnail({
  designTone,
  brandName = '',
  hookLine = '',
  title = '',
  subtitle = '',
  productName = '',
}: ShortformTemplateProps): ReactNode {
  const c = resolveToneColors(designTone);

  // 해시태그 프리뷰 생성
  const hashtag1 = productName ? `#${productName.replace(/\s/g, '')}` : `#${brandName.replace(/\s/g, '')}`;
  const hashtag2 = '#챌린지';
  const hashtag3 = '#트렌드';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1920px',
        backgroundColor: c.background,
        fontFamily: '"Noto Sans KR", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 헤더: 브랜드명 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '64px',
          paddingLeft: '72px',
          paddingRight: '72px',
          paddingBottom: '0px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
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
            letterSpacing: '0.06em',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '20px',
            paddingRight: '20px',
            borderRadius: '4px',
          }}
        >
          VIRAL
        </div>
      </div>

      {/* 트렌딩 화살표 아이콘 영역 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '100px',
          gap: '24px',
        }}
      >
        {/* 트렌딩 화살표 — 상승 표시 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: c.accent,
          }}
        >
          <span
            style={{
              fontSize: '64px',
              fontWeight: 400,
              color: c.accentText,
              lineHeight: 1,
            }}
          >
            ▲
          </span>
        </div>

        {/* TRENDING 라벨 */}
        <span
          style={{
            fontSize: '30px',
            fontWeight: 700,
            color: c.accent,
            letterSpacing: '0.22em',
          }}
        >
          TRENDING
        </span>
      </div>

      {/* 구분 장식선 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '48px',
          paddingBottom: '0px',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '160px',
            height: '3px',
            backgroundColor: c.accent,
          }}
        />
      </div>

      {/* 중앙: 챌린지 텍스트 */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: '80px',
          paddingRight: '80px',
          gap: '40px',
        }}
      >
        {/* 훅 라인 — 챌린지 메인 텍스트 */}
        <span
          style={{
            fontSize: hookLine.length > 18 ? '68px' : '84px',
            fontWeight: 800,
            color: c.textPrimary,
            textAlign: 'center',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {hookLine}
        </span>

        {/* 부제목 / 챌린지 설명 */}
        {(title || subtitle) && (
          <span
            style={{
              fontSize: '34px',
              fontWeight: 400,
              color: c.textSecondary,
              textAlign: 'center',
              lineHeight: 1.55,
              maxWidth: '880px',
            }}
          >
            {title || subtitle}
          </span>
        )}
      </div>

      {/* 해시태그 프리뷰 스트립 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          paddingTop: '0px',
          paddingBottom: '40px',
          paddingLeft: '72px',
          paddingRight: '72px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: c.accent,
          }}
        >
          {hashtag1}
        </span>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: c.textSecondary,
          }}
        >
          {hashtag2}
        </span>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: c.textSecondary,
          }}
        >
          {hashtag3}
        </span>
      </div>

      {/* 하단 액센트 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.accent,
          height: '80px',
        }}
      >
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: c.accentText,
            letterSpacing: '0.06em',
          }}
        >
          지금 참여하기
        </span>
      </div>
    </div>
  );
}

// ── Template router ───────────────────────────────────────────────────────────

/**
 * Map a ShortformType to the corresponding thumbnail template component
 * and return the rendered JSX element.
 *
 * Pass the result directly to generateImage() from satori-pipeline.ts:
 *
 * @example
 * import { renderShortformThumbnail } from './templates';
 * import { generateImage } from '@/lib/image/satori-pipeline';
 *
 * const element = renderShortformThumbnail('hook_product', {
 *   designTone: 'modern_minimal',
 *   brandName: 'BrandHelix',
 *   hookLine: '이걸 모르면 손해!',
 *   shortformType: 'hook_product',
 * });
 * const png = await generateImage(element, 1080, 1920);
 */
export function renderShortformThumbnail(
  type: ShortformType | string,
  props: ShortformTemplateProps
): ReactNode {
  switch (type) {
    case 'hook_product':
      return <HookProductThumbnail {...props} />;

    case 'how_to_tutorial':
      return <HowToTutorialThumbnail {...props} />;

    case 'myth_buster':
      return <MythBusterThumbnail {...props} />;

    case 'before_after_reveal':
      return <BeforeAfterThumbnail {...props} />;

    case 'trend_challenge':
      return <TrendChallengeThumbnail {...props} />;

    default:
      // 알 수 없는 타입은 기본 HookProduct 템플릿으로 폴백
      return <HookProductThumbnail {...props} />;
  }
}

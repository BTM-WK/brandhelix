'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CarouselSlide {
  imageBase64: string; // base64 data URI
  slideNumber: number;
  width: number;
  height: number;
}

interface InstagramCarouselPreviewProps {
  slides: CarouselSlide[];
  aspectRatio?: '4:5' | '1:1'; // default '4:5'
  showControls?: boolean; // default true
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** aspect-ratio 문자열을 Tailwind padding-bottom 퍼센트로 변환 */
function aspectRatioPadding(ratio: '4:5' | '1:1'): string {
  // 4:5 → height/width = 5/4 = 125%
  // 1:1 → height/width = 1/1 = 100%
  return ratio === '4:5' ? 'pb-[125%]' : 'pb-[100%]';
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InstagramCarouselPreview({
  slides,
  aspectRatio = '4:5',
  showControls = true,
}: InstagramCarouselPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = slides.length;

  // 인덱스 범위 보정
  const clampIndex = useCallback(
    (idx: number) => Math.max(0, Math.min(total - 1, idx)),
    [total]
  );

  const goTo = useCallback(
    (idx: number) => setCurrentIndex(clampIndex(idx)),
    [clampIndex]
  );

  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  // 키보드 네비게이션
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  // slides가 바뀌면 인덱스 리셋
  useEffect(() => {
    setCurrentIndex(0);
  }, [slides]);

  // ── Touch swipe handlers ──────────────────────────────────────────────────────

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const delta = touchStartX.current - touchEndX.current;
    const SWIPE_THRESHOLD = 40; // px

    if (delta > SWIPE_THRESHOLD) {
      goNext(); // swipe left → 다음 슬라이드
    } else if (delta < -SWIPE_THRESHOLD) {
      goPrev(); // swipe right → 이전 슬라이드
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (total === 0) {
    return (
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg bg-muted',
          aspectRatioPadding(aspectRatio)
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">이미지 없음</span>
        </div>
      </div>
    );
  }

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex === total - 1;

  return (
    <div
      className="relative w-full select-none overflow-hidden rounded-lg bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label={`이미지 캐러셀 (${currentIndex + 1}/${total})`}
    >
      {/* ── 비율 유지 컨테이너 ──────────────────────────────────────────────── */}
      <div className={cn('relative w-full', aspectRatioPadding(aspectRatio))}>
        {/* ── 슬라이드 트랙 ──────────────────────────────────────────────────── */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((slide, idx) => (
              <div
                key={`${slide.slideNumber}-${idx}`}
                className="relative h-full w-full shrink-0"
                aria-hidden={idx !== currentIndex}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageBase64}
                  alt={`슬라이드 ${slide.slideNumber}`}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── 슬라이드 카운터 (우상단) ──────────────────────────────────────── */}
        {total > 1 && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {currentIndex + 1}/{total}
          </div>
        )}

        {/* ── 좌우 화살표 버튼 ──────────────────────────────────────────────── */}
        {showControls && total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={isPrevDisabled}
              className={cn(
                'absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                isPrevDisabled
                  ? 'cursor-not-allowed opacity-30'
                  : 'opacity-80 hover:opacity-100'
              )}
              aria-label="이전 슬라이드"
            >
              <ChevronLeft className="size-5" />
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={isNextDisabled}
              className={cn(
                'absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                isNextDisabled
                  ? 'cursor-not-allowed opacity-30'
                  : 'opacity-80 hover:opacity-100'
              )}
              aria-label="다음 슬라이드"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* ── 닷 인디케이터 (하단) ────────────────────────────────────────────── */}
      {showControls && total > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2">
          {slides.map((slide, idx) => (
            <button
              key={`dot-${slide.slideNumber}-${idx}`}
              type="button"
              onClick={() => goTo(idx)}
              className={cn(
                'rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                idx === currentIndex
                  ? 'size-2.5 bg-white'
                  : 'size-1.5 bg-white/50 hover:bg-white/75'
              )}
              aria-label={`슬라이드 ${idx + 1}로 이동`}
              aria-current={idx === currentIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

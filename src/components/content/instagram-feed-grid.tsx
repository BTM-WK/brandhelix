'use client';

import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FeedGridItem {
  id: string;
  /** base64 data URI or absolute URL */
  imageBase64?: string;
  /** InstagramType string */
  type: string;
  title?: string;
  status?: 'draft' | 'approved' | 'scheduled' | 'published';
  /** Number of carousel slides – shows indicator when > 1 */
  slideCount?: number;
}

interface InstagramFeedGridProps {
  /** Up to 9 items are displayed; the rest are ignored */
  items: FeedGridItem[];
  onItemClick?: (item: FeedGridItem) => void;
  /** Called after a drag-and-drop reorder with the new items array */
  onReorder?: (items: FeedGridItem[]) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

/** Korean label map for InstagramType ids */
const TYPE_LABEL_KO: Record<string, string> = {
  hero_product: '히어로',
  info_card_carousel: '정보카드',
  routine_guide: '루틴',
  before_after: '비포/애프터',
  brand_mood: '브랜드무드',
  event_promo: '이벤트',
};

/** Status color dot classes */
const STATUS_DOT: Record<NonNullable<FeedGridItem['status']>, string> = {
  draft: 'bg-zinc-400',
  approved: 'bg-blue-500',
  scheduled: 'bg-amber-400',
  published: 'bg-emerald-500',
};

/** Status Korean label */
const STATUS_LABEL_KO: Record<NonNullable<FeedGridItem['status']>, string> = {
  draft: '초안',
  approved: '승인됨',
  scheduled: '예약됨',
  published: '발행됨',
};

// ── SVG icon helpers ────────────────────────────────────────────────────────────

/** Carousel / multi-slide indicator icon (stacked pages) */
function CarouselIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Back page */}
      <rect x="5" y="3" width="11" height="11" rx="2" fill="white" opacity="0.6" />
      {/* Front page */}
      <rect x="4" y="6" width="11" height="11" rx="2" fill="white" />
      {/* Carousel dots */}
      <circle cx="8" cy="15.5" r="0.9" fill="#555" />
      <circle cx="10" cy="15.5" r="0.9" fill="#555" />
      <circle cx="12" cy="15.5" r="0.9" fill="#555" />
    </svg>
  );
}

/** Instagram grid icon (3×3 squares) */
function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <rect x="15" y="9" width="6" height="6" rx="1" />
      <rect x="3" y="15" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
    </svg>
  );
}

/** Instagram reels / film icon */
function ReelsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <circle cx="12" cy="12" r="3" />
      <line x1="2" y1="8" x2="22" y2="8" />
      <line x1="2" y1="16" x2="22" y2="16" />
      <line x1="7" y1="4" x2="7" y2="8" />
      <line x1="17" y1="4" x2="17" y2="8" />
    </svg>
  );
}

// ── FeedCell ───────────────────────────────────────────────────────────────────

interface FeedCellProps {
  item: FeedGridItem;
  index: number;
  isDragOver: boolean;
  onItemClick?: (item: FeedGridItem) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

function FeedCell({
  item,
  index,
  isDragOver,
  onItemClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: FeedCellProps) {
  const typeLabel = TYPE_LABEL_KO[item.type] ?? item.type;
  const showCarousel = typeof item.slideCount === 'number' && item.slideCount > 1;

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      aria-label={item.title ?? `${typeLabel} 콘텐츠`}
      className={cn(
        'group relative aspect-square cursor-pointer select-none overflow-hidden bg-muted',
        'ring-inset transition-all duration-150',
        isDragOver && 'ring-2 ring-primary',
        !isDragOver && 'hover:ring-1 hover:ring-primary/40',
      )}
      onClick={() => onItemClick?.(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick?.(item);
        }
      }}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* ── Image or placeholder ── */}
      {item.imageBase64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageBase64}
          alt={item.title ?? typeLabel}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        /* Placeholder when no image is available */
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted px-1 text-center">
          <span className="text-[10px] font-medium leading-tight text-muted-foreground">
            {typeLabel}
          </span>
          <span className="text-[8px] leading-tight text-muted-foreground/60">
            이미지 없음
          </span>
        </div>
      )}

      {/* ── Hover overlay with title ── */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex items-end bg-black/0 p-1 transition-colors duration-150',
          'group-hover:bg-black/40',
        )}
      >
        {item.title && (
          <p className="w-full translate-y-1 truncate text-[9px] font-medium leading-tight text-white opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
            {item.title}
          </p>
        )}
      </div>

      {/* ── Carousel indicator (top-right) ── */}
      {showCarousel && (
        <div className="pointer-events-none absolute right-1 top-1">
          <CarouselIcon className="h-4 w-4 drop-shadow" />
        </div>
      )}

      {/* ── Status dot (bottom-left) ── */}
      {item.status && (
        <div
          className="pointer-events-none absolute bottom-1 left-1"
          title={STATUS_LABEL_KO[item.status]}
          aria-label={STATUS_LABEL_KO[item.status]}
        >
          <span
            className={cn(
              'block h-2 w-2 rounded-full shadow-sm ring-1 ring-white/60',
              STATUS_DOT[item.status],
            )}
          />
        </div>
      )}
    </div>
  );
}

// ── InstagramFeedGrid ──────────────────────────────────────────────────────────

export function InstagramFeedGrid({
  items,
  onItemClick,
  onReorder,
}: InstagramFeedGridProps) {
  // Limit display to 9 items (Instagram 3×3 feed)
  const [orderedItems, setOrderedItems] = useState<FeedGridItem[]>(
    items.slice(0, 9),
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  // Keep orderedItems in sync when props change (shallow compare by length + ids)
  const itemKey = items
    .slice(0, 9)
    .map((i) => i.id)
    .join(',');

  // Sync prop items → state when the item list changes from outside
  // (deliberately not using useEffect to avoid extra render in strict mode;
  //  instead we derive a "needs sync" flag and update inline)
  const orderedKey = orderedItems.map((i) => i.id).join(',');
  if (orderedKey !== itemKey) {
    setOrderedItems(items.slice(0, 9));
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const next = [...orderedItems];
    const [removed] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, removed);

    setOrderedItems(next);
    setDragOverIndex(null);
    dragIndexRef.current = null;
    onReorder?.(next);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (orderedItems.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-muted/50"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  // Fill remaining cells with empty placeholders so the grid is always 3×3
  const fillerCount = Math.max(0, 9 - orderedItems.length);

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {orderedItems.map((item, index) => (
        <FeedCell
          key={item.id}
          item={item}
          index={index}
          isDragOver={dragOverIndex === index}
          onItemClick={onItemClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
      {Array.from({ length: fillerCount }).map((_, i) => (
        <div
          key={`filler-${i}`}
          className="aspect-square bg-muted/30"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ── InstagramPhonePreview ──────────────────────────────────────────────────────

interface InstagramPhonePreviewProps {
  children: React.ReactNode;
  /** Username shown in the profile header. Defaults to "brandhelix" */
  username?: string;
}

export function InstagramPhonePreview({
  children,
  username = 'brandhelix',
}: InstagramPhonePreviewProps) {
  const [activeTab, setActiveTab] = useState<'grid' | 'reels'>('grid');

  return (
    /* Phone shell */
    <div
      className={cn(
        'relative mx-auto flex w-[320px] flex-col overflow-hidden rounded-[36px]',
        'bg-white shadow-2xl ring-4 ring-zinc-900 dark:bg-zinc-950 dark:ring-zinc-700',
      )}
    >
      {/* ── Status bar notch ── */}
      <div className="flex h-8 items-center justify-between bg-white px-6 pt-1 dark:bg-zinc-950">
        <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">
          9:41
        </span>
        {/* Notch */}
        <div className="absolute left-1/2 top-0 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-zinc-900 dark:bg-zinc-800" />
        {/* Battery / signal icons (static decorative) */}
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-3.5 rounded-sm bg-zinc-900 dark:bg-zinc-100" />
          <div className="h-1.5 w-1 rounded-sm bg-zinc-500" />
        </div>
      </div>

      {/* ── Instagram top navigation bar ── */}
      <div className="flex items-center justify-between bg-white px-4 py-2 dark:bg-zinc-950">
        {/* Lock icon (private account) */}
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5 text-zinc-800 dark:text-zinc-200"
          aria-hidden="true"
        >
          <path d="M12 6V5a4 4 0 0 0-8 0v1H2v9h12V6h-2zm-6-1a2 2 0 1 1 4 0v1H6V5zm2 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        </svg>

        {/* Username */}
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {username}
        </span>

        {/* Hamburger / more options */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 text-zinc-800 dark:text-zinc-200"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </div>

      {/* ── Profile section ── */}
      <div className="bg-white px-4 pb-3 dark:bg-zinc-950">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          {/* Avatar placeholder with gradient ring */}
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-0.5">
              <div className="h-full w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-1 justify-around text-center">
            {[
              { label: '게시물', value: '24' },
              { label: '팔로워', value: '1,284' },
              { label: '팔로잉', value: '312' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {value}
                </span>
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bio placeholder */}
        <div className="mt-2 space-y-0.5">
          <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
            {username}
          </p>
          <p className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
            브랜드 마케팅 자동화 플랫폼 ✨
          </p>
          <p className="text-[10px] text-blue-500">brandhelix.io</p>
        </div>

        {/* Action buttons */}
        <div className="mt-2.5 flex gap-1.5">
          {['프로필 편집', '홍보하기'].map((label) => (
            <button
              key={label}
              type="button"
              className={cn(
                'flex-1 rounded-md bg-zinc-100 py-1 text-[10px] font-semibold',
                'text-zinc-800 transition-colors hover:bg-zinc-200',
                'dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
              )}
            >
              {label}
            </button>
          ))}
          {/* Add contact / follow button */}
          <button
            type="button"
            className={cn(
              'flex items-center justify-center rounded-md bg-zinc-100 px-2 py-1',
              'transition-colors hover:bg-zinc-200',
              'dark:bg-zinc-800 dark:hover:bg-zinc-700',
            )}
            aria-label="친구 추가"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3 w-3 text-zinc-800 dark:text-zinc-200"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="16" y1="11" x2="22" y2="11" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Story highlights row ── */}
      <div className="bg-white px-3 pb-3 dark:bg-zinc-950">
        <div className="flex gap-2.5 overflow-x-auto">
          {['새제품', '이벤트', '루틴', '리뷰'].map((label, i) => (
            <div
              key={label}
              className="flex shrink-0 flex-col items-center gap-0.5"
            >
              <div
                className={cn(
                  'h-10 w-10 rounded-full p-0.5',
                  i === 0
                    ? 'bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600'
                    : 'bg-zinc-200 dark:bg-zinc-700',
                )}
              >
                <div className="h-full w-full rounded-full bg-zinc-300 dark:bg-zinc-600" />
              </div>
              <span className="text-[8px] text-zinc-600 dark:text-zinc-400">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar (Grid / Reels) ── */}
      <div className="flex border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
        {(
          [
            { id: 'grid', Icon: GridIcon, label: '게시물' },
            { id: 'reels', Icon: ReelsIcon, label: '릴스' },
          ] as const
        ).map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-label={label}
            className={cn(
              'flex flex-1 items-center justify-center py-2 transition-colors',
              activeTab === id
                ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* ── Feed content area ── */}
      <div className="bg-white dark:bg-zinc-950">
        {activeTab === 'grid' ? (
          children
        ) : (
          /* Reels placeholder */
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-zinc-100 dark:bg-zinc-800"
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom navigation bar ── */}
      <div
        className={cn(
          'flex items-center justify-around bg-white px-2 py-2',
          'border-t border-zinc-100 dark:border-zinc-800 dark:bg-zinc-950',
        )}
      >
        {/* Home */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 text-zinc-900 dark:text-zinc-100"
          aria-hidden="true"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        {/* Search */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {/* Add */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        {/* Reels */}
        <ReelsIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
        {/* Profile */}
        <div className="h-5 w-5 rounded-full bg-zinc-300 ring-1 ring-zinc-300 dark:bg-zinc-600 dark:ring-zinc-600" />
      </div>

      {/* Home indicator bar */}
      <div className="flex justify-center bg-white pb-1 dark:bg-zinc-950">
        <div className="h-1 w-24 rounded-full bg-zinc-900 dark:bg-zinc-100" />
      </div>
    </div>
  );
}

// ── Status legend helper (optional export for parent pages) ─────────────────────

/** Small status legend component that can be placed below the grid */
export function FeedGridStatusLegend() {
  const entries = Object.entries(STATUS_DOT) as [
    NonNullable<FeedGridItem['status']>,
    string,
  ][];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {entries.map(([status, dotClass]) => (
        <div key={status} className="flex items-center gap-1">
          <span className={cn('block h-2 w-2 rounded-full', dotClass)} />
          <span className="text-[10px] text-muted-foreground">
            {STATUS_LABEL_KO[status]}
          </span>
        </div>
      ))}
    </div>
  );
}

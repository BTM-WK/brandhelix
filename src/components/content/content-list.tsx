'use client';

import React, { useState, useMemo } from 'react';
import { Globe, FileText, Instagram, Video, Trash2, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import type { ChannelType, ContentStatus, GeneratedContent } from '@/types/content';
import { BLOG_TYPES } from '@/types/blog';
import { INSTAGRAM_TYPES } from '@/types/instagram';

// ── 타입 정의 ────────────────────────────────────────────────────────────────

interface ContentListProps {
  contents: GeneratedContent[];
  channelFilter?: ChannelType | 'all';
  statusFilter?: ContentStatus | 'all';
  onFilterChange?: (channel: ChannelType | 'all', status: ContentStatus | 'all') => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBulkApprove?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  showFilters?: boolean;
}

// ── 상수 정의 ────────────────────────────────────────────────────────────────

const CHANNEL_TABS: { value: ChannelType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'blog', label: '블로그' },
  { value: 'instagram', label: '인스타그램' },
  { value: 'shortform', label: '숏폼' },
  { value: 'site', label: '사이트' },
];

const STATUS_OPTIONS: { value: ContentStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '초안' },
  { value: 'approved', label: '승인' },
  { value: 'scheduled', label: '예약' },
  { value: 'published', label: '발행' },
];

const STATUS_BADGE_CONFIG: Record<
  ContentStatus,
  { label: string; variant: 'secondary' | 'outline' | 'default' | 'destructive' }
> = {
  draft: { label: '초안', variant: 'secondary' },
  approved: { label: '승인', variant: 'default' },
  scheduled: { label: '예약', variant: 'outline' },
  published: { label: '발행', variant: 'default' },
};

const STATUS_COLOR_CLASS: Record<ContentStatus, string> = {
  draft: 'text-muted-foreground',
  approved: 'text-green-600 dark:text-green-400',
  scheduled: 'text-blue-600 dark:text-blue-400',
  published: 'text-primary',
};

const CHANNEL_ICON: Record<ChannelType, React.ElementType> = {
  site: Globe,
  blog: FileText,
  instagram: Instagram,
  shortform: Video,
};

const CHANNEL_LABEL: Record<ChannelType, string> = {
  site: '사이트',
  blog: '블로그',
  instagram: '인스타그램',
  shortform: '숏폼',
};

// ── 헬퍼 함수 ─────────────────────────────────────────────────────────────────

/** contentType 값으로 한글 명칭을 반환 */
function getContentTypeLabel(channel: ChannelType, contentType: string): string {
  if (channel === 'blog') {
    const found = BLOG_TYPES.find((t) => t.id === contentType);
    return found?.nameKo ?? contentType;
  }
  if (channel === 'instagram') {
    const found = INSTAGRAM_TYPES.find((t) => t.id === contentType);
    return found?.nameKo ?? contentType;
  }
  return contentType;
}

/** ISO 날짜 문자열을 한국어 로컬 포맷으로 변환 */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** 생성 비용을 원 단위 문자열로 변환 */
function formatCost(cost: number): string {
  if (cost === 0) return '₩0';
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}

// ── 단순 Checkbox 구현 (shadcn checkbox가 없는 상황) ─────────────────────────

interface SimpleCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

function SimpleCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
}: SimpleCheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={cn('flex cursor-pointer items-center gap-2', className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
        aria-label={label}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </label>
  );
}

// ── 콘텐츠 카드 (단일 항목) ───────────────────────────────────────────────────

interface ContentCardProps {
  content: GeneratedContent;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function ContentCard({
  content,
  selected,
  onSelect,
  onApprove,
  onDelete,
}: ContentCardProps) {
  const Icon = CHANNEL_ICON[content.channel];
  const statusCfg = STATUS_BADGE_CONFIG[content.status];
  const typeLabel = getContentTypeLabel(content.channel, content.contentType);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors',
        selected
          ? 'border-primary/50 bg-primary/5'
          : 'border-border bg-card hover:bg-accent/30'
      )}
    >
      {/* 체크박스 */}
      <SimpleCheckbox
        checked={selected}
        onChange={(checked) => onSelect(content.id, checked)}
        label={`${content.title ?? typeLabel} 선택`}
        className="shrink-0"
      />

      {/* 채널 아이콘 + 배지 */}
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground leading-none">
          {CHANNEL_LABEL[content.channel]}
        </span>
      </div>

      {/* 본문 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium leading-tight">
            {content.title ?? typeLabel}
          </span>
          <Badge
            variant={statusCfg.variant}
            className={cn('shrink-0 text-[10px]', STATUS_COLOR_CLASS[content.status])}
          >
            {statusCfg.label}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{typeLabel}</span>
          <span>·</span>
          <span>{formatDate(content.createdAt)}</span>
          {content.generationCost > 0 && (
            <>
              <span>·</span>
              <span>{formatCost(content.generationCost)}</span>
            </>
          )}
        </div>
      </div>

      {/* 개별 액션 버튼 */}
      <div className="flex shrink-0 items-center gap-1">
        {content.status === 'draft' && onApprove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
            onClick={() => onApprove(content.id)}
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            승인
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(content.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function ContentList({
  contents,
  channelFilter: externalChannelFilter,
  statusFilter: externalStatusFilter,
  onFilterChange,
  onApprove,
  onDelete,
  onBulkApprove,
  onBulkDelete,
  showFilters = true,
}: ContentListProps) {
  // 내부 필터 상태 — 외부 props이 없으면 자체 관리
  const [internalChannel, setInternalChannel] = useState<ChannelType | 'all'>('all');
  const [internalStatus, setInternalStatus] = useState<ContentStatus | 'all'>('all');

  const activeChannel = externalChannelFilter ?? internalChannel;
  const activeStatus = externalStatusFilter ?? internalStatus;

  // 선택된 항목 ID 집합
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── 필터링 + 정렬 ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return [...contents]
      .filter((c) => {
        const channelOk = activeChannel === 'all' || c.channel === activeChannel;
        const statusOk = activeStatus === 'all' || c.status === activeStatus;
        return channelOk && statusOk;
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [contents, activeChannel, activeStatus]);

  // ── 전체 선택 상태 계산 ──────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someSelected = filtered.some((c) => selectedIds.has(c.id)) && !allSelected;
  const selectedInView = filtered.filter((c) => selectedIds.has(c.id));

  // ── 핸들러 ───────────────────────────────────────────────────────────────

  function handleChannelChange(value: string) {
    const ch = value as ChannelType | 'all';
    setInternalChannel(ch);
    setSelectedIds(new Set());
    onFilterChange?.(ch, activeStatus);
  }

  function handleStatusChange(value: string) {
    const st = value as ContentStatus | 'all';
    setInternalStatus(st);
    setSelectedIds(new Set());
    onFilterChange?.(activeChannel, st);
  }

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleBulkApprove() {
    const ids = selectedInView.map((c) => c.id);
    onBulkApprove?.(ids);
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    const ids = selectedInView.map((c) => c.id);
    onBulkDelete?.(ids);
    setSelectedIds(new Set());
  }

  // ── 렌더링 ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* 필터 바 */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {/* 채널 탭 */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {CHANNEL_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleChannelChange(tab.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  activeChannel === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 상태 필터 */}
          <Select value={activeStatus} onValueChange={handleStatusChange}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 전체 선택 + 선택 카운트 */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <SimpleCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={handleSelectAll}
            label={`전체 선택 (${filtered.length}건)`}
          />
          {selectedInView.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedInView.length}건 선택됨
            </span>
          )}
        </div>
      )}

      {/* 일괄 작업 바 */}
      {selectedInView.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium text-primary">
            {selectedInView.length}건 선택
          </span>
          <Separator orientation="vertical" className="h-4" />
          {onBulkApprove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
              onClick={handleBulkApprove}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              일괄 승인
            </Button>
          )}
          {onBulkDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              일괄 삭제
            </Button>
          )}
        </div>
      )}

      {/* 콘텐츠 목록 */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              {contents.length === 0
                ? '아직 생성된 콘텐츠가 없습니다.'
                : '선택한 필터에 해당하는 콘텐츠가 없습니다.'}
            </p>
            {contents.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                다른 채널이나 상태 필터를 선택해 보세요.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              selected={selectedIds.has(content.id)}
              onSelect={handleSelect}
              onApprove={onApprove}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { Loader2, Check, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { BrandDNA } from '@/types/brand-dna';
import { BLOG_TYPES } from '@/types/blog';
import type { BlogType } from '@/types/blog';
import { INSTAGRAM_TYPES } from '@/types/instagram';
import type { InstagramType } from '@/types/instagram';
import { COPY_STYLES } from '@/types/style';
import type { CopyStyleId } from '@/types/style';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BatchJob {
  id: string;
  channel: 'blog' | 'instagram';
  /** BlogType | InstagramType 또는 'auto' */
  type: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

interface BatchGeneratorProps {
  projectId: string;
  brandDNA: BrandDNA;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (results: BatchJob[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** 배치 Job용 고유 ID 생성 */
function makeJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * "auto" 선택 시 블로그 타입을 순환하여 배정한다.
 * index를 받아 BLOG_TYPES 배열을 순환한다.
 */
function resolveBlogType(blogType: string, index: number): BlogType {
  if (blogType !== 'auto') return blogType as BlogType;
  return BLOG_TYPES[index % BLOG_TYPES.length].id;
}

/**
 * "auto" 선택 시 인스타그램 타입을 순환하여 배정한다.
 */
function resolveInstagramType(
  instagramType: string,
  index: number,
): InstagramType {
  if (instagramType !== 'auto') return instagramType as InstagramType;
  return INSTAGRAM_TYPES[index % INSTAGRAM_TYPES.length].id;
}

/** 콤마/공백 구분 키워드 문자열 → 배열 */
function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

// ── Job Status Icon ────────────────────────────────────────────────────────────

function JobStatusIcon({ status }: { status: BatchJob['status'] }) {
  switch (status) {
    case 'generating':
      return <Loader2 className="size-4 animate-spin text-blue-500" />;
    case 'completed':
      return <Check className="size-4 text-green-500" />;
    case 'failed':
      return <X className="size-4 text-red-500" />;
    default:
      // pending
      return (
        <span className="size-4 rounded-full border-2 border-muted-foreground/30 inline-block" />
      );
  }
}

// ── Channel Badge ──────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: 'blog' | 'instagram' }) {
  if (channel === 'blog') {
    return (
      <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-700">
        블로그
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="shrink-0 bg-purple-100 text-purple-700"
    >
      인스타그램
    </Badge>
  );
}

// ── Job result title extraction ────────────────────────────────────────────────

function getResultTitle(job: BatchJob): string | null {
  if (!job.result) return null;
  const r = job.result as Record<string, unknown>;
  if (typeof r.title === 'string') return r.title;
  const data = r.data as Record<string, unknown> | undefined;
  if (data && typeof data.title === 'string') return data.title;
  return null;
}

// ── Type display name ──────────────────────────────────────────────────────────

function getTypeDisplayName(job: BatchJob): string {
  if (job.channel === 'blog') {
    const config = BLOG_TYPES.find((t) => t.id === job.type);
    return config ? config.nameKo : job.type;
  }
  const config = INSTAGRAM_TYPES.find((t) => t.id === job.type);
  return config ? config.nameKo : job.type;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function BatchGenerator({
  projectId,
  brandDNA,
  open,
  onOpenChange,
  onComplete,
}: BatchGeneratorProps) {
  // ── Configuration state ────────────────────────────────────────────────────

  const [blogCount, setBlogCount] = React.useState<number>(3);
  const [instagramCount, setInstagramCount] = React.useState<number>(5);
  const [blogType, setBlogType] = React.useState<string>('auto');
  const [instagramType, setInstagramType] = React.useState<string>('auto');
  const [copyStyle, setCopyStyle] = React.useState<CopyStyleId>('burnett');
  const [keywords, setKeywords] = React.useState<string>('');

  // ── Execution state ────────────────────────────────────────────────────────

  const [jobs, setJobs] = React.useState<BatchJob[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [currentJobIndex, setCurrentJobIndex] = React.useState(0);
  const [isDone, setIsDone] = React.useState(false);

  // 실행 중 중단 여부를 ref로 추적 (cleanup 시 루프 탈출용)
  const abortRef = React.useRef(false);

  // ── Derived values ─────────────────────────────────────────────────────────

  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const totalCount = jobs.length;
  const progressPercent =
    totalCount > 0
      ? Math.round(((completedCount + failedCount) / totalCount) * 100)
      : 0;

  // ── Reset when dialog closes ───────────────────────────────────────────────

  React.useEffect(() => {
    if (!open) {
      abortRef.current = true;
      // 닫힌 뒤 상태 초기화 (다음 오픈을 위해)
      const timer = setTimeout(() => {
        setJobs([]);
        setIsRunning(false);
        setCurrentJobIndex(0);
        setIsDone(false);
        abortRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ── Job queue builder ──────────────────────────────────────────────────────

  function buildJobQueue(): BatchJob[] {
    const queue: BatchJob[] = [];

    for (let i = 0; i < blogCount; i++) {
      queue.push({
        id: makeJobId(),
        channel: 'blog',
        type: resolveBlogType(blogType, i),
        status: 'pending',
      });
    }

    for (let i = 0; i < instagramCount; i++) {
      queue.push({
        id: makeJobId(),
        channel: 'instagram',
        type: resolveInstagramType(instagramType, i),
        status: 'pending',
      });
    }

    return queue;
  }

  // ── Job executor ──────────────────────────────────────────────────────────

  async function executeJob(job: BatchJob): Promise<BatchJob> {
    const keywordList = parseKeywords(keywords);

    if (job.channel === 'blog') {
      const body = {
        brandDNA,
        blogType: job.type,
        keywords: keywordList,
        copyStyle,
      };

      const res = await fetch('/api/generate/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { data: unknown; error: string | null };

      if (!res.ok || json.error) {
        return {
          ...job,
          status: 'failed',
          error: json.error ?? `HTTP ${res.status}`,
        };
      }

      return { ...job, status: 'completed', result: json.data };
    }

    // instagram
    const body = {
      brandDNA,
      postType: job.type,
      keywords: keywordList,
      copyStyle,
    };

    const res = await fetch('/api/generate/instagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as { data: unknown; error: string | null };

    if (!res.ok || json.error) {
      return {
        ...job,
        status: 'failed',
        error: json.error ?? `HTTP ${res.status}`,
      };
    }

    return { ...job, status: 'completed', result: json.data };
  }

  // ── Update single job in state ─────────────────────────────────────────────

  function updateJob(updated: BatchJob) {
    setJobs((prev) =>
      prev.map((j) => (j.id === updated.id ? updated : j)),
    );
  }

  // ── Start batch generation ─────────────────────────────────────────────────

  async function handleStart() {
    const queue = buildJobQueue();
    if (queue.length === 0) return;

    abortRef.current = false;
    setJobs(queue);
    setIsRunning(true);
    setCurrentJobIndex(0);
    setIsDone(false);

    const finalJobs: BatchJob[] = [...queue];

    for (let i = 0; i < queue.length; i++) {
      if (abortRef.current) break;

      setCurrentJobIndex(i);

      // 현재 job을 'generating'으로 표시
      const generatingJob: BatchJob = { ...finalJobs[i], status: 'generating' };
      finalJobs[i] = generatingJob;
      setJobs([...finalJobs]);

      try {
        const result = await executeJob(generatingJob);
        finalJobs[i] = result;
      } catch (err) {
        finalJobs[i] = {
          ...generatingJob,
          status: 'failed',
          error: err instanceof Error ? err.message : '알 수 없는 오류',
        };
      }

      setJobs([...finalJobs]);
    }

    setIsRunning(false);
    setIsDone(true);
    onComplete?.(finalJobs);
  }

  // ── Input clamp helpers ────────────────────────────────────────────────────

  function handleBlogCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.min(10, Math.max(0, Number(e.target.value)));
    setBlogCount(isNaN(v) ? 0 : v);
  }

  function handleInstagramCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.min(20, Math.max(0, Number(e.target.value)));
    setInstagramCount(isNaN(v) ? 0 : v);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const showProgress = isRunning || isDone;
  const canStart = !isRunning && (blogCount > 0 || instagramCount > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-yellow-500" />
            일괄 콘텐츠 생성
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* ── 설정 섹션 (생성 전 또는 완료 후 표시) ── */}
          {!isRunning && (
            <section className="space-y-5">
              {/* 블로그 설정 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  블로그
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="blog-count" className="text-xs">
                      생성 편수 <span className="text-muted-foreground">(0~10)</span>
                    </Label>
                    <Input
                      id="blog-count"
                      type="number"
                      min={0}
                      max={10}
                      value={blogCount}
                      onChange={handleBlogCountChange}
                      disabled={isRunning}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="blog-type" className="text-xs">
                      글 유형
                    </Label>
                    <Select
                      value={blogType}
                      onValueChange={setBlogType}
                      disabled={isRunning}
                    >
                      <SelectTrigger id="blog-type" className="h-8 text-sm">
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">자동 (혼합)</SelectItem>
                        {BLOG_TYPES.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nameKo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 인스타그램 설정 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  인스타그램
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="insta-count" className="text-xs">
                      생성 장수 <span className="text-muted-foreground">(0~20)</span>
                    </Label>
                    <Input
                      id="insta-count"
                      type="number"
                      min={0}
                      max={20}
                      value={instagramCount}
                      onChange={handleInstagramCountChange}
                      disabled={isRunning}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="insta-type" className="text-xs">
                      포스트 유형
                    </Label>
                    <Select
                      value={instagramType}
                      onValueChange={setInstagramType}
                      disabled={isRunning}
                    >
                      <SelectTrigger id="insta-type" className="h-8 text-sm">
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">자동 (혼합)</SelectItem>
                        {INSTAGRAM_TYPES.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nameKo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 공통 설정 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  공통 설정
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="copy-style" className="text-xs">
                      카피 스타일
                    </Label>
                    <Select
                      value={copyStyle}
                      onValueChange={(v) => setCopyStyle(v as CopyStyleId)}
                      disabled={isRunning}
                    >
                      <SelectTrigger id="copy-style" className="h-8 text-sm">
                        <SelectValue placeholder="스타일 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {COPY_STYLES.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nameKo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="keywords" className="text-xs">
                      키워드 <span className="text-muted-foreground">(쉼표 또는 공백으로 구분)</span>
                    </Label>
                    <Input
                      id="keywords"
                      placeholder="예: 콜라겐, 세럼, 피부탄력"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      disabled={isRunning}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── 진행 상황 섹션 ── */}
          {showProgress && (
            <section className="space-y-4">
              {/* 전체 진행 바 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {completedCount + failedCount} / {totalCount} 완료
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Job 목록 */}
              <div className="space-y-2">
                {jobs.map((job, idx) => {
                  const displayName = getTypeDisplayName(job);
                  const resultTitle = getResultTitle(job);
                  const isCurrent = isRunning && idx === currentJobIndex;

                  return (
                    <div
                      key={job.id}
                      className={`flex items-start gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                        isCurrent
                          ? 'border-blue-200 bg-blue-50'
                          : job.status === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : job.status === 'failed'
                          ? 'border-red-200 bg-red-50'
                          : 'border-border bg-background'
                      }`}
                    >
                      {/* 상태 아이콘 */}
                      <span className="mt-0.5 shrink-0">
                        <JobStatusIcon status={job.status} />
                      </span>

                      {/* 채널 뱃지 */}
                      <ChannelBadge channel={job.channel} />

                      {/* 유형 + 결과 타이틀 */}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">
                          {displayName}
                        </span>
                        {resultTitle && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {resultTitle}
                          </p>
                        )}
                        {job.status === 'failed' && job.error && (
                          <p className="mt-0.5 text-xs text-red-600 truncate">
                            {job.error}
                          </p>
                        )}
                      </div>

                      {/* 상태 텍스트 */}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {job.status === 'pending' && '대기 중'}
                        {job.status === 'generating' && '생성 중...'}
                        {job.status === 'completed' && '완료'}
                        {job.status === 'failed' && '실패'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 완료 요약 */}
              {isDone && (
                <div className="rounded-md bg-muted px-4 py-3 text-sm">
                  <p className="font-medium">
                    생성 완료:&nbsp;
                    <span className="text-green-600">{completedCount}건 성공</span>
                    {failedCount > 0 && (
                      <span className="text-red-600 ml-2">
                        {failedCount}건 실패
                      </span>
                    )}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── 하단 액션 버튼 ── */}
        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
          {!isDone ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isRunning}
              >
                취소
              </Button>
              <Button
                onClick={handleStart}
                disabled={!canStart}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    일괄 생성 시작
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>닫기</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

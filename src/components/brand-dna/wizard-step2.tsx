'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TagInput } from '@/components/brand-dna/tag-input';
import { useBrandDNAStore } from '@/stores/brand-dna-store';
import type { BrandCore, TargetAudience } from '@/types/brand-dna';

// 브랜드 퍼스낼리티 선택지
const PERSONALITY_OPTIONS = [
  '혁신적',
  '신뢰감',
  '친근한',
  '전문적',
  '고급스러운',
  '활동적',
  '따뜻한',
  '세련된',
  '유쾌한',
  '대담한',
  '감성적',
  '실용적',
] as const;

const AGE_OPTIONS = [
  { value: '10대', label: '10대' },
  { value: '20대 초반', label: '20대 초반' },
  { value: '20대 후반', label: '20대 후반' },
  { value: '30대', label: '30대' },
  { value: '40대', label: '40대' },
  { value: '50대', label: '50대' },
  { value: '60대 이상', label: '60대 이상' },
];

const GENDER_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '남성', label: '남성' },
  { value: '여성', label: '여성' },
];

const INCOME_OPTIONS = [
  { value: '학생/저소득', label: '학생/저소득' },
  { value: '중간', label: '중간' },
  { value: '중상', label: '중상' },
  { value: '고소득', label: '고소득' },
];

export function WizardStep2() {
  const { layers, updateLayer } = useBrandDNAStore();

  // 브랜드 핵심 로컬 상태 — store에서 초기화
  const [brandName, setBrandName] = useState<string>(layers.brandCore?.brandName ?? '');
  const [brandSlogan, setBrandSlogan] = useState<string>(layers.brandCore?.brandSlogan ?? '');
  const [coreValues, setCoreValues] = useState<string[]>(layers.brandCore?.coreValues ?? []);
  const [brandPersonality, setBrandPersonality] = useState<string[]>(
    layers.brandCore?.brandPersonality ?? []
  );
  const [usp, setUsp] = useState<string>(layers.brandCore?.usp ?? '');
  const [brandStory, setBrandStory] = useState<string>(layers.brandCore?.brandStory ?? '');

  // 타겟 고객 로컬 상태 — store에서 초기화
  const [primaryAge, setPrimaryAge] = useState<string>(layers.targetAudience?.primaryAge ?? '');
  const [gender, setGender] = useState<string>(layers.targetAudience?.gender ?? '');
  const [location, setLocation] = useState<string>(layers.targetAudience?.location ?? '');
  const [income, setIncome] = useState<string>(layers.targetAudience?.income ?? '');
  const [interests, setInterests] = useState<string[]>(layers.targetAudience?.interests ?? []);
  const [painPoints, setPainPoints] = useState<string[]>(layers.targetAudience?.painPoints ?? []);
  const [buyingMotivation, setBuyingMotivation] = useState<string[]>(
    layers.targetAudience?.buyingMotivation ?? []
  );

  // store 변경 시 로컬 상태 동기화 (외부에서 레이어가 바뀔 경우 대비)
  useEffect(() => {
    const bc = layers.brandCore;
    if (bc) {
      setBrandName(bc.brandName ?? '');
      setBrandSlogan(bc.brandSlogan ?? '');
      setCoreValues(bc.coreValues ?? []);
      setBrandPersonality(bc.brandPersonality ?? []);
      setUsp(bc.usp ?? '');
      setBrandStory(bc.brandStory ?? '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ta = layers.targetAudience;
    if (ta) {
      setPrimaryAge(ta.primaryAge ?? '');
      setGender(ta.gender ?? '');
      setLocation(ta.location ?? '');
      setIncome(ta.income ?? '');
      setInterests(ta.interests ?? []);
      setPainPoints(ta.painPoints ?? []);
      setBuyingMotivation(ta.buyingMotivation ?? []);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // BrandCore 헬퍼 — 변경된 필드만 병합하여 store 업데이트
  function updateBrandCore(patch: Partial<BrandCore>) {
    updateLayer('brandCore', {
      brandName,
      coreValues,
      brandPersonality,
      usp,
      brandSlogan,
      brandStory,
      ...patch,
    });
  }

  // TargetAudience 헬퍼
  function updateTargetAudience(patch: Partial<TargetAudience>) {
    updateLayer('targetAudience', {
      primaryAge,
      interests,
      painPoints,
      buyingMotivation,
      gender,
      location,
      income,
      ...patch,
    });
  }

  // 퍼스낼리티 토글
  function togglePersonality(option: string) {
    const next = brandPersonality.includes(option)
      ? brandPersonality.filter((p) => p !== option)
      : [...brandPersonality, option];
    setBrandPersonality(next);
    updateBrandCore({ brandPersonality: next });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Card 1: 브랜드 핵심 ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>브랜드 핵심</CardTitle>
          <CardDescription>
            브랜드의 정체성과 핵심 가치를 정의합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* 브랜드명 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brandName">
              브랜드명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brandName"
              placeholder="예) 브랜드헬릭스"
              value={brandName}
              onChange={(e) => {
                setBrandName(e.target.value);
                updateBrandCore({ brandName: e.target.value });
              }}
            />
          </div>

          {/* 슬로건 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brandSlogan">슬로건</Label>
            <Input
              id="brandSlogan"
              placeholder="예) 당신의 브랜드, AI가 완성합니다"
              value={brandSlogan}
              onChange={(e) => {
                setBrandSlogan(e.target.value);
                updateBrandCore({ brandSlogan: e.target.value });
              }}
            />
          </div>

          {/* 핵심 가치 */}
          <div className="flex flex-col gap-1.5">
            <Label>핵심 가치</Label>
            <TagInput
              value={coreValues}
              onChange={(tags) => {
                setCoreValues(tags);
                updateBrandCore({ coreValues: tags });
              }}
              placeholder="핵심 가치를 입력하세요"
              maxTags={5}
            />
            <p className="text-xs text-muted-foreground">최대 5개</p>
          </div>

          {/* 브랜드 퍼스낼리티 */}
          <div className="flex flex-col gap-2">
            <Label>브랜드 퍼스낼리티</Label>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS.map((option) => {
                const isSelected = brandPersonality.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => togglePersonality(option)}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                    aria-pressed={isSelected}
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer select-none px-3 py-1 text-sm transition-colors"
                    >
                      {option}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* USP */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usp">
              USP (차별화 포인트) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="usp"
              placeholder="경쟁사 대비 우리 브랜드만의 독보적인 강점을 입력하세요"
              value={usp}
              onChange={(e) => {
                setUsp(e.target.value);
                updateBrandCore({ usp: e.target.value });
              }}
            />
          </div>

          {/* 브랜드 스토리 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brandStory">브랜드 스토리</Label>
            <Textarea
              id="brandStory"
              placeholder="브랜드의 탄생 배경, 철학, 비전을 자유롭게 작성하세요"
              rows={3}
              value={brandStory}
              onChange={(e) => {
                setBrandStory(e.target.value);
                updateBrandCore({ brandStory: e.target.value });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Card 2: 타겟 고객 ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>타겟 고객</CardTitle>
          <CardDescription>
            주요 고객군의 특성과 행동 패턴을 정의합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* 주요 연령대 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="primaryAge">주요 연령대</Label>
            <Select
              value={primaryAge}
              onValueChange={(val) => {
                setPrimaryAge(val);
                updateTargetAudience({ primaryAge: val });
              }}
            >
              <SelectTrigger id="primaryAge" className="w-full">
                <SelectValue placeholder="연령대를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 성별 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gender">성별</Label>
            <Select
              value={gender}
              onValueChange={(val) => {
                setGender(val);
                updateTargetAudience({ gender: val });
              }}
            >
              <SelectTrigger id="gender" className="w-full">
                <SelectValue placeholder="성별을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 지역 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">지역</Label>
            <Input
              id="location"
              placeholder="서울, 수도권, 전국 등"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                updateTargetAudience({ location: e.target.value });
              }}
            />
          </div>

          {/* 소득 수준 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="income">소득 수준</Label>
            <Select
              value={income}
              onValueChange={(val) => {
                setIncome(val);
                updateTargetAudience({ income: val });
              }}
            >
              <SelectTrigger id="income" className="w-full">
                <SelectValue placeholder="소득 수준을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 관심사 */}
          <div className="flex flex-col gap-1.5">
            <Label>관심사</Label>
            <TagInput
              value={interests}
              onChange={(tags) => {
                setInterests(tags);
                updateTargetAudience({ interests: tags });
              }}
              placeholder="관심사를 입력하세요"
              maxTags={8}
            />
            <p className="text-xs text-muted-foreground">최대 8개</p>
          </div>

          {/* 페인포인트 */}
          <div className="flex flex-col gap-1.5">
            <Label>페인포인트</Label>
            <TagInput
              value={painPoints}
              onChange={(tags) => {
                setPainPoints(tags);
                updateTargetAudience({ painPoints: tags });
              }}
              placeholder="고객의 고민/불편사항"
              maxTags={5}
            />
            <p className="text-xs text-muted-foreground">최대 5개</p>
          </div>

          {/* 구매 동기 */}
          <div className="flex flex-col gap-1.5">
            <Label>구매 동기</Label>
            <TagInput
              value={buyingMotivation}
              onChange={(tags) => {
                setBuyingMotivation(tags);
                updateTargetAudience({ buyingMotivation: tags });
              }}
              placeholder="구매 동기를 입력하세요"
              maxTags={5}
            />
            <p className="text-xs text-muted-foreground">최대 5개</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

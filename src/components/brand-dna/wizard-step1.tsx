'use client';

import { useEffect, useCallback } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/brand-dna/tag-input';
import { useBrandDNAStore } from '@/stores/brand-dna-store';
import { INDUSTRIES } from '@/types/style';
import type { CompanyIdentity } from '@/types/brand-dna';

const EMPLOYEE_COUNT_OPTIONS = [
  '1-10명',
  '11-50명',
  '51-200명',
  '201-1000명',
  '1000명 이상',
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export function WizardStep1() {
  const { layers, updateLayer } = useBrandDNAStore();

  // Current company identity data from store, defaulting to empty shape
  const companyIdentity: Partial<CompanyIdentity> = layers.companyIdentity ?? {};

  // Derive controlled field values — keep them stable references
  const companyName = companyIdentity.companyName ?? '';
  const industry = companyIdentity.industry ?? '';
  const foundedYear = companyIdentity.foundedYear;
  const employeeCount = companyIdentity.employeeCount ?? '';
  const mainProducts = companyIdentity.mainProducts ?? [];
  const businessModel = companyIdentity.businessModel ?? '';
  const missionStatement = companyIdentity.missionStatement ?? '';

  // Initialize layer if not yet present so the store is aware of the step
  useEffect(() => {
    if (!layers.companyIdentity) {
      updateLayer('companyIdentity', {
        companyName: '',
        industry: '',
        mainProducts: [],
        businessModel: '',
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generic field updater — merges a single key into companyIdentity
  const handleChange = useCallback(
    <K extends keyof CompanyIdentity>(key: K, value: CompanyIdentity[K]) => {
      updateLayer('companyIdentity', { [key]: value } as Partial<CompanyIdentity>);
    },
    [updateLayer]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
        <CardDescription>
          회사와 비즈니스에 대한 기본 정보를 입력해주세요. 이 정보를 바탕으로
          Brand DNA 분석이 시작됩니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-5">
          {/* 회사명 */}
          <div className="space-y-1.5">
            <Label htmlFor="companyName">
              회사명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="예: (주)브랜드헬릭스"
              value={companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              autoComplete="organization"
            />
          </div>

          {/* 업종 */}
          <div className="space-y-1.5">
            <Label htmlFor="industry">업종</Label>
            <Select
              value={industry}
              onValueChange={(value) => handleChange('industry', value)}
            >
              <SelectTrigger id="industry" className="w-full">
                <SelectValue placeholder="업종을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industryOption) => (
                  <SelectItem key={industryOption} value={industryOption}>
                    {industryOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설립연도 */}
          <div className="space-y-1.5">
            <Label htmlFor="foundedYear">설립연도</Label>
            <Input
              id="foundedYear"
              type="number"
              placeholder="예: 2015"
              min={1900}
              max={CURRENT_YEAR}
              value={foundedYear ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  // Remove foundedYear by setting undefined
                  updateLayer('companyIdentity', {
                    foundedYear: undefined,
                  });
                } else {
                  const parsed = parseInt(raw, 10);
                  if (!isNaN(parsed)) {
                    handleChange('foundedYear', parsed);
                  }
                }
              }}
              className="max-w-[180px]"
            />
          </div>

          {/* 직원 수 */}
          <div className="space-y-1.5">
            <Label htmlFor="employeeCount">직원 수</Label>
            <Select
              value={employeeCount}
              onValueChange={(value) => handleChange('employeeCount', value)}
            >
              <SelectTrigger id="employeeCount" className="w-full max-w-[220px]">
                <SelectValue placeholder="직원 수를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 주요 상품/서비스 */}
          <div className="space-y-1.5">
            <Label>주요 상품/서비스</Label>
            <p className="text-xs text-muted-foreground">
              최대 10개까지 추가할 수 있습니다. 입력 후 Enter 또는 쉼표로 구분하세요.
            </p>
            <TagInput
              value={mainProducts}
              onChange={(tags) => handleChange('mainProducts', tags)}
              placeholder="상품/서비스명 입력 후 Enter"
              maxTags={10}
            />
          </div>

          {/* 비즈니스 모델 */}
          <div className="space-y-1.5">
            <Label htmlFor="businessModel">비즈니스 모델</Label>
            <p className="text-xs text-muted-foreground">
              B2B, B2C, D2C, 구독, 마켓플레이스 등 비즈니스 모델을 설명해주세요.
            </p>
            <Textarea
              id="businessModel"
              placeholder="예: D2C 이커머스 기반의 B2C 모델. 자체 브랜드 제품을 온라인 쇼핑몰을 통해 최종 소비자에게 직접 판매합니다."
              rows={3}
              value={businessModel}
              onChange={(e) => handleChange('businessModel', e.target.value)}
            />
          </div>

          {/* 미션/비전 (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="missionStatement">
              미션/비전{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (선택)
              </span>
            </Label>
            <Textarea
              id="missionStatement"
              placeholder="예: 모든 브랜드가 AI의 힘으로 일관된 마케팅 채널을 운영할 수 있도록 지원한다."
              rows={3}
              value={missionStatement}
              onChange={(e) => handleChange('missionStatement', e.target.value)}
            />
          </div>

          {/* 웹사이트 URL */}
          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl">웹사이트 URL</Label>
            <div className="flex gap-2">
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://example.com"
                // websiteUrl is stored at project level, not in companyIdentity;
                // handled here as a local display field — Session 5 will wire this up
                readOnly
                disabled
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled
                title="Session 5에서 구현 예정"
              >
                자동 분석
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              자동 분석 기능은 곧 지원될 예정입니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

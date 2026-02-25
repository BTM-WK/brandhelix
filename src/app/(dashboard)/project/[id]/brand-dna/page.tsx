'use client';

import { use, useCallback } from 'react';
import { CheckIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WizardStep1 } from '@/components/brand-dna/wizard-step1';
import { WizardStep2 } from '@/components/brand-dna/wizard-step2';
import { WizardStep3 } from '@/components/brand-dna/wizard-step3';
import { useBrandDNAStore } from '@/stores/brand-dna-store';

interface BrandDNAPageProps {
  params: Promise<{ id: string }>;
}

const STEPS = [
  { number: 1, label: '기본 정보' },
  { number: 2, label: '브랜드 & 타겟' },
  { number: 3, label: '스타일 & 채널' },
] as const;

export default function BrandDNAPage({ params }: BrandDNAPageProps) {
  // Unwrap async params with React.use()
  const { id: projectId } = use(params);

  const { currentStep, setStep, isDirty, saveDraft, calculateCompleteness } =
    useBrandDNAStore();

  const completeness = calculateCompleteness();

  // Save draft if dirty, then navigate to the target step
  const navigateStep = useCallback(
    async (targetStep: number) => {
      if (isDirty) {
        try {
          await saveDraft();
        } catch {
          // Non-blocking: warn but allow navigation
          toast.error('임시저장 중 오류가 발생했습니다.');
        }
      }
      setStep(targetStep);
    },
    [isDirty, saveDraft, setStep]
  );

  const handlePrev = () => {
    if (currentStep > 1) {
      void navigateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      void navigateStep(currentStep + 1);
    }
  };

  const handleFinish = async () => {
    try {
      await saveDraft();
      toast.success('Brand DNA가 저장되었습니다.');
    } catch {
      toast.error('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      toast.success('임시저장 완료');
    } catch {
      toast.error('임시저장 실패. 다시 시도해주세요.');
    }
  };

  return (
    <div className="flex flex-col gap-6" data-project-id={projectId}>
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand DNA 분석</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          브랜드 정보를 단계별로 입력하면 AI가 Brand DNA를 분석합니다.
        </p>
      </div>

      {/* Step indicator + completeness */}
      <div className="flex flex-col gap-3">
        {/* Step circles and connectors */}
        <div className="flex items-center">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;

            return (
              <div key={step.number} className="flex items-center">
                {/* Step node */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      // Allow clicking back to previous steps or current step
                      if (step.number <= currentStep) {
                        void navigateStep(step.number);
                      }
                    }}
                    disabled={step.number > currentStep}
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                      isCompleted
                        ? 'border-primary bg-primary text-primary-foreground cursor-pointer'
                        : isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 bg-background text-muted-foreground cursor-not-allowed',
                    ].join(' ')}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`Step ${step.number}: ${step.label}`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      step.number
                    )}
                  </button>
                  <span
                    className={[
                      'text-xs font-medium whitespace-nowrap',
                      isActive
                        ? 'text-primary'
                        : isCompleted
                          ? 'text-primary'
                          : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line between steps */}
                {index < STEPS.length - 1 && (
                  <div
                    className={[
                      'mx-3 mb-5 h-0.5 w-16 flex-shrink-0 transition-colors',
                      currentStep > step.number
                        ? 'bg-primary'
                        : 'bg-muted-foreground/20',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Completeness progress bar */}
        <div className="flex items-center gap-3">
          <Progress value={completeness} className="h-1.5 flex-1" />
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {completeness}%
          </span>
        </div>
      </div>

      {/* Active step content */}
      <div className="min-h-0 flex-1">
        {currentStep === 1 && <WizardStep1 />}
        {currentStep === 2 && <WizardStep2 />}
        {currentStep === 3 && <WizardStep3 />}
      </div>

      {/* Bottom navigation bar */}
      <div className="flex items-center justify-between border-t pt-4">
        {/* Left: 임시저장 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleSaveDraft()}
        >
          임시저장
        </Button>

        {/* Right: 이전 / 다음 or 완료 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            이전
          </Button>

          {currentStep < 3 ? (
            <Button size="sm" onClick={handleNext}>
              다음
            </Button>
          ) : (
            <Button size="sm" onClick={() => void handleFinish()}>
              완료
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

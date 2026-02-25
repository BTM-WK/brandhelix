'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DESIGN_TONES } from '@/types/style';
import { cn } from '@/lib/utils';

interface DesignToneSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function DesignToneSelector({ value, onChange }: DesignToneSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {DESIGN_TONES.map((tone) => {
        const isSelected = value === tone.id;

        return (
          <Card
            key={tone.id}
            onClick={() => onChange(tone.id)}
            className={cn(
              'cursor-pointer transition-all duration-150 hover:shadow-md',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            )}
          >
            <CardContent className="p-4 flex flex-col gap-2.5">
              {/* 톤 이름 */}
              <span className="font-semibold text-sm text-foreground leading-tight">
                {tone.name}
              </span>

              {/* 설명 */}
              <p className="text-xs text-muted-foreground leading-snug line-clamp-1">
                {tone.description}
              </p>

              {/* 컬러 팔레트 프리뷰 */}
              <div className="flex items-center gap-1.5">
                {tone.colors.map((hex, index) => (
                  <span
                    key={index}
                    title={hex}
                    style={{ backgroundColor: hex }}
                    className={cn(
                      'inline-block w-6 h-6 rounded-full border border-black/10 flex-shrink-0',
                      // 흰색 계열 컬러는 경계선 더 진하게
                      hex === '#FFFFFF' || hex === '#F8FAFB' || hex === '#F5F0E8'
                        ? 'border-black/20'
                        : ''
                    )}
                    aria-label={`컬러 ${hex}`}
                  />
                ))}
                {/* 악센트 컬러 */}
                <span
                  title={`Accent: ${tone.accentExample}`}
                  style={{ backgroundColor: tone.accentExample }}
                  className="inline-block w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0 ring-1 ring-black/10"
                  aria-label={`포인트 컬러 ${tone.accentExample}`}
                />
              </div>

              {/* 컬러 스킴 레이블 */}
              <p className="text-[10px] text-muted-foreground/70 leading-tight">
                {tone.colorScheme}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

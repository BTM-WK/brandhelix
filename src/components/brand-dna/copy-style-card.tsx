'use client';

import { Card, CardContent } from '@/components/ui/card';
import { COPY_STYLES } from '@/types/style';
import { cn } from '@/lib/utils';

interface CopyStyleSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function CopyStyleSelector({ value, onChange }: CopyStyleSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {COPY_STYLES.map((style) => {
        const isSelected = value === style.id;

        return (
          <Card
            key={style.id}
            onClick={() => onChange(style.id)}
            className={cn(
              'cursor-pointer transition-all duration-150 hover:shadow-md',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            )}
          >
            <CardContent className="p-4 flex flex-col gap-1.5">
              {/* 제목: 한국어 이름 */}
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-foreground leading-tight">
                  {style.nameKo}
                </span>
                <span className="text-xs text-muted-foreground">{style.name}</span>
              </div>

              {/* 설명 */}
              <p className="text-xs text-muted-foreground leading-snug line-clamp-1">
                {style.description}
              </p>

              {/* 예문 */}
              <p className="text-xs text-muted-foreground/80 italic leading-snug line-clamp-2">
                &ldquo;{style.example}&rdquo;
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ value, onChange, placeholder = '입력 후 Enter 또는 쉼표로 추가', maxTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // 최대 태그 수 초과 방지
    if (maxTags !== undefined && value.length >= maxTags) return;

    // 중복 방지 (대소문자 무관)
    const alreadyExists = value.some((tag) => tag.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) return;

    onChange([...value, trimmed]);
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // 입력값이 없을 때 Backspace로 마지막 태그 삭제
      removeTag(value.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 쉼표 입력 시 즉시 태그 추가
    if (raw.endsWith(',')) {
      addTag(raw.slice(0, -1));
      setInputValue('');
    } else {
      setInputValue(raw);
    }
  };

  const isAtLimit = maxTags !== undefined && value.length >= maxTags;

  return (
    <div className="flex flex-col gap-2">
      {/* 태그 목록 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1 text-sm">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                aria-label={`${tag} 태그 삭제`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 입력 필드 */}
      <Input
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={isAtLimit ? `최대 ${maxTags}개 입력 가능` : placeholder}
        disabled={isAtLimit}
        className="w-full"
      />

      {/* 태그 수 표시 */}
      {maxTags !== undefined && (
        <p className="text-xs text-muted-foreground text-right">
          {value.length} / {maxTags}
        </p>
      )}
    </div>
  );
}

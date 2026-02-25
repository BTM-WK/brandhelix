import { create } from 'zustand';
import type { BrandDNALayers } from '@/types/brand-dna';

interface BrandDNAStore {
  currentStep: number;
  layers: Partial<BrandDNALayers>;
  isDirty: boolean;

  // Actions
  setStep: (step: number) => void;
  updateLayer: <K extends keyof BrandDNALayers>(key: K, data: Partial<BrandDNALayers[K]>) => void;
  saveDraft: () => Promise<void>;
  calculateCompleteness: () => number;
}

export const useBrandDNAStore = create<BrandDNAStore>((set, get) => ({
  currentStep: 0,
  layers: {},
  isDirty: false,

  setStep: (step: number) => {
    set({ currentStep: step });
  },

  updateLayer: <K extends keyof BrandDNALayers>(key: K, data: Partial<BrandDNALayers[K]>) => {
    set((state) => ({
      layers: {
        ...state.layers,
        [key]: {
          ...state.layers[key],
          ...data,
        } as BrandDNALayers[K],
      },
      isDirty: true,
    }));
  },

  saveDraft: async () => {
    // MVP: 로컬 저장 시뮬레이션 — 추후 Supabase 연동 예정
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    set({ isDirty: false });
  },

  calculateCompleteness: () => {
    const { layers } = get();
    const pointsPerLayer = 12.5;
    let score = 0;

    // Layer 1: companyIdentity — companyName 필수 체크
    if (layers.companyIdentity?.companyName?.trim()) {
      score += pointsPerLayer;
    }

    // Layer 2: brandCore — brandName 필수 체크
    if (layers.brandCore?.brandName?.trim()) {
      score += pointsPerLayer;
    }

    // Layer 3: targetAudience — primaryAge 필수 체크
    if (layers.targetAudience?.primaryAge?.trim()) {
      score += pointsPerLayer;
    }

    // Layer 4: visualIdentity — designTone 필수 체크
    if (layers.visualIdentity?.designTone?.trim()) {
      score += pointsPerLayer;
    }

    // Layer 5: verbalIdentity — copyStyle 필수 체크
    if (layers.verbalIdentity?.copyStyle?.trim()) {
      score += pointsPerLayer;
    }

    // Layer 6: competitivePosition — directCompetitors 1개 이상
    if ((layers.competitivePosition?.directCompetitors?.length ?? 0) > 0) {
      score += pointsPerLayer;
    }

    // Layer 7: channelStrategy — channels 1개 이상
    if ((layers.channelStrategy?.channels?.length ?? 0) > 0) {
      score += pointsPerLayer;
    }

    // Layer 8: creativeStyle — copyStyle 필수 체크
    if (layers.creativeStyle?.copyStyle?.trim()) {
      score += pointsPerLayer;
    }

    return Math.round(score);
  },
}));

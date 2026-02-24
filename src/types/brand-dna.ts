// Brand DNA types - 8-Layer structure
// Will be fully defined in Phase 1 Session 2

export interface BrandDNA {
  id: string;
  projectId: string;
  layers: BrandDNALayers;
  completenessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDNALayers {
  companyIdentity?: CompanyIdentity;
  brandCore?: BrandCore;
  targetAudience?: TargetAudience;
  visualIdentity?: VisualIdentity;
  verbalIdentity?: VerbalIdentity;
  competitivePosition?: CompetitivePosition;
  channelStrategy?: ChannelStrategy;
  creativeStyle?: CreativeStyle;
}

export interface CompanyIdentity {
  companyName: string;
  industry: string;
  foundedYear?: number;
  mainProducts: string[];
  businessModel: string;
}

export interface BrandCore {
  brandName: string;
  brandSlogan?: string;
  coreValues: string[];
  brandPersonality: string[];
  usp: string;
}

export interface TargetAudience {
  primaryAge: string;
  interests: string[];
  painPoints: string[];
  buyingMotivation: string[];
}

export interface VisualIdentity {
  primaryColors: string[];
  designTone: string;
}

export interface VerbalIdentity {
  toneOfVoice: string[];
  keyMessages: string[];
  copyStyle: string;
}

export interface CompetitivePosition {
  directCompetitors: { name: string; websiteUrl?: string }[];
  differentiators: string[];
}

export interface ChannelStrategy {
  primaryChannel: string;
  channels: { channel: string; enabled: boolean; priority: number }[];
}

export interface CreativeStyle {
  copyStyle: string;
  designTone: string;
  moodKeywords?: string[];
}

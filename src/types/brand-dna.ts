export interface BrandDNA {
  id: string;
  projectId: string;
  layers: BrandDNALayers;
  completenessScore: number; // 0-100
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

// Layer 1: Company Identity
export interface CompanyIdentity {
  companyName: string;
  industry: string;
  foundedYear?: number;
  employeeCount?: string;
  annualRevenue?: string;
  mainProducts: string[];
  businessModel: string;
  missionStatement?: string;
}

// Layer 2: Brand Core
export interface BrandCore {
  brandName: string;
  brandSlogan?: string;
  brandStory?: string;
  coreValues: string[];
  brandPersonality: string[]; // e.g., ['trustworthy', 'innovative']
  brandPromise?: string;
  usp: string; // Unique Selling Proposition
}

// Layer 3: Target Audience
export interface TargetAudience {
  primaryAge: string;
  gender?: string;
  location?: string;
  income?: string;
  interests: string[];
  painPoints: string[];
  buyingMotivation: string[];
  mediaConsumption?: string[];
}

// Layer 4: Visual Identity
export interface VisualIdentity {
  primaryColors: string[];
  secondaryColors?: string[];
  logoUrl?: string;
  fontFamily?: string;
  imageStyle?: string; // e.g., 'photography', 'illustration'
  designTone: string; // references DesignToneId from style.ts
}

// Layer 5: Verbal Identity
export interface VerbalIdentity {
  toneOfVoice: string[];
  writingStyle?: string;
  keyMessages: string[];
  forbiddenWords?: string[];
  copyStyle: string; // references CopyStyleId from style.ts
  hashtags?: string[];
}

// Layer 6: Competitive Position
export interface CompetitivePosition {
  directCompetitors: Competitor[];
  indirectCompetitors?: Competitor[];
  differentiators: string[];
  marketPosition?: string;
}

export interface Competitor {
  name: string;
  websiteUrl?: string;
  strengths?: string[];
  weaknesses?: string[];
}

// Layer 7: Channel Strategy
export interface ChannelStrategy {
  primaryChannel: string;
  channels: ChannelConfig[];
  postingFrequency?: Record<string, string>;
}

export interface ChannelConfig {
  channel: 'site' | 'blog' | 'instagram' | 'shortform';
  enabled: boolean;
  priority: number;
  goal?: string;
}

// Layer 8: Creative Style
export interface CreativeStyle {
  copyStyle: string;   // 8 copy styles 중 선택
  designTone: string;  // 6 design tones 중 선택
  referenceUrls?: string[];
  moodKeywords?: string[];
}

// Crawl result type (used by Engine 1)
export interface CrawlResult {
  id: string;
  projectId: string;
  type: 'website' | 'sns' | 'blog' | 'news' | 'competitor';
  rawData?: Record<string, unknown>;
  analysis?: Record<string, unknown>;
  crawledAt: string;
}

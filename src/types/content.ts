export type ChannelType = 'site' | 'blog' | 'instagram' | 'shortform';
export type ContentStatus = 'draft' | 'approved' | 'scheduled' | 'published';

export interface GeneratedContent {
  id: string;
  projectId: string;
  channel: ChannelType;
  contentType: string;
  title?: string;
  body: Record<string, unknown>;
  images: string[]; // R2 URLs
  copyStyle?: string;
  designTone?: string;
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  tokensUsed: number;
  generationCost: number;
  createdAt: string;
}

export interface GeneratedSite {
  id: string;
  projectId: string;
  pages: Record<string, SitePage>;
  designTokens?: Record<string, string>;
  template?: string;
  deployUrl?: string;
  customDomain?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SitePage {
  components: SiteComponent[];
  copy: Record<string, string>;
  images: string[];
}

export interface SiteComponent {
  type: string;
  props: Record<string, unknown>;
  order: number;
}

export interface GenerateContentInput {
  projectId: string;
  channel: ChannelType;
  contentType: string;
  copyStyle?: string;
  designTone?: string;
  keywords?: string[];
  productName?: string;
  additionalPrompt?: string;
}

export interface ApiUsageLog {
  id: string;
  userId: string;
  projectId?: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  createdAt: string;
}

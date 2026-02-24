// Generated content types

export interface GeneratedContent {
  id: string;
  projectId: string;
  channel: 'site' | 'blog' | 'instagram' | 'shortform';
  contentType: string;
  title?: string;
  body: Record<string, unknown>;
  images: string[];
  copyStyle?: string;
  designTone?: string;
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  scheduledAt?: string;
  publishedAt?: string;
  tokensUsed: number;
  generationCost: number;
  createdAt: string;
}

export interface GeneratedSite {
  id: string;
  projectId: string;
  pages: Record<string, unknown>;
  designTokens?: Record<string, unknown>;
  template?: string;
  deployUrl?: string;
  customDomain?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

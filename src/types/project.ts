export type ProjectStatus = 'draft' | 'dna_collecting' | 'dna_complete' | 'generating' | 'active' | 'paused';

export interface Project {
  id: string;
  userId: string;
  name: string;
  industry?: string;
  websiteUrl?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  industry?: string;
  websiteUrl?: string;
}

export interface UpdateProjectInput {
  name?: string;
  industry?: string;
  websiteUrl?: string;
  status?: ProjectStatus;
}

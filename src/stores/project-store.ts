import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Project, CreateProjectInput } from '@/types/project';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
  updateProjectStatus: (projectId: string, status: Project['status']) => void;
}

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    userId: 'user-1',
    name: '브랜드A 마케팅',
    industry: 'IT/테크',
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'proj-2',
    userId: 'user-1',
    name: '신제품 런칭',
    industry: '뷰티/화장품',
    websiteUrl: 'https://example.com',
    status: 'dna_complete',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'proj-3',
    userId: 'user-1',
    name: '리브랜딩 프로젝트',
    industry: '식품/음료',
    status: 'draft',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
];

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    set({ projects: mockProjects, isLoading: false });
  },

  createProject: async (data: CreateProjectInput) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: nanoid(),
      userId: 'user-1',
      name: data.name,
      industry: data.industry,
      websiteUrl: data.websiteUrl,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ projects: [...state.projects, newProject] }));

    return newProject;
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  updateProjectStatus: (projectId: string, status: Project['status']) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, status, updatedAt: new Date().toISOString() }
          : project
      ),
      currentProject:
        state.currentProject?.id === projectId
          ? { ...state.currentProject, status, updatedAt: new Date().toISOString() }
          : state.currentProject,
    }));
  },
}));

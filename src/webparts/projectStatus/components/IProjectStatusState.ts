import { IProjectStatusItem } from './IProjectStatusItem';

export type PageKey = 'addUpdate' | 'dashboard' | 'projects';

export interface IProjectStatusState {
  items: IProjectStatusItem[];
  isLoading: boolean;
  error?: string;

  projectsLookup: { id: number; title: string }[];
  isLoadingProjects: boolean;

  currentPage: PageKey;
}

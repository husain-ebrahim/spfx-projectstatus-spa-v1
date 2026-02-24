import { IProjectStatusItem } from './IProjectStatusItem';

export type PageKey = 'dashboard' | 'addUpdate';

export interface IProjectStatusState {
  items: IProjectStatusItem[];
  isLoading: boolean;
  error?: string;

  projectsLookup: { id: number; title: string }[];
  isLoadingProjects: boolean;

  currentPage: PageKey;
}

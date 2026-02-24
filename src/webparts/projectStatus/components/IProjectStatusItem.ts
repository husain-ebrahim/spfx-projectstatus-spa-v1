export interface IProjectStatusItem {
  id: number;
  projectId: number;
  projectTitle: string;
  health: 'Green' | 'Yellow' | 'Red' | string;
  plannedPercent: number;   // maps from Planned%
  actualPercent: number;    // maps from Actual%
  activities: string;
  issues: string;
  nextSteps: string;        // maps from Next
  created: string;
  createdBy: string;
}

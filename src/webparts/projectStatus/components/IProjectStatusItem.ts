export interface IProjectStatusItem {
  id: number;
  projectId: number;
  projectTitle: string;
  health: 'Green' | 'Yellow' | 'Red' | string;
  plannedPercent: number;   
  actualPercent: number;    
  activities: string;
  issues: string;
  nextSteps: string;        
  created: string;
  createdBy: string;
}

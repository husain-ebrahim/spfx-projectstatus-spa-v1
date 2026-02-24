export type HealthValue = 'Green' | 'Yellow' | 'Red';

export interface IUpdateFormState {
  projectId?: number;
  health: HealthValue;
  plannedPercent: number;
  actualPercent: number;
  activities: string;
  issues: string;
  nextSteps: string;
}

export const defaultFormState: IUpdateFormState = {
  projectId: undefined,
  health: 'Green',
  plannedPercent: 0,
  actualPercent: 0,
  activities: '',
  issues: '',
  nextSteps: ''
};

export const narrativeFields: {
  key: 'activities' | 'issues' | 'nextSteps';
  label: string;
  placeholder: string;
}[] = [
  {
    key: 'activities',
    label: 'Progress summary',
    placeholder: 'Summarize key activities and milestones completed this period.'
  },
  {
    key: 'issues',
    label: 'Issues and risks',
    placeholder: 'List blockers, risks, or decisions that need attention.'
  },
  {
    key: 'nextSteps',
    label: 'Next steps',
    placeholder: 'Outline the next actions, owners, and near-term timeline.'
  }
];

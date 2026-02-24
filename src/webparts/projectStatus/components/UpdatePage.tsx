import * as React from 'react';
import { ProjectStatusService } from '../services/ProjectStatusService';
import styles from './ProjectStatus.module.scss';

interface IUpdatePageProps {
  service: ProjectStatusService;
  projectsLookup: { id: number; title: string }[];
  isLoadingProjects: boolean;
  onCreated: () => void;
}

type HealthValue = 'Green' | 'Yellow' | 'Red';

interface IUpdateFormState {
  projectId?: number;
  health: HealthValue;
  plannedPercent: number;
  actualPercent: number;
  activities: string;
  issues: string;
  nextSteps: string;
}

const defaultFormState: IUpdateFormState = {
  projectId: undefined,
  health: 'Green',
  plannedPercent: 0,
  actualPercent: 0,
  activities: '',
  issues: '',
  nextSteps: ''
};

const healthPillClassMap: Record<HealthValue, string> = {
  Green: styles.psHealthPillGreen,
  Yellow: styles.psHealthPillYellow,
  Red: styles.psHealthPillRed
};

const narrativeFields: {
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

export const UpdatePage: React.FC<IUpdatePageProps> = ({
  service,
  projectsLookup,
  isLoadingProjects,
  onCreated
}) => {
  const [form, setForm] = React.useState<IUpdateFormState>(defaultFormState);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [success, setSuccess] = React.useState<string | undefined>();

  const setField = React.useCallback(
    <K extends keyof IUpdateFormState>(key: K, value: IUpdateFormState[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const onSave = async () => {
    setError(undefined);
    setSuccess(undefined);

    if (!form.projectId) {
      setError('Please choose a project before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await service.createStatus({
        projectId: form.projectId,
        health: form.health,
        plannedPercent: form.plannedPercent,
        actualPercent: form.actualPercent,
        activities: form.activities,
        issues: form.issues,
        nextSteps: form.nextSteps
      });

      setSuccess('Status update posted successfully.');
      setForm(defaultFormState);
      await onCreated();
    } catch (err: any) {
      setError(err.message || 'Error saving status update.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProject =
    form.projectId && projectsLookup.find(p => p.id === form.projectId)?.title;
  const selectedProjectId = form.projectId;
  const canShowForm = !!selectedProjectId;

  const onProjectSelect = (projectId: number) => {
    setError(undefined);
    setSuccess(undefined);
    setForm(prev => ({
      ...defaultFormState,
      projectId,
      health: prev.health
    }));
  };

  const onChangeProject = () => {
    setError(undefined);
    setSuccess(undefined);
    setForm(prev => ({
      ...defaultFormState,
      health: prev.health
    }));
  };

  return (
    <div className={styles.psUpdatePage}>
      <div className={styles.psSectionHeader}>
        <h2>Create status update</h2>
        <span className={styles.psSectionTag}>
          {canShowForm ? 'Step 2 of 2' : 'Step 1 of 2'}
        </span>
      </div>

      {(error || success) && (
        <div className={styles.psAlertStack}>
          {error && (
            <div className={`${styles.psAlert} ${styles.psAlertError}`}>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className={`${styles.psAlert} ${styles.psAlertSuccess}`}>
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      {!canShowForm ? (
        <div className={styles.psProjectPicker}>
          <div className={styles.psProjectPickerHeader}>
            <h3>Select a project</h3>
            <p>Choose one of your assigned projects to continue.</p>
          </div>

          {isLoadingProjects && (
            <div className={styles.psProjectPickerEmpty}>Loading projects…</div>
          )}

          {!isLoadingProjects && projectsLookup.length === 0 && (
            <div className={styles.psProjectPickerEmpty}>
              No projects are assigned to you as Project Manager.
            </div>
          )}

          {!isLoadingProjects && projectsLookup.length > 0 && (
            <div className={styles.psProjectList}>
              {projectsLookup.map(project => (
                <button
                  key={project.id}
                  type="button"
                  className={styles.psProjectListItem}
                  onClick={() => onProjectSelect(project.id)}
                  disabled={isSaving}
                >
                  <span className={styles.psProjectListTitle}>{project.title}</span>
                  <span className={styles.psProjectListAction}>Select</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.psFormShell}>
          <div className={styles.psFormMain}>
            <div className={styles.psComposerHeader}>
              <div className={styles.psComposerAvatar}>
                <span>DF</span>
              </div>
              <div className={styles.psComposerMeta}>
                <span className={styles.psComposerName}>
                  Project status update
                </span>
                <span className={styles.psComposerProject}>
                  {selectedProject || 'Selected project'}
                </span>
              </div>
              <button
                type="button"
                className={styles.psSecondaryButton}
                onClick={onChangeProject}
                disabled={isSaving}
              >
                Change project
              </button>
            </div>

            {narrativeFields.map(field => (
              <div key={field.key} className={styles.psField}>
                <label className={styles.psFieldLabel}>{field.label}</label>
                <textarea
                  className={styles.psTextArea}
                  placeholder={field.placeholder}
                  rows={3}
                  value={form[field.key]}
                  onChange={e => setField(field.key, e.target.value)}
                  disabled={isSaving}
                />
              </div>
            ))}
          </div>

          <div className={styles.psFormSide}>
            <div className={styles.psField}>
              <label className={styles.psFieldLabel}>Health</label>
              <div className={styles.psHealthPills}>
                {(['Green', 'Yellow', 'Red'] as const).map(h => (
                  <button
                    key={h}
                    type="button"
                    className={
                      form.health === h
                        ? `${styles.psHealthPill} ${styles.psHealthPillActive} ${healthPillClassMap[h]}`
                        : `${styles.psHealthPill} ${healthPillClassMap[h]}`
                    }
                    onClick={() => setField('health', h)}
                    disabled={isSaving}
                  >
                    <span className={styles.psHealthDot} />
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.psFieldGroup}>
              <div className={styles.psField}>
                <div className={styles.psFieldRow}>
                  <label className={styles.psFieldLabel}>Planned %</label>
                  <span className={styles.psFieldValue}>{form.plannedPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.plannedPercent}
                  onChange={e => setField('plannedPercent', Number(e.target.value))}
                  className={styles.psSlider}
                  disabled={isSaving}
                />
              </div>

              <div className={styles.psField}>
                <div className={styles.psFieldRow}>
                  <label className={styles.psFieldLabel}>Actual %</label>
                  <span className={styles.psFieldValue}>{form.actualPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.actualPercent}
                  onChange={e => setField('actualPercent', Number(e.target.value))}
                  className={`${styles.psSlider} ${styles.psSliderAccent}`}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className={styles.psFormActions}>
              <button
                type="button"
                className={styles.psPrimaryButton}
                onClick={onSave}
                disabled={isSaving || !form.projectId}
              >
                {isSaving ? 'Saving…' : 'Save update'}
              </button>
              <div className={styles.psFormHint}>
                Updates appear on the dashboard after save.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

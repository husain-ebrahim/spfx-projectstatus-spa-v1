import * as React from 'react';
import { ProjectStatusService } from '../services/ProjectStatusService';
import styles from './ProjectStatus.module.scss';
import { IProjectStatusItem } from './IProjectStatusItem';

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
  const [isLoadingPrevious, setIsLoadingPrevious] = React.useState<boolean>(false);
  const [copyPreviousData, setCopyPreviousData] = React.useState<boolean>(false);
  const [previousEntry, setPreviousEntry] = React.useState<IProjectStatusItem | undefined>();
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
    setCopyPreviousData(false);
    setPreviousEntry(undefined);
    setForm(prev => ({
      ...defaultFormState,
      projectId,
      health: prev.health
    }));
  };

  const onChangeProject = () => {
    setError(undefined);
    setSuccess(undefined);
    setCopyPreviousData(false);
    setPreviousEntry(undefined);
    setForm(prev => ({
      ...defaultFormState,
      health: prev.health
    }));
  };

  React.useEffect(() => {
    const loadPreviousEntry = async () => {
      if (!selectedProjectId) {
        return;
      }

      setIsLoadingPrevious(true);
      try {
        const previous = await service.getLatestStatusByProject(selectedProjectId);
        setPreviousEntry(previous);
      } catch (err: any) {
        setError(err.message || 'Error loading previous status entry.');
      } finally {
        setIsLoadingPrevious(false);
      }
    };

    void loadPreviousEntry();
  }, [selectedProjectId, service]);

  const onToggleCopyPreviousData = (checked: boolean) => {
    setCopyPreviousData(checked);

    if (!form.projectId) {
      return;
    }

    if (checked && previousEntry) {
      setForm(prev => ({
        ...prev,
        health: (previousEntry.health as HealthValue) || 'Green',
        plannedPercent: previousEntry.plannedPercent ?? 0,
        actualPercent: previousEntry.actualPercent ?? 0,
        activities: previousEntry.activities || '',
        issues: previousEntry.issues || '',
        nextSteps: previousEntry.nextSteps || ''
      }));
      return;
    }

    setForm(prev => ({
      ...defaultFormState,
      projectId: prev.projectId,
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

            {isLoadingPrevious && (
              <div className={styles.psInfoBanner}>Loading previous entry…</div>
            )}

            {!isLoadingPrevious && (
              <>
                {previousEntry ? (
                  <>
                    <label className={styles.psToggleRow}>
                      <input
                        type="checkbox"
                        checked={copyPreviousData}
                        onChange={e => onToggleCopyPreviousData(e.target.checked)}
                        disabled={isSaving}
                      />
                      <span>Copy data from latest entry</span>
                    </label>

                    <div className={styles.psCompareGrid}>
                      <div className={styles.psCompareCard}>
                        <h4>Previous entry</h4>
                        <div className={styles.psCompareMeta}>
                          {new Date(previousEntry.created).toLocaleDateString()} by{' '}
                          {previousEntry.createdBy}
                        </div>
                        <p>
                          <strong>Health:</strong> {previousEntry.health}
                        </p>
                        <p>
                          <strong>Planned / Actual:</strong> {previousEntry.plannedPercent ?? 0}% /{' '}
                          {previousEntry.actualPercent ?? 0}%
                        </p>
                        <p>
                          <strong>Activities:</strong> {previousEntry.activities || 'N/A'}
                        </p>
                        <p>
                          <strong>Issues:</strong> {previousEntry.issues || 'N/A'}
                        </p>
                        <p>
                          <strong>Next steps:</strong> {previousEntry.nextSteps || 'N/A'}
                        </p>
                      </div>

                      <div className={styles.psCompareCard}>
                        <h4>New entry</h4>
                        <div className={styles.psCompareMeta}>
                          Current draft values you are about to submit.
                        </div>
                        <p>
                          <strong>Health:</strong> {form.health}
                        </p>
                        <p>
                          <strong>Planned / Actual:</strong> {form.plannedPercent}% / {form.actualPercent}%
                        </p>
                        <p>
                          <strong>Activities:</strong> {form.activities || 'N/A'}
                        </p>
                        <p>
                          <strong>Issues:</strong> {form.issues || 'N/A'}
                        </p>
                        <p>
                          <strong>Next steps:</strong> {form.nextSteps || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.psInfoBanner}>
                    No previous updates found for this project. Start a fresh status entry.
                  </div>
                )}
              </>
            )}

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

import * as React from 'react';
import { ProjectStatusService } from '../services/ProjectStatusService';
import styles from './ProjectStatus.module.scss';


interface IUpdatePageProps {
  service: ProjectStatusService;
  projectsLookup: { id: number; title: string }[];
  isLoadingProjects: boolean;
  onCreated: () => void;
}

const healthPillClassMap: Record<'Green' | 'Yellow' | 'Red', string> = {
  Green: styles.psHealthPillGreen,
  Yellow: styles.psHealthPillYellow,
  Red: styles.psHealthPillRed
};


export const UpdatePage: React.FC<IUpdatePageProps> = ({
  service,
  projectsLookup,
  isLoadingProjects,
  onCreated
}) => {
  const [projectId, setProjectId] = React.useState<number | undefined>();
  const [health, setHealth] = React.useState<'Green' | 'Yellow' | 'Red'>('Green');
  const [plannedPercent, setPlannedPercent] = React.useState<number>(0);
  const [actualPercent, setActualPercent] = React.useState<number>(0);
  const [activities, setActivities] = React.useState<string>('');
  const [issues, setIssues] = React.useState<string>('');
  const [nextSteps, setNextSteps] = React.useState<string>('');

  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const [success, setSuccess] = React.useState<string | undefined>();

  const onSave = async () => {
    setError(undefined);
    setSuccess(undefined);

    if (!projectId) {
      setError('Please choose a project before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await service.createStatus({
        projectId,
        health,
        plannedPercent,
        actualPercent,
        activities,
        issues,
        nextSteps
      });

      setIsSaving(false);
      setSuccess('Status update posted 🎉');

      // reset form
      setPlannedPercent(0);
      setActualPercent(0);
      setActivities('');
      setIssues('');
      setNextSteps('');
      setProjectId(undefined);
      setHealth('Green');

      await onCreated();
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Error saving status update.');
    }
  };

  const selectedProject =
    projectId && projectsLookup.find(p => p.id === projectId)?.title;

  return (
    <div className={styles.psUpdatePage}>
      {/* “Social” style header */}
      <div className={styles.psSectionHeader}>
        <h2>Share a status update</h2>
        <span className={styles.psSectionTag}>New post</span>
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

      <div className={styles.psFormShell}>
        {/* Left: main editor */}
        <div className={styles.psFormMain}>
          {/* “composer” header showing context */}
          <div className={styles.psComposerHeader}>
            <div className={styles.psComposerAvatar}>
              {/* fake initials circle */}
              <span>DF</span>
            </div>
            <div className={styles.psComposerMeta}>
              <span className={styles.psComposerName}>
                Project status update
              </span>
              <span className={styles.psComposerProject}>
                {selectedProject
                  ? selectedProject
                  : isLoadingProjects
                  ? 'Loading projects…'
                  : 'No project selected yet'}
              </span>
            </div>
          </div>

          {/* Activities textarea */}
          <div className={styles.psField}>
            <label className={styles.psFieldLabel}>What’s been happening?</label>
            <textarea
              className={styles.psTextArea}
              placeholder="Summarise key activities, milestones, workshops…"
              rows={3}
              value={activities}
              onChange={e => setActivities(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Issues / risks */}
          <div className={styles.psField}>
            <label className={styles.psFieldLabel}>Any issues or risks?</label>
            <textarea
              className={styles.psTextArea}
              placeholder="Highlight blockers, risks or decisions needed…"
              rows={3}
              value={issues}
              onChange={e => setIssues(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Next steps */}
          <div className={styles.psField}>
            <label className={styles.psFieldLabel}>What’s next?</label>
            <textarea
              className={styles.psTextArea}
              placeholder="Outline next actions, owners and timelines…"
              rows={3}
              value={nextSteps}
              onChange={e => setNextSteps(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Right: meta panel */}
        <div className={styles.psFormSide}>
          {/* Project select */}
          <div className={styles.psField}>
            <label className={styles.psFieldLabel}>Project</label>
            <div className={styles.psSelectWrapper}>
              <select
                className={styles.psSelect}
                value={projectId ?? ''}
                onChange={e =>
                  setProjectId(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                disabled={isSaving || isLoadingProjects}
              >
                <option value="">
                  {isLoadingProjects ? 'Loading projects…' : 'Choose a project…'}
                </option>
                {projectsLookup.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Health pills */}
          <div className={styles.psField}>
            <label className={styles.psFieldLabel}>Health</label>
            <div className={styles.psHealthPills}>
              {(['Green', 'Yellow', 'Red'] as const).map(h => (
                <button
                  key={h}
                  type="button"
                  className={
  health === h
    ? `${styles.psHealthPill} ${styles.psHealthPillActive} ${healthPillClassMap[h]}`
    : `${styles.psHealthPill} ${healthPillClassMap[h]}`
}

                  onClick={() => setHealth(h)}
                  disabled={isSaving}
                >
                  <span className={styles.psHealthDot} />
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className={styles.psFieldGroup}>
            <div className={styles.psField}>
              <div className={styles.psFieldRow}>
                <label className={styles.psFieldLabel}>Planned %</label>
                <span className={styles.psFieldValue}>{plannedPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={plannedPercent}
                onChange={e => setPlannedPercent(Number(e.target.value))}
                className={styles.psSlider}
                disabled={isSaving}
              />
            </div>

            <div className={styles.psField}>
              <div className={styles.psFieldRow}>
                <label className={styles.psFieldLabel}>Actual %</label>
                <span className={styles.psFieldValue}>{actualPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={actualPercent}
                onChange={e => setActualPercent(Number(e.target.value))}
                className={`${styles.psSlider} ${styles.psSliderAccent}`}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* CTA */}
          <div className={styles.psFormActions}>
            <button
              type="button"
              className={styles.psPrimaryButton}
              onClick={onSave}
              disabled={isSaving || !projectId}
            >
              {isSaving ? 'Posting…' : 'Post update'}
            </button>
            <div className={styles.psFormHint}>
              Updates will appear instantly on the dashboard feed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import * as React from 'react';
import { IProjectStatusItem } from '../IProjectStatusItem';
import styles from '../ProjectStatus.module.scss';

interface IPreviousEntryPanelProps {
  isLoading: boolean;
  isSaving: boolean;
  copyPreviousData: boolean;
  previousEntry?: IProjectStatusItem;
  onToggleCopyPreviousData: (checked: boolean) => void;
}

export const PreviousEntryPanel: React.FC<IPreviousEntryPanelProps> = ({
  isLoading,
  isSaving,
  copyPreviousData,
  previousEntry,
  onToggleCopyPreviousData
}) => {
  if (isLoading) {
    return <div className={styles.psInfoBanner}>Loading previous entry…</div>;
  }

  if (!previousEntry) {
    return (
      <div className={styles.psInfoBanner}>
        No previous updates found for this project. Start a fresh status entry.
      </div>
    );
  }

  return (
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
      </div>
    </>
  );
};

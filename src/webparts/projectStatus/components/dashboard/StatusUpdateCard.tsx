import * as React from 'react';
import { IProjectStatusItem } from '../IProjectStatusItem';
import styles from '../ProjectStatus.module.scss';

interface IStatusUpdateCardProps {
  item: IProjectStatusItem;
}

const getHealthBadgeClass = (health: string): string => {
  if (health === 'Green') {
    return styles.psHealthGreenBadge;
  }

  if (health === 'Yellow') {
    return styles.psHealthYellowBadge;
  }

  if (health === 'Red') {
    return styles.psHealthRedBadge;
  }

  return '';
};

export const StatusUpdateCard: React.FC<IStatusUpdateCardProps> = ({ item }) => (
  <article className={styles.psFeedCard}>
    <header className={styles.psFeedHeader}>
      <div className={styles.psFeedHeaderText}>
        <div className={styles.psFeedProject}>{item.projectTitle || 'Unknown project'}</div>
        <div className={styles.psFeedMeta}>
          <span>{new Date(item.created).toLocaleDateString()}</span>
          <span className={styles.psFeedDot}>|</span>
          <span>{item.createdBy}</span>
        </div>
      </div>
      <div className={`${styles.psHealthBadge} ${getHealthBadgeClass(item.health)}`}>
        {item.health}
      </div>
    </header>

    <div className={styles.psFeedProgressRow}>
      <div className={styles.psFeedStat}>
        <span className={styles.psFeedStatLabel}>Planned</span>
        <span className={styles.psFeedStatValue}>{item.plannedPercent ?? 0}%</span>
      </div>
      <div className={styles.psFeedStat}>
        <span className={styles.psFeedStatLabel}>Actual</span>
        <span className={styles.psFeedStatValue}>{item.actualPercent ?? 0}%</span>
      </div>
    </div>

    <div className={styles.psCardProgressBar}>
      <div
        className={`${styles.psCardProgressFill} ${styles.psCardProgressPlanned}`}
        style={{ width: `${item.plannedPercent || 0}%` }}
      />
      <div
        className={`${styles.psCardProgressFill} ${styles.psCardProgressActual} ${styles.psCardProgressOverlay}`}
        style={{ width: `${item.actualPercent || 0}%` }}
      />
    </div>

    {item.activities && (
      <div className={styles.psFeedSection}>
        <span className={styles.psFeedSectionLabel}>Activities</span>
        <p>{item.activities}</p>
      </div>
    )}

    {item.issues && (
      <div className={styles.psFeedSection}>
        <span className={styles.psFeedSectionLabel}>Issues</span>
        <p>{item.issues}</p>
      </div>
    )}

    {item.nextSteps && (
      <div className={styles.psFeedSection}>
        <span className={styles.psFeedSectionLabel}>Next steps</span>
        <p>{item.nextSteps}</p>
      </div>
    )}
  </article>
);

import * as React from 'react';
import styles from './ProjectStatus.module.scss';
import { IProjectStatusItem } from './IProjectStatusItem';

interface IProjectsPageProps {
  projects: { id: number; title: string }[];
  items: IProjectStatusItem[];
  isLoading: boolean;
}

const getHealthBadgeClass = (health?: string): string => {
  if (health === 'Green') return styles.psHealthGreenBadge;
  if (health === 'Yellow') return styles.psHealthYellowBadge;
  if (health === 'Red') return styles.psHealthRedBadge;
  return '';
};

export const ProjectsPage: React.FC<IProjectsPageProps> = ({
  projects,
  items,
  isLoading
}) => {
  const latestByProject = new Map<number, IProjectStatusItem>();

  items.forEach(item => {
    if (item.projectId && !latestByProject.has(item.projectId)) {
      latestByProject.set(item.projectId, item);
    }
  });

  return (
    <div className={styles.psSection}>
      <div className={styles.psSectionHeader}>
        <h2>All projects</h2>
        <span className={styles.psSectionTag}>
          {isLoading ? 'Refreshing…' : `${projects.length} projects`}
        </span>
      </div>

      <div className={styles.psFeedGrid}>
        {projects.map(project => {
          const latest = latestByProject.get(project.id);

          return (
            <article key={project.id} className={styles.psFeedCard}>
              <header className={styles.psFeedHeader}>
                <div className={styles.psFeedHeaderText}>
                  <div className={styles.psFeedProject}>{project.title}</div>
                  <div className={styles.psFeedMeta}>
                    {latest ? (
                      <>
                        <span>Last update: {new Date(latest.created).toLocaleDateString()}</span>
                        <span className={styles.psFeedDot}>|</span>
                        <span>{latest.createdBy}</span>
                      </>
                    ) : (
                      <span>No updates yet</span>
                    )}
                  </div>
                </div>

                {latest && (
                  <div
                    className={`${styles.psHealthBadge} ${getHealthBadgeClass(latest.health)}`}
                  >
                    {latest.health}
                  </div>
                )}
              </header>

              {latest ? (
                <>
                  <div className={styles.psFeedProgressRow}>
                    <div className={styles.psFeedStat}>
                      <span className={styles.psFeedStatLabel}>Planned</span>
                      <span className={styles.psFeedStatValue}>{latest.plannedPercent ?? 0}%</span>
                    </div>
                    <div className={styles.psFeedStat}>
                      <span className={styles.psFeedStatLabel}>Actual</span>
                      <span className={styles.psFeedStatValue}>{latest.actualPercent ?? 0}%</span>
                    </div>
                  </div>

                  <div className={styles.psCardProgressBar}>
                    <div
                      className={`${styles.psCardProgressFill} ${styles.psCardProgressPlanned}`}
                      style={{ width: `${latest.plannedPercent || 0}%` }}
                    />
                    <div
                      className={`${styles.psCardProgressFill} ${styles.psCardProgressActual} ${styles.psCardProgressOverlay}`}
                      style={{ width: `${latest.actualPercent || 0}%` }}
                    />
                  </div>

                  {latest.activities && (
                    <div className={styles.psFeedSection}>
                      <span className={styles.psFeedSectionLabel}>Activities</span>
                      <p>{latest.activities}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.psInfoBanner}>
                  No status submitted yet for this project.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

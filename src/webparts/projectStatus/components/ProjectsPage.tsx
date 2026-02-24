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
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | undefined>();
  const latestByProject = new Map<number, IProjectStatusItem>();

  items.forEach(item => {
    if (item.projectId && !latestByProject.has(item.projectId)) {
      latestByProject.set(item.projectId, item);
    }
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedProjectUpdates = items.filter(i => i.projectId === selectedProjectId);

  return (
    <div className={styles.psSection}>
      <div className={styles.psSectionHeader}>
        <h2>All projects</h2>
        <span className={styles.psSectionTag}>
          {isLoading ? 'Refreshing…' : `${projects.length} projects`}
        </span>
      </div>

      <div className={styles.psProjectsGrid}>
        {projects.map(project => {
          const latest = latestByProject.get(project.id);

          return (
            <button
              key={project.id}
              type="button"
              className={styles.psProjectCardButton}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <article className={styles.psFeedCard}>
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
            </button>
          );
        })}
      </div>

      {selectedProject && (
        <div
          className={styles.psModalOverlay}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedProjectId(undefined)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              setSelectedProjectId(undefined);
            }
          }}
        >
          <div
            className={styles.psModal}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedProject.title} details`}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.psModalHeader}>
              <h3>{selectedProject.title}</h3>
              <button
                type="button"
                className={styles.psSecondaryButton}
                onClick={() => setSelectedProjectId(undefined)}
              >
                Close
              </button>
            </div>

            {selectedProjectUpdates.length === 0 ? (
              <div className={styles.psInfoBanner}>
                No status updates submitted for this project yet.
              </div>
            ) : (
              <div className={styles.psModalContent}>
                {selectedProjectUpdates.map(update => (
                  <div key={update.id} className={styles.psCompareCard}>
                    <div className={styles.psCompareMeta}>
                      {new Date(update.created).toLocaleDateString()} by {update.createdBy}
                    </div>
                    <p>
                      <strong>Health:</strong> {update.health}
                    </p>
                    <p>
                      <strong>Planned / Actual:</strong> {update.plannedPercent ?? 0}% /{' '}
                      {update.actualPercent ?? 0}%
                    </p>
                    <p>
                      <strong>Activities:</strong> {update.activities || 'N/A'}
                    </p>
                    <p>
                      <strong>Issues:</strong> {update.issues || 'N/A'}
                    </p>
                    <p>
                      <strong>Next steps:</strong> {update.nextSteps || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

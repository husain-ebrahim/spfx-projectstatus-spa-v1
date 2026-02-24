import * as React from 'react';
import { IProjectStatusItem } from './IProjectStatusItem';
import { Label } from '@fluentui/react';
import styles from './ProjectStatus.module.scss';
import { IProjectManagerAllocation } from '../services/ProjectStatusService';

interface IDashboardPageProps {
  items: IProjectStatusItem[];
  isLoading: boolean;
  projectManagerAllocations: IProjectManagerAllocation[];
}

export const DashboardPage: React.FC<IDashboardPageProps> = ({
  items,
  isLoading,
  projectManagerAllocations
}) => {
  const totalUpdates = items.length;

  const healthCounts = items.reduce(
    (acc, it) => {
      const h = (it.health || '').toLowerCase();
      if (h === 'green') acc.green++;
      else if (h === 'yellow') acc.yellow++;
      else if (h === 'red') acc.red++;
      else acc.other++;
      return acc;
    },
    { green: 0, yellow: 0, red: 0, other: 0 }
  );

  const avg = (arr: number[]): number =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const plannedAvg = avg(items.map(i => i.plannedPercent || 0));
  const actualAvg = avg(items.map(i => i.actualPercent || 0));
  const variance = actualAvg - plannedAvg;

  const uniqueProjects = Array.from(
    new Set(items.filter(i => i.projectId).map(i => i.projectId))
  ).length;

  const latestItems = items.slice(0, 8);
  const projectsWithIssues = new Set(
    items.filter(i => i.issues && i.issues.trim().length > 0).map(i => i.projectId)
  ).size;
  const healthRatioTotal =
    healthCounts.green + healthCounts.yellow + healthCounts.red || 1;
  const healthWidth = (count: number) =>
    `${Math.round((count / healthRatioTotal) * 100)}%`;
  const pmCount = projectManagerAllocations.length;
  const totalPmProjects = projectManagerAllocations.reduce(
    (sum, pm) => sum + pm.projectCount,
    0
  );
  const avgProjectsPerPm =
    pmCount > 0 ? (totalPmProjects / pmCount).toFixed(1) : '0.0';
  const maxAllocation = projectManagerAllocations[0];
  const topAllocations = projectManagerAllocations.slice(0, 5);
  const topAllocationCount = topAllocations[0]?.projectCount || 1;

  return (
    <div className={styles.psDashboard}>
      {/* KPI row */}
      <div className={styles.psKpiRow}>
        <div className={styles.psKpiCard}>
          <span className={styles.psKpiLabel}>Projects tracked</span>
          <span className={styles.psKpiValue}>{uniqueProjects}</span>
          <span className={styles.psKpiHint}>Distinct projects with at least one update</span>
        </div>

        <div className={styles.psKpiCard}>
          <span className={styles.psKpiLabel}>Total updates</span>
          <span className={styles.psKpiValue}>{totalUpdates}</span>
          <span className={styles.psKpiHint}>All posts in Projects Status</span>
        </div>

        <div className={styles.psKpiCard}>
          <span className={styles.psKpiLabel}>Delivery trend</span>
          <span className={styles.psKpiValue}>
            {plannedAvg}% / {actualAvg}%
          </span>
          <span
            className={
              variance >= 0 ? styles.psKpiDeltaPositive : styles.psKpiDeltaNegative
            }
          >
            {variance >= 0 ? '+' : ''}
            {variance} pts vs plan
          </span>
        </div>

        <div className={styles.psKpiCard}>
          <span className={styles.psKpiLabel}>Projects with open issues</span>
          <span className={styles.psKpiValue}>{projectsWithIssues}</span>
          <span className={styles.psKpiHint}>Projects where risks/blockers were reported</span>
        </div>

        <div className={styles.psKpiCard}>
          <span className={styles.psKpiLabel}>Resource allocation (PM)</span>
          <span className={styles.psKpiValue}>{avgProjectsPerPm}</span>
          <span className={styles.psKpiHint}>
            Avg projects per PM across {pmCount} PMs
          </span>
          <div className={styles.psAllocationChart}>
            {topAllocations.length > 0 ? (
              topAllocations.map(pm => (
                <div key={pm.managerName} className={styles.psAllocationRow}>
                  <span className={styles.psAllocationName}>{pm.managerName}</span>
                  <div className={styles.psAllocationBarTrack}>
                    <div
                      className={styles.psAllocationBarFill}
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round((pm.projectCount / topAllocationCount) * 100)
                        )}%`
                      }}
                    />
                  </div>
                  <span className={styles.psAllocationCount}>{pm.projectCount}</span>
                </div>
              ))
            ) : (
              <span className={styles.psAllocationEmpty}>No PM allocation data</span>
            )}
          </div>
          {maxAllocation && (
            <span className={styles.psKpiHint}>
              Highest allocation: {maxAllocation.managerName} ({maxAllocation.projectCount})
            </span>
          )}
        </div>
      </div>

      {/* Health strip */}
      <div className={styles.psHealthStrip}>
        <Label>Portfolio health distribution</Label>
        <div className={styles.psHealthStripBar}>
          <div
            className={`${styles.psHealthSegment} ${styles.psHealthGreen}`}
            style={{ width: healthWidth(healthCounts.green) }}
          />
          <div
            className={`${styles.psHealthSegment} ${styles.psHealthYellow}`}
            style={{ width: healthWidth(healthCounts.yellow) }}
          />
          <div
            className={`${styles.psHealthSegment} ${styles.psHealthRed}`}
            style={{ width: healthWidth(healthCounts.red) }}
          />
        </div>
      </div>

      <div className={styles.psSection}>
        <div className={styles.psSectionHeader}>
          <h2>Latest updates</h2>
          <span className={styles.psSectionTag}>
            {isLoading ? 'Refreshing…' : `${latestItems.length} recent records`}
          </span>
        </div>

        {latestItems.length === 0 && (
          <Label>No status updates yet. Use “Add update” to create the first entry.</Label>
        )}

        <div className={styles.psFeedGrid}>
          {latestItems.map(i => (
            <article key={i.id} className={styles.psFeedCard}>
              <header className={styles.psFeedHeader}>
                <div className={styles.psFeedHeaderText}>
                  <div className={styles.psFeedProject}>{i.projectTitle || 'Unknown project'}</div>
                  <div className={styles.psFeedMeta}>
                    <span>{new Date(i.created).toLocaleDateString()}</span>
                    <span className={styles.psFeedDot}>|</span>
                    <span>{i.createdBy}</span>
                  </div>
                </div>
                <div
                  className={`${styles.psHealthBadge} ${
                    i.health === 'Green'
                      ? styles.psHealthGreenBadge
                      : i.health === 'Yellow'
                      ? styles.psHealthYellowBadge
                      : i.health === 'Red'
                      ? styles.psHealthRedBadge
                      : ''
                  }`}
                >
                  {i.health}
                </div>
              </header>

              <div className={styles.psFeedProgressRow}>
                <div className={styles.psFeedStat}>
                  <span className={styles.psFeedStatLabel}>Planned</span>
                  <span className={styles.psFeedStatValue}>
                    {i.plannedPercent ?? 0}%
                  </span>
                </div>
                <div className={styles.psFeedStat}>
                  <span className={styles.psFeedStatLabel}>Actual</span>
                  <span className={styles.psFeedStatValue}>
                    {i.actualPercent ?? 0}%
                  </span>
                </div>
              </div>
              <div className={styles.psCardProgressBar}>
                <div
                  className={`${styles.psCardProgressFill} ${styles.psCardProgressPlanned}`}
                  style={{ width: `${i.plannedPercent || 0}%` }}
                />
                <div
                  className={`${styles.psCardProgressFill} ${styles.psCardProgressActual} ${styles.psCardProgressOverlay}`}
                  style={{ width: `${i.actualPercent || 0}%` }}
                />
              </div>

              {i.activities && (
                <div className={styles.psFeedSection}>
                  <span className={styles.psFeedSectionLabel}>Activities</span>
                  <p>{i.activities}</p>
                </div>
              )}

              {i.issues && (
                <div className={styles.psFeedSection}>
                  <span className={styles.psFeedSectionLabel}>Issues</span>
                  <p>{i.issues}</p>
                </div>
              )}

              {i.nextSteps && (
                <div className={styles.psFeedSection}>
                  <span className={styles.psFeedSectionLabel}>Next steps</span>
                  <p>{i.nextSteps}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

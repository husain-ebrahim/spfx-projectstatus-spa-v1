import * as React from 'react';
import { Label } from '@fluentui/react';
import { IProjectStatusItem } from './IProjectStatusItem';
import { IProjectManagerAllocation } from '../services/ProjectStatusService';
import { KpiCard } from './dashboard/KpiCard';
import { AllocationKpiCard } from './dashboard/AllocationKpiCard';
import { StatusUpdateCard } from './dashboard/StatusUpdateCard';
import styles from './ProjectStatus.module.scss';

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

  const healthWidth = (count: number): string =>
    `${Math.round((count / healthRatioTotal) * 100)}%`;

  return (
    <div className={styles.psDashboard}>
      <div className={styles.psKpiRow}>
        <div className={styles.psKpiStack}>
          <KpiCard
            label="Projects tracked"
            value={uniqueProjects}
            hint="Distinct projects with at least one update"
          />
          <KpiCard label="Total updates" value={totalUpdates} hint="All posts in Projects Status" />
          <KpiCard
            label="Delivery trend"
            value={`${plannedAvg}% / ${actualAvg}%`}
            delta={`${variance >= 0 ? '+' : ''}${variance} pts vs plan`}
            deltaPositive={variance >= 0}
          />
          <KpiCard
            label="Projects with open issues"
            value={projectsWithIssues}
            hint="Projects where risks/blockers were reported"
          />
        </div>

        <AllocationKpiCard allocations={projectManagerAllocations} />
      </div>

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
          {latestItems.map(item => (
            <StatusUpdateCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

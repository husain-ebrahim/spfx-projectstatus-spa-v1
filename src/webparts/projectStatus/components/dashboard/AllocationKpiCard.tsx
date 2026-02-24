import * as React from 'react';
import styles from '../ProjectStatus.module.scss';
import { IProjectManagerAllocation } from '../../services/ProjectStatusService';

interface IAllocationKpiCardProps {
  allocations: IProjectManagerAllocation[];
}

export const AllocationKpiCard: React.FC<IAllocationKpiCardProps> = ({
  allocations
}) => {
  const pmCount = allocations.length;
  const totalPmProjects = allocations.reduce((sum, pm) => sum + pm.projectCount, 0);
  const avgProjectsPerPm = pmCount > 0 ? (totalPmProjects / pmCount).toFixed(1) : '0.0';
  const maxAllocation = allocations[0];
  const topAllocations = allocations.slice(0, 5);
  const topAllocationCount = topAllocations[0]?.projectCount || 1;

  return (
    <div className={`${styles.psKpiCard} ${styles.psKpiCardLarge}`}>
      <span className={styles.psKpiLabel}>Resource allocation (PM)</span>
      <span className={styles.psKpiValue}>{avgProjectsPerPm}</span>
      <span className={styles.psKpiHint}>Avg projects per PM across {pmCount} PMs</span>
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
  );
};

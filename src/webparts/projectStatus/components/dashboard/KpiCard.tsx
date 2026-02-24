import * as React from 'react';
import styles from '../ProjectStatus.module.scss';

interface IKpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  deltaPositive?: boolean;
}

export const KpiCard: React.FC<IKpiCardProps> = ({
  label,
  value,
  hint,
  delta,
  deltaPositive
}) => (
  <div className={styles.psKpiCard}>
    <span className={styles.psKpiLabel}>{label}</span>
    <span className={styles.psKpiValue}>{value}</span>
    {hint && <span className={styles.psKpiHint}>{hint}</span>}
    {delta && (
      <span
        className={
          deltaPositive ? styles.psKpiDeltaPositive : styles.psKpiDeltaNegative
        }
      >
        {delta}
      </span>
    )}
  </div>
);

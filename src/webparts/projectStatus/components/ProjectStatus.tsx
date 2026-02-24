import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusState, PageKey } from './IProjectStatusState';
import { ProjectStatusService } from '../services/ProjectStatusService';
import { IProjectStatusItem } from './IProjectStatusItem';

import {
  Icon,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  DefaultButton
} from '@fluentui/react';

import { DashboardPage } from './DashBoardPage';
import { UpdatePage } from './UpdatePage';

import styles from './ProjectStatus.module.scss';

export const ProjectStatus: React.FC<IProjectStatusProps> = ({ context }) => {
  const service = useMemo(() => new ProjectStatusService(context), [context]);

  const [state, setState] = useState<IProjectStatusState>({
    items: [],
    isLoading: true,
    error: undefined,
    projectsLookup: [],
    isLoadingProjects: true,
    currentPage: 'dashboard'
  });

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));
      const [statuses, projects] = await Promise.all([
        service.getStatuses(),
        service.getProjectsLookup()
      ]);

      setState(prev => ({
        ...prev,
        items: statuses,
        projectsLookup: projects,
        isLoading: false,
        isLoadingProjects: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingProjects: false,
        error: err.message || 'Error loading data'
      }));
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPageChange = (page: PageKey) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const onStatusCreated = async () => {
    try {
      const statuses = await service.getStatuses();
      setState(prev => ({
        ...prev,
        items: statuses,
        currentPage: 'dashboard'
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Error refreshing data after save'
      }));
    }
  };

  const { items, isLoading, error, projectsLookup, isLoadingProjects, currentPage } =
    state;

  const isDashboard = currentPage === 'dashboard';

  return (
    <div className={styles.appRoot}>
      <div className={styles.appShell}>
        {/* SIDE NAVIGATION */}
        <aside className={styles.sideNav}>
          <div className={styles.sideNavHeader}>
            <div className={styles.sideNavBrandMark}>DF</div>
            <div className={styles.sideNavBrandText}>
              <span className={styles.sideNavBrandTitle}>Digital Factory</span>
              <span className={styles.sideNavBrandSubtitle}>Projects Status</span>
            </div>
          </div>

          <nav className={styles.sideNavNav}>
            <button
              className={
                currentPage === 'dashboard'
                  ? `${styles.sideNavItem} ${styles.sideNavItemActive}`
                  : styles.sideNavItem
              }
              onClick={() => onPageChange('dashboard')}
              type="button"
            >
              <Icon iconName="LineChart" className={styles.sideNavItemIcon} />
              <span className={styles.sideNavItemLabel}>Dashboard</span>
            </button>

            <button
              className={
                currentPage === 'addUpdate'
                  ? `${styles.sideNavItem} ${styles.sideNavItemActive}`
                  : styles.sideNavItem
              }
              onClick={() => onPageChange('addUpdate')}
              type="button"
            >
              <Icon iconName="Add" className={styles.sideNavItemIcon} />
              <span className={styles.sideNavItemLabel}>Add update</span>
            </button>
          </nav>

          <div className={styles.sideNavFooter}>
            <span className={styles.sideNavEnvLabel}>Site:</span>
            <span className={styles.sideNavEnvValue}>Projects Status</span>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className={styles.appMain}>
          <header className={styles.appMainHeader}>
            <div>
              <h1 className={styles.appMainTitle}>
                {isDashboard ? 'Portfolio dashboard' : 'Add status update'}
              </h1>
              <p className={styles.appMainSubtitle}>
                {isDashboard
                  ? 'Overview of project health, KPIs and the latest status entries.'
                  : 'Capture a new status update for a project in the Digital Factory portfolio.'}
              </p>
            </div>

            <div className={styles.appMainToolbar}>
              <span className={styles.appMainMeta}>
                Last refresh: {new Date().toLocaleTimeString()}
              </span>
              <DefaultButton
                onClick={loadData}
                iconProps={{ iconName: 'Refresh' }}
                text="Refresh"
              />
            </div>
          </header>

          {error && (
            <div className={styles.psMessageBar}>
              <MessageBar
                messageBarType={MessageBarType.error}
                onDismiss={() =>
                  setState(prev => ({
                    ...prev,
                    error: undefined
                  }))
                }
              >
                {error}
              </MessageBar>
            </div>
          )}

          <section className={styles.appMainContent}>
            {isLoading && items.length === 0 ? (
              <div className={styles.appMainLoading}>
                <Spinner label="Loading project status…" size={SpinnerSize.large} />
              </div>
            ) : (
              <>
                {currentPage === 'dashboard' && (
                  <DashboardPage items={items} isLoading={isLoading} />
                )}

                {currentPage === 'addUpdate' && (
                  <UpdatePage
                    service={service}
                    projectsLookup={projectsLookup}
                    isLoadingProjects={isLoadingProjects}
                    onCreated={onStatusCreated}
                  />
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

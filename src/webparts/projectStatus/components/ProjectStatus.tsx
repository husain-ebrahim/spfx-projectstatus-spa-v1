import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IProjectStatusProps } from './IProjectStatusProps';
import { PageKey } from './IProjectStatusState';
import {
  IProjectManagerAllocation,
  ProjectStatusService
} from '../services/ProjectStatusService';
import { IProjectStatusItem } from './IProjectStatusItem';

import {
  Icon,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize
} from '@fluentui/react';

import { DashboardPage } from './DashBoardPage';
import { UpdatePage } from './UpdatePage';
import { ProjectsPage } from './ProjectsPage';
import Logo from '../assets/Symbol-Color.png';

import styles from './ProjectStatus.module.scss';

interface IProjectLookup {
  id: number;
  title: string;
}

export const ProjectStatus: React.FC<IProjectStatusProps> = ({ context }) => {
  const service = useMemo(() => new ProjectStatusService(context), [context]);

  const [items, setItems] = useState<IProjectStatusItem[]>([]);
  const [projectsLookup, setProjectsLookup] = useState<IProjectLookup[]>([]);
  const [allProjectsLookup, setAllProjectsLookup] = useState<IProjectLookup[]>([]);
  const [projectManagerAllocations, setProjectManagerAllocations] = useState<
    IProjectManagerAllocation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState<string>();
  const [currentPage, setCurrentPage] = useState<PageKey>('addUpdate');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const [statuses, projects, allProjects, pmAllocations] = await Promise.all([
        service.getStatuses(),
        service.getProjectsLookup(),
        service.getAllProjectsLookup(),
        service.getProjectManagerAllocations()
      ]);

      setItems(statuses);
      setProjectsLookup(projects);
      setAllProjectsLookup(allProjects);
      setProjectManagerAllocations(pmAllocations);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    } finally {
      setIsLoading(false);
      setIsLoadingProjects(false);
    }
  }, [service]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onStatusCreated = async () => {
    try {
      const statuses = await service.getStatuses();
      setItems(statuses);
      setCurrentPage('dashboard');
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Error refreshing data after save');
    }
  };

  const isDashboard = currentPage === 'dashboard';
  const isAddUpdate = currentPage === 'addUpdate';
  const isProjects = currentPage === 'projects';
  const navigationItems: { key: PageKey; icon: string; label: string }[] = [
    { key: 'addUpdate', icon: 'Add', label: 'Add update' },
    { key: 'dashboard', icon: 'LineChart', label: 'Dashboard' },
    { key: 'projects', icon: 'BulletedList', label: 'All projects' }
  ];

  return (
    <div className={styles.appRoot}>
      {/* <div className={styles.appShell}> */}
        <div>
        {/* SIDE NAVIGATION */}
        {/* <aside className={styles.sideNav}>
          <div className={styles.sideNavHeader}>
            <img src={Logo} alt="Bapco energies" className={styles.sideNavBrandMark} />
            <div className={styles.sideNavBrandText}>
              <span className={styles.sideNavBrandTitle}>Digital Factory</span>
              <span className={styles.sideNavBrandSubtitle}>Projects Status</span>
            </div>
          </div>

          <nav className={styles.sideNavNav}>
            {navigationItems.map(item => (
              <button
                key={item.key}
                className={
                  currentPage === item.key
                    ? `${styles.sideNavItem} ${styles.sideNavItemActive} ${
                        item.key === 'addUpdate' ? styles.sideNavItemPrimaryActive : ''
                      }`
                    : `${styles.sideNavItem} ${
                        item.key === 'addUpdate' ? styles.sideNavItemPrimary : ''
                      }`
                }
                onClick={() => setCurrentPage(item.key)}
                type="button"
              >
                <Icon iconName={item.icon} className={styles.sideNavItemIcon} />
                <span className={styles.sideNavItemLabel}>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className={styles.sideNavFooter}>
            <span className={styles.sideNavEnvLabel}>Site:</span>
            <span className={styles.sideNavEnvValue}>Projects Status</span>
          </div>
        </aside> */}

        {/* MAIN AREA */}
        <main className={styles.appMain}>
          <header className={styles.appMainHeader}>
            <div>
              <h1 className={styles.appMainTitle}>
                {isAddUpdate
                  ? 'Add status update'
                  : isDashboard
                  ? 'Portfolio dashboard'
                  : 'Projects directory'}
              </h1>
              <p className={styles.appMainSubtitle}>
                {isAddUpdate
                  ? 'Capture a new status update for a project in the Digital Factory portfolio.'
                  : isDashboard
                  ? 'Overview of project health, KPIs and the latest status entries.'
                  : 'Browse all projects and review their latest submitted status.'}
              </p>
            </div>

            <div className={styles.appMainToolbar}>
              <span className={styles.appMainMeta}>
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                type="button"
                className={styles.appRefreshButton}
                onClick={() => void loadData()}
              >
                <Icon iconName="Refresh" />
                <span>Refresh</span>
              </button>
            </div>
          </header>

          {error && (
            <div className={styles.psMessageBar}>
              <MessageBar
                messageBarType={MessageBarType.error}
                onDismiss={() => setError(undefined)}
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
                  <DashboardPage
                    items={items}
                    isLoading={isLoading}
                    projectManagerAllocations={projectManagerAllocations}
                  />
                )}

                {currentPage === 'addUpdate' && (
                  <UpdatePage
                    service={service}
                    projectsLookup={projectsLookup}
                    isLoadingProjects={isLoadingProjects}
                    onCreated={onStatusCreated}
                  />
                )}

                {isProjects && (
                  <ProjectsPage
                    projects={allProjectsLookup}
                    items={items}
                    isLoading={isLoading}
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

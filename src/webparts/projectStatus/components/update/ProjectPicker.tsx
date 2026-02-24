import * as React from 'react';
import styles from '../ProjectStatus.module.scss';

interface IProjectPickerProps {
  isLoadingProjects: boolean;
  projects: { id: number; title: string }[];
  isSaving: boolean;
  onProjectSelect: (projectId: number) => void;
}

export const ProjectPicker: React.FC<IProjectPickerProps> = ({
  isLoadingProjects,
  projects,
  isSaving,
  onProjectSelect
}) => (
  <div className={styles.psProjectPicker}>
    <div className={styles.psProjectPickerHeader}>
      <h3>Select a project</h3>
      <p>Choose one of your assigned projects to continue.</p>
    </div>

    {isLoadingProjects && (
      <div className={styles.psProjectPickerEmpty}>Loading projects…</div>
    )}

    {!isLoadingProjects && projects.length === 0 && (
      <div className={styles.psProjectPickerEmpty}>
        No projects are assigned to you as Project Manager.
      </div>
    )}

    {!isLoadingProjects && projects.length > 0 && (
      <div className={styles.psProjectList}>
        {projects.map(project => (
          <button
            key={project.id}
            type="button"
            className={styles.psProjectListItem}
            onClick={() => onProjectSelect(project.id)}
            disabled={isSaving}
          >
            <span className={styles.psProjectListTitle}>{project.title}</span>
            <span className={styles.psProjectListAction}>Select</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

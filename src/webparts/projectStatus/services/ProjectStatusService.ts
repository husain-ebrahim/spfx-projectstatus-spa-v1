import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IProjectStatusItem } from '../components/IProjectStatusItem';

export class ProjectStatusService {
  private readonly factorySiteUrl: string =
    'https://bapco365.sharepoint.com/sites/DigitalFactory';

  // List titles
  private readonly statusListTitle: string = 'Projects Status';
  private readonly projectsListTitle: string = 'Projects';
  private readonly projectManagerFieldTitle: string = 'Project Manager';
  private projectManagerInternalName?: string;

  constructor(private context: WebPartContext) {}

  private listUrl(listTitle: string): string {
    return `${this.factorySiteUrl}/_api/web/lists/getByTitle('${listTitle}')`;
  }

  /** Get currently logged in user's SharePoint ID */
  private async getCurrentUserId(): Promise<number> {
    const pageUserId = Number(this.context.pageContext.legacyPageContext?.userId);
    if (!isNaN(pageUserId) && pageUserId > 0) {
      return pageUserId;
    }

    const url = `${this.factorySiteUrl}/_api/web/currentuser?$select=Id`;
    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error getting current user ID: ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();
    return json.Id;
  }

  /** Resolve and cache internal name of the "Project Manager" field */
  private async getProjectManagerInternalName(): Promise<string> {
    if (this.projectManagerInternalName) {
      return this.projectManagerInternalName;
    }

    const url =
      `${this.listUrl(this.projectsListTitle)}/fields` +
      `?$select=Title,InternalName&$filter=Title eq '${this.projectManagerFieldTitle}'`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error resolving Project Manager field internal name: ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();
    const internalName = json.value?.[0]?.InternalName;

    if (!internalName) {
      throw new Error(
        `Could not find a "${this.projectManagerFieldTitle}" field in list "${this.projectsListTitle}".`
      );
    }

    this.projectManagerInternalName = internalName;
    return internalName;
  }

  /** Get status items from "Projects Status" */
  public async getStatuses(): Promise<IProjectStatusItem[]> {

    const url =
      `${this.listUrl(this.statusListTitle)}/items` +
      `?$select=` +
      [
        'Id',
        'Title',
        'Project/Id',
        'Project/Title',
        'Health',
        'Activities',
        'Issues',
        'Next',
        'Planned_x0025_',
        'Actual_x0025_',
        'Created',
        'Author/Title'
      ].join(',') +
      `&$expand=Project,Author` +
      `&$orderby=Created desc`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error getting statuses (site: ${this.factorySiteUrl}, list: ${this.statusListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();

    return (json.value || []).map((item: any): IProjectStatusItem => ({
      id: item.Id,
      projectId: item.Project?.Id,
      projectTitle: item.Project?.Title,
      health: item.Health,
      plannedPercent: item.Planned_x0025_,    
      actualPercent: item.Actual_x0025_,       
      activities: item.Activities,
      issues: item.Issues,
      nextSteps: item.Next,                    
      created: item.Created,
      createdBy: item.Author?.Title
    }));
  }

  /** Get lookup projects from "Projects" */
  public async getProjectsLookup(): Promise<{ id: number; title: string }[]> {
    const [currentUserId, projectManagerFieldInternalName] = await Promise.all([
      this.getCurrentUserId(),
      this.getProjectManagerInternalName()
    ]);

    const url =
      `${this.listUrl(this.projectsListTitle)}/items` +
      `?$select=Id,Title,${projectManagerFieldInternalName}/Id` +
      `&$expand=${projectManagerFieldInternalName}` +
      `&$filter=${projectManagerFieldInternalName}/Id eq ${currentUserId}` +
      `&$orderby=Title`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error getting projects (site: ${this.factorySiteUrl}, list: ${this.projectsListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();
    return (json.value || []).map((p: any) => ({
      id: p.Id,
      title: p.Title
    }));
  }

  /** Create a new status row in "Projects Status" */
  public async createStatus(item: {
    projectId: number;
    health: string;
    plannedPercent?: number;
    actualPercent?: number;
    activities: string;
    issues: string;
    nextSteps: string;
  }): Promise<void> {
    const url = `${this.listUrl(this.statusListTitle)}/items`;

    const body: any = {

      '__metadata': { 'type': 'SP.Data.Projects_x0020_StatusListItem' },

   
      Title: '',

      // Lookup to Projects list
      ProjectId: item.projectId,


      Health: item.health,
      Activities: item.activities,
      Issues: item.issues,
      Next: item.nextSteps,


      Planned_x0025_: item.plannedPercent,
      Actual_x0025_: item.actualPercent
    };

    const response = await this.context.spHttpClient.post(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          'Accept': 'application/json;odata=nometadata',
          'Content-type': 'application/json;odata=nometadata'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error creating status (site: ${this.factorySiteUrl}, list: ${this.statusListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }
  }
}

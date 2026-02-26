import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IProjectStatusItem } from '../components/IProjectStatusItem';

export interface IProjectManagerAllocation {
  managerName: string;
  projectCount: number;
}

export class ProjectStatusService {
  private readonly baseSiteUrl: string =
    'https://bapco365.sharepoint.com/sites/DigitalFactory';

  // List titles
  private readonly statusListTitle: string = 'Projects Status';
  private readonly projectsListTitle: string = 'Projects';
  private readonly projectManagerFieldTitle: string = 'Project Manager';
  private projectManagerInternalName?: string;
  private currentUserIdOnFactorySite?: number;

  constructor(private context: WebPartContext) {}

  private listUrl(listTitle: string): string {
    return `${this.baseSiteUrl}/_api/web/lists/getByTitle('${listTitle}')`;
  }

  /** Get currently logged in user's SharePoint ID */
  private async getCurrentUserId(): Promise<number> {
    if (this.currentUserIdOnFactorySite) {
      return this.currentUserIdOnFactorySite;
    }

    const loginName = this.context.pageContext.user.loginName;
    if (loginName) {
      const ensureUserUrl = `${this.baseSiteUrl}/_api/web/ensureuser`;
      const ensureUserResponse = await this.context.spHttpClient.post(
        ensureUserUrl,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-type': 'application/json;odata=nometadata'
          },
          body: JSON.stringify({ logonName: loginName })
        }
      );

      if (ensureUserResponse.ok) {
        const ensuredUser = await ensureUserResponse.json();
        if (ensuredUser?.Id) {
          this.currentUserIdOnFactorySite = ensuredUser.Id;
          return ensuredUser.Id;
        }
      }
    }

    const currentUserUrl = `${this.baseSiteUrl}/_api/web/currentuser?$select=Id`;
    const currentUserResponse: SPHttpClientResponse = await this.context.spHttpClient.get(
      currentUserUrl,
      SPHttpClient.configurations.v1
    );

    if (!currentUserResponse.ok) {
      const text = await currentUserResponse.text();
      throw new Error(
        `Error getting current user ID on DigitalFactory site: ${currentUserResponse.status} ${currentUserResponse.statusText} - ${text}`
      );
    }

    const currentUser = await currentUserResponse.json();
    this.currentUserIdOnFactorySite = currentUser.Id;
    return currentUser.Id;
  }

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

  /** Get status items from Projects Status */
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
        'Author/Title',
        'Modified'
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
        `Error getting statuses (site: ${this.baseSiteUrl}, list: ${this.statusListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();

    return (json.value || []).map(this.mapStatusItem);
  }

  /** Get latest status entry for one project */
  public async getLatestStatusByProject(projectId: number): Promise<IProjectStatusItem | undefined> {
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
      `&$filter=ProjectId eq ${projectId}` +
      `&$orderby=Created desc` +
      `&$top=1`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error getting latest status for project ${projectId}: ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();
    const latest = json.value?.[0];
    return latest ? this.mapStatusItem(latest) : undefined;
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
      `&$top=5000` +
      `&$orderby=Title`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error getting projects (site: ${this.baseSiteUrl}, list: ${this.projectsListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();
    return (json.value || [])
      .filter((project: any) => {
        const pm = project[projectManagerFieldInternalName];
        const pmIds: number[] = Array.isArray(pm)
          ? pm.map((u: any) => u?.Id).filter((id: number) => !!id)
          : pm?.Id
          ? [pm.Id]
          : [];

        return pmIds.indexOf(currentUserId) > -1;
      })
      .map((p: any) => ({
        id: p.Id,
        title: p.Title
      }));
  }

  /** Get all projects without PM filtering */
  public async getAllProjectsLookup(): Promise<{ id: number; title: string }[]> {
    const url =
      `${this.listUrl(this.projectsListTitle)}/items` +
      `?$select=Id,Title&$orderby=Title&$top=5000`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error getting all projects (site: ${this.baseSiteUrl}, list: ${this.projectsListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();
    return (json.value || []).map((p: any) => ({
      id: p.Id,
      title: p.Title
    }));
  }

  /** Get project count per Project Manager across all projects */
  public async getProjectManagerAllocations(): Promise<IProjectManagerAllocation[]> {
    const projectManagerFieldInternalName = await this.getProjectManagerInternalName();
    const url =
      `${this.listUrl(this.projectsListTitle)}/items` +
      `?$select=Id,${projectManagerFieldInternalName}/Title` +
      `&$expand=${projectManagerFieldInternalName}` +
      `&$top=5000`;

    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Error getting PM allocation (site: ${this.baseSiteUrl}, list: ${this.projectsListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }

    const json = await response.json();
    const projects = json.value || [];
    const counts = new Map<string, number>();

    projects.forEach((project: any) => {
      const manager = project[projectManagerFieldInternalName];
      const managerNames: string[] = Array.isArray(manager)
        ? manager.map((m: any) => m?.Title).filter(Boolean)
        : manager?.Title
        ? [manager.Title]
        : [];

      managerNames.forEach(name => {
        counts.set(name, (counts.get(name) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([managerName, projectCount]) => ({ managerName, projectCount }))
      .sort((a, b) => b.projectCount - a.projectCount);
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
        `Error creating status (site: ${this.baseSiteUrl}, list: ${this.statusListTitle}): ${response.status} ${response.statusText} - ${text}`
      );
    }
  }

  private mapStatusItem = (item: any): IProjectStatusItem => ({
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
  });
}

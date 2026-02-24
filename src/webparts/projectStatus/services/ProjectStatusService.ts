import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IProjectStatusItem } from '../components/IProjectStatusItem';

export class ProjectStatusService {
  // DigitalFactory site where the lists live
  private readonly factorySiteUrl: string =
    'https://bapco365.sharepoint.com/sites/DigitalFactory';

  // List titles
  private readonly statusListTitle: string = 'Projects Status';
  private readonly projectsListTitle: string = 'Projects';

  constructor(private context: WebPartContext) {}

  /** Build base URL for a list on the DigitalFactory site */
  private listUrl(listTitle: string): string {
    return `${this.factorySiteUrl}/_api/web/lists/getByTitle('${listTitle}')`;
  }

  /** Get status items from "Projects Status" */
  public async getStatuses(): Promise<IProjectStatusItem[]> {
    // NOTE: field names here are INTERNAL NAMES
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
      plannedPercent: item.Planned_x0025_,     // from Planned%
      actualPercent: item.Actual_x0025_,       // from Actual%
      activities: item.Activities,
      issues: item.Issues,
      nextSteps: item.Next,                    // from Next
      created: item.Created,
      createdBy: item.Author?.Title
    }));
  }

  /** Get lookup projects from "Projects" */
  public async getProjectsLookup(): Promise<{ id: number; title: string }[]> {
    const url =
      `${this.listUrl(this.projectsListTitle)}/items` +
      `?$select=Id,Title&$orderby=Title`;

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
      // ⚠ Make sure this matches the ListItemEntityTypeFullName of "Projects Status"
      '__metadata': { 'type': 'SP.Data.Projects_x0020_StatusListItem' },

      // Title – set something simple in case it's required
      Title: '',

      // Lookup to Projects list
      ProjectId: item.projectId,

      // Choice / number / text fields
      Health: item.health,
      Activities: item.activities,
      Issues: item.issues,
      Next: item.nextSteps,

      // Planned% and Actual% internal names
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

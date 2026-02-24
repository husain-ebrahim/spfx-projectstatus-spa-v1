import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { Version } from '@microsoft/sp-core-library';
import { WebPartContext } from '@microsoft/sp-webpart-base';

import { ProjectStatus } from './components/ProjectStatus';
import { IProjectStatusProps } from './components/IProjectStatusProps';

export interface IProjectStatusWebPartProps {}

export default class ProjectStatusWebPart
  extends BaseClientSideWebPart<IProjectStatusWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IProjectStatusProps> = React.createElement(
      ProjectStatus,
      {
        context: this.context as WebPartContext
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}

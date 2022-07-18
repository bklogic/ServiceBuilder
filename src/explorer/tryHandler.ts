import * as vscode from 'vscode';
import * as util from '../core/util';
import {TryService} from "./tryService";
import { TryWorkspace, TrySession, TryDataSource } from './tryModel';
import { DataSource } from '../model/dataSource';
import {ApplicationExplorer} from "./applicationExplorer";
import { DeployService } from '../services/deployService';

export class TryHandler {
	private context: vscode.ExtensionContext;
    private tryService: TryService;
    private appExplorer: ApplicationExplorer;
    private deployService: DeployService;

	constructor(context: vscode.ExtensionContext, tryService: TryService, appExplorer: ApplicationExplorer, deployService: DeployService) {
        this.context = context;
        this.tryService = tryService;
        this.appExplorer = appExplorer;
        this.deployService = deployService;
		vscode.commands.registerCommand('servicebuilderExplorer.try', () => this.try());
    }

	async try(): Promise<void> {
		// request workspace
        vscode.window.setStatusBarMessage("searching for a guest workspace...");
		try {
            const email = null;
			const workspace = await this.tryService.requestTryWorkspace(email);

            if (workspace) {
                workspace.durationInMinutes = (!workspace.durationInMinutes) ? 90 : workspace.durationInMinutes;
                vscode.window.showInformationMessage(
                    `A quest workspace is assigned to you. You have 90 min to finish the try session. Please follow the instructions in the Getting Started Tutorial for creating query, SQL and CRUD services.\n
                    Workspace Details:
                    \t  \t Name: ${workspace.workspaceName}
                    \t  \t Url: ${workspace.workspaceUrl}`,
                   { modal: true },
                    'Proceed'
                ).then( btn => {
                    if ( btn === 'Proceed') {
                        this.startTrySession(workspace);
                    }
                });    
            } else {
                vscode.window.showInformationMessage(
                    "All workspaces are taken at the moment. \n\nPlease try later.  ",
					{ modal: true }
				);    
            }

		}catch(error: any) {
            console.error('Error in requesting workspace.', error);
            vscode.window.showErrorMessage(
                error.message
			);
		}
        vscode.window.setStatusBarMessage("");
	}

    async startTrySession(workspace: TryWorkspace) {
        vscode.window.setStatusBarMessage("staring a try session...");
        try {
            // create session
            const trySession = await this.tryService.startTrySession(workspace.workspaceId, workspace.accessCode);
            vscode.window.setStatusBarMessage('session is created.');

            // save connection
            await this.context.secrets.store('servicebuilder.url', trySession.workspaceUrl);
            await this.context.secrets.store('servicebuilder.token', trySession.accessToken);
            await this.context.secrets.store('servicebuilder.workspace', trySession.workspaceName);
            vscode.window.setStatusBarMessage('workspace is ready.');

            // clean workspace
            await this.deployService.cleanWorkspace(workspace.workspaceName);

            // create application
            await this.createAndDeployTryApplication(trySession.dataSource);
            vscode.window.setStatusBarMessage('application is created.');

        } catch (error: any) {
            // display error
            vscode.window.showErrorMessage('Error to start try session. Please try later. Error is: ' + error.message);
        }
        vscode.window.setStatusBarMessage("");
    }

    async createAndDeployTryApplication(dataSource: TryDataSource): Promise<void> {
        // delete try application is exists

        // create try application
        const app = await this.appExplorer.createApplication('myApp', 'mysql');

        // return if app not created
        if (!app) {
            throw Error('Failed to create try application. Please retry');
        }

        // add try data source
        const dataSourceUri = vscode.Uri.joinPath(app.uri, 'src', 'datasource.json');
        await util.storePassword(this.context, dataSourceUri.path, dataSource.password);
        const dsConfig: DataSource = {
            dbType: dataSource.dbType,
            host: dataSource.host,
            port: +dataSource.port,
            database: dataSource.dbName,
            username: dataSource.username,
            password:  util.passwordMask
        };
        await util.writeJsonFile(dataSourceUri, dsConfig);

        // create try module
        await this.appExplorer.createModule(app, 'myMod');
        
        // refresh tree view
        await this.appExplorer.refresh();

        // deploy try application
        await this.appExplorer.deployApplication(app);
    }

}
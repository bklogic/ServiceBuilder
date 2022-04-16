import * as vscode from 'vscode';
import * as util from '../core/util';
import {TryService} from "./tryService";
import { TryWorkspace, TrySession, TryDataSource } from './tryModel';
import {ApplicationExplorer} from "./applicationExplorer";

export class TryHandler {
	private context: vscode.ExtensionContext;
    private tryService: TryService;
    private appExplorer: ApplicationExplorer;

	constructor(context: vscode.ExtensionContext, tryService: TryService, appExplorer: ApplicationExplorer) {
        this.context = context;
        this.tryService = tryService;
        this.appExplorer = appExplorer;
		vscode.commands.registerCommand('servicebuilderExplorer.try', () => this.try());
    }

	async try(): Promise<void> {
		// request workspace
		try {
            const email = null;
			const workspace = await this.tryService.requestTryWorkspace(email);

            if (workspace) {
                vscode.window.showInformationMessage(
                    `Workspace found for your try. You may connect now. \n
					Workspace Details:
					\t  \t Name: ${workspace.workspaceName}
					\t  \t Url: ${workspace.workspaceUrl}`,
					{ modal: true },
                    'Connect'
                ).then( btn => {
                    if ( btn === 'Connect') {
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
	}

    async startTrySession(workspace: TryWorkspace) {
        try {
            // create session
            const trySession = await this.tryService.startTrySession(workspace.workspaceId, workspace.accessCode);
            vscode.window.setStatusBarMessage('session is created.');

            // save connection
            await this.context.secrets.store('servicebuilder.url', trySession.workspaceUrl);
            await this.context.secrets.store('servicebuilder.token', trySession.accessToken);
            await this.context.secrets.store('servicebuilder.workspace', trySession.workspaceName);
            vscode.window.setStatusBarMessage('workspace is ready.');

            // create application
            await this.createAndDeployTryApplication(trySession.dataSource);
            vscode.window.setStatusBarMessage('application is created.');

            // open tutorial ?

        } catch (error: any) {
            // display error
            vscode.window.showErrorMessage('Error to start try session. Pleaes try later. Error is: ' + error.message);
        }
    }

    async createAndDeployTryApplication(dataSource: TryDataSource): Promise<void> {
        // delete try application is exists

        // create try application
        const app = await this.appExplorer.createApplication('tryApp', 'mysql');

        // return if app not created
        if (!app) {
            throw Error('Failed to create try application. Please retry');
        }

        // add try data source
        const dataSourceUri = vscode.Uri.joinPath(app.uri, 'src', 'datasource.json');
        await util.storePassword(this.context, dataSourceUri.path, dataSource.password);
        dataSource.password = util.passwordMask;
        await util.writeJsonFile(dataSourceUri, dataSource);

        // create try module
        await this.appExplorer.createModule(app, 'tryMod');

        // deploy try application
        await this.appExplorer.deployApplication(app);
    }

}
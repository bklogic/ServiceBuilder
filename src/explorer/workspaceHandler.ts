import * as vscode from 'vscode';
import * as path from 'path';
import * as URL from 'url';
import * as util from '../core/util';
import { BuilderService } from '../services/builderService';
import { Workspace, WorkspaceAuthentication } from '../model/workspace';


export class WorkspaceHandler {
	private context: vscode.ExtensionContext;
	private builderService: BuilderService;

	constructor(context: vscode.ExtensionContext, builderService: BuilderService) {
        this.context = context;
		this.builderService = builderService;
		vscode.commands.registerCommand('servicebuilderExplorer.connect', () => this.connect());
		vscode.commands.registerCommand('servicebuilderExplorer.workspace', () => this.workspace());
		vscode.commands.registerCommand('servicebuilderExplorer.openGettingStarted', () => this.openGettingStarted());
    }

	openGettingStarted(): void {
		const uri = vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'GettingStarted.md'));
		vscode.commands.executeCommand("markdown.showPreviewToSide", uri);	
	}

	async connect(): Promise<void> {
		const url = await this.context.secrets.get('servicebuilder.url');
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Workspace URL", value: url, prompt: "from Service Console"})
			.then( url => {
				if (url) {
					vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Access Token", prompt: "from Service Console"}).then( async (token) => {
						if (token) {
							// check whether localhost url for workspace
							const host = new URL.URL(url).host;
							const workspace = (host.match('localhost')) ? 'default' : host.substring(0, host.indexOf("."));

							// authenticate workspce
							let auth: WorkspaceAuthentication = {} as WorkspaceAuthentication;
							if ( workspace === 'default' ) { // bypass auth if local default workspace
								auth =  {
									workspaceUrl: url, workspaceName: workspace, jwtAccessToken: token
								};
							} else {
								try {
									auth = await this.builderService.authenticateWorkspace(url, token);
								} catch(err: any) {
									vscode.window.showErrorMessage("Invalid workspace name or access token: " + err.message);
									return;
								}
							}

							// save connection
							await this.context.secrets.store('servicebuilder.url', url);
							await this.context.secrets.store('servicebuilder.workspace', auth.workspaceName);
							await this.context.secrets.store('servicebuilder.token', auth.jwtAccessToken);

							// show workspace
							vscode.window.showInformationMessage("Success. Connected to workspace: " + auth.workspaceName + ".");
						} else {
							vscode.window.setStatusBarMessage("no token entered.");
						}
					});
				} else {
					vscode.window.setStatusBarMessage("no url entered.");
				}
			});		
	}

	async workspace(): Promise<void> {
		// get current workspace setting
		const workspace: Workspace = {
			name: await this.context.secrets.get("servicebuilder.workspace"),
			url: await this.context.secrets.get("servicebuilder.url"),
			accessToken: await this.context.secrets.get("servicebuilder.token"),
			versions: undefined,
			connectionIssue: undefined
		};		

		// check workspace setting not undefined
		if (!workspace.url) {
			this.showNotConnectedMessageForUnspecifiedWorkspace();
			return;
		}

		// otherwise, test connection by getting builder versions
		try {
			// test connection
			workspace.versions = await this.builderService.getBuilderVersions();
			
			// show
			this.showConnectedMessage(workspace);

		 } catch(error: any) {
			workspace.connectionIssue = error.message;
			this.showNotConnectedMessageForConnectionIssue(workspace);
		}
	}

	showConnectedMessage(workspace: Workspace) {
			vscode.window.showInformationMessage(
				`Connected. \n
				 Workspace Details:
				 \t  \t Name: ${workspace.name}
				 \t  \t Url: ${workspace.url}
				 \t  \t Version: 
				 \t     \t Engine:  ${workspace.versions?.engine}
				 \t     \t Deployer:  ${workspace.versions?.deployer}
				 \t     \t Builder:  ${workspace.versions?.builder}`,
				 { modal: true },
				 'Switch Workspace'
			).then( btn => {
				if ( btn === 'Switch Workspace') {
					this.connect();
				}
			});
	}


	showNotConnectedMessageForUnspecifiedWorkspace() {
		vscode.window.showInformationMessage(
			`Not connected. \n
			To connect, you need the workspace url and access token. 
			They are available from Service Console.`,
			 { modal: true },
			 'Connect'
		).then( btn => {
			if ( btn === 'Connect') {
				this.connect();
			}
		});
	}

	showNotConnectedMessageForConnectionIssue(workspace: Workspace) {
		vscode.window.showInformationMessage(
		   `Not connected. Connection issue. \n
			Please review the connection information:
			\t   \t Workspace url: ${workspace.url}
			\t   \t Workspace name: ${workspace.name}
			\t   \t Issue: ${workspace.connectionIssue}`,
		{ modal: true },
			 'Reconnect','View Access Token'
		).then( btn => {
			if ( btn === 'Reconnect') {
				this.connect();
			}
			else if ( btn === 'View Access Token' ) {
				vscode.window.showInformationMessage(workspace.accessToken || 'No token available.');
			}
		});
	}
}


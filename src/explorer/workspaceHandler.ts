import * as vscode from 'vscode';
import * as path from 'path';
import * as URL from 'url';
import * as util from '../core/util';
import {
    BuilderService, Versions
} from '../core/builderService';


export class WorkspaceHandler {
	private context: vscode.ExtensionContext;
	private builderService: BuilderService;

	constructor(context: vscode.ExtensionContext, builderService: BuilderService) {
        this.context = context;
		this.builderService = builderService;
		vscode.commands.registerCommand('servicebuilderExplorer.connect', () => this.connect());
		vscode.commands.registerCommand('servicebuilderExplorer.workspace', () => this.workspace());
    }

	async connect(): Promise<void> {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Workspace URL", prompt: "from Service Console"})
			.then( url => {
				if (url) {
					vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Access Token", prompt: "from Service Console"}).then( async (token) => {
						if (token) {
							// parse url for workspace
							const host = new URL.URL(url).host;
							const workspace = (host.match('localhost')) ? 'default' : host.substr(0, host.indexOf("."));

							// save connection
							await this.context.secrets.store('servicebuilder.url', url);
							await this.context.secrets.store('servicebuilder.token', token);
							await this.context.secrets.store('servicebuilder.workspace', workspace);

							// show workspace
							this.workspace();
						} else {
							vscode.window.showErrorMessage("no token entered.");
						}
					});
				} else {
					vscode.window.showErrorMessage("no url entered.");
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

export interface Workspace {
	name: string | undefined,
	url: string | undefined,
	accessToken: string | undefined,
	versions: Versions | undefined,
	connectionIssue: string | null | undefined
}

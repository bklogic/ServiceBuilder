import * as vscode from 'vscode';
import * as util from '../../core/util';
import * as URL from 'url';
import { BuilderService } from '../../backend/builder/builderService';
import { Versions} from '../../backend/builder/builderModel';
import { ConnectRequest, RefreshTokenRequest} from '../../backend/builder/builderModel';
import { Workspace} from '../../backend/builder/builderModel';

export class WorkspaceHandler {
	private context: vscode.ExtensionContext;
	private builderService: BuilderService;

	constructor(context: vscode.ExtensionContext, builderService: BuilderService) {
        this.context = context;
		this.builderService = builderService;
		vscode.commands.registerCommand('servicebuilderWorkspace.register', () => this.register());
		vscode.commands.registerCommand('servicebuilderWorkspace.connect', () => this.connect());
		vscode.commands.registerCommand('servicebuilderWorkspace.show', () => this.showWorkspace());    
		vscode.commands.registerCommand('servicebuilderWorkspace.about', () => this.about());    
	}

	async register(): Promise<void> {
		// collect user input
		const builderEndpoint = await vscode.window.showInputBox({
			placeHolder: 'Builder endpoint',
			prompt: "Enter builder URL"
		});	
		if (!builderEndpoint) {
            vscode.window.setStatusBarMessage("No builder URL entered.");
            return;
		}

		// register
		try {
			vscode.window.setStatusBarMessage("registering ...");
			// send request
			const workspace = await this.builderService.register(builderEndpoint);
			// inform user
			vscode.window.showInformationMessage("Registered and workspace created.", {modal: true});
			// save workspace
			util.storeWorkspace(this.context, workspace);
		} catch (error: any) {
			vscode.window.showErrorMessage('Failed to register. \n ' + error.message);
		} finally {
			vscode.window.setStatusBarMessage("");
		}
	}
	
	async connect(): Promise<void> {
		// get workspace from store
		let workspace;
		try {
			workspace = await util.readWorkspace(this.context) as Workspace;
		} catch (err: any) {
			workspace = undefined;
		}

		// collect url from user
		const url = await vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Workspace URL", value: workspace?.url});
		if (!url) {
            vscode.window.setStatusBarMessage("No url entered.");
            return;
		}
		// collect access key from user
		let accessKey = await vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Access Key"});
		if (!accessKey) {
           accessKey = 'none';
		}

		// parse workspaceUrl for builderUrl
		const builderEndpoint = `${new URL.URL(url).protocol}//${new URL.URL(url).host}`;

		// connect 
		try {
			vscode.window.setStatusBarMessage("connecting ...");
			// send request
			const request : ConnectRequest = {workspaceUrl: url, accessKey: accessKey};
			workspace = await this.builderService.connect(builderEndpoint, request);
			// save workspace
			util.storeWorkspace(this.context, vscode.workspace);
			// inform user
			vscode.window.showInformationMessage(`Connected to workspace: ${workspace.name}.`, {modal: true});
		} catch (err: any) {
			this.showConnectIssue(url, accessKey, err.message);
		} finally {
			vscode.window.setStatusBarMessage("");
		}

	}

	async showWorkspace(): Promise<void> {
		// get workspace
		const workspace = await util.readWorkspace(this.context) as Workspace;
		if (workspace) {
			this.showConnectedMessage(workspace);
		} else {
			this.showNotConnectedMessage();
		}
	}
	
	async about(): Promise<void> {
		const workspace = await util.readWorkspace(this.context) as Workspace;
		try {
			const versions = await this.builderService.getVersions(workspace.builderEndpoint);
			this.showVersions(versions);
		} catch (err: any) {
			vscode.window.showWarningMessage("Failed to retrieve builder versions: " + err.message);
		}
	}

	/*
	* Reconnect to fresh access token.
	*/
	async refreshToken(workspace: Workspace): Promise<void> {
		try {
			const request : RefreshTokenRequest = {workspaceName: workspace.name, accessKey: workspace.accessKey};
			const token = await this.builderService.refreshToken(workspace.builderEndpoint, request);
			workspace.token = token;
			util.storeWorkspace(this.context,workspace);
			vscode.window.showInformationMessage(`Access token refreshed.`);
		} catch (err: any) {
			vscode.window.showWarningMessage("Failed to refresh access token: " + err.message);
		}
	}

	/*
	* Show issues for "Connect Workspace"
	*/
	showConnectIssue(workspaceUrl: string, accessKey: string, issue: string): void {
		vscode.window.showWarningMessage(
			`Failed to connect. Please retry with correct url and access key. \n
			You have entered:
		    \t   \t Workspace url: ${workspaceUrl}
		    \t   \t Access key: ${accessKey} \n
			Issue: ${issue}`,
		{ modal: true },
			 'Retry'
		).then( btn => {
			if (btn === 'Retry') {
				this.connect();
			}
		});
	}

	/*
	* Show connected workspace for "Show Workspace"
	*/
	showConnectedMessage(workspace: Workspace): void {
		// token status
		let tokenStatus = "Valid";
		const expireAt = workspace.token?.expireAt;
		if (!expireAt) {
			tokenStatus = 'None';
		} 
		else if (expireAt < new Date()) {
			tokenStatus = 'Expired';
		}
		// display
		vscode.window.showInformationMessage(
				`Workspace:
				 \t   \t Name: \t ${workspace.name}
				 \t   \t Url: \t ${workspace.url}
				 \t   \t Service endpoint: \t ${workspace.serviceEndpoint}
				 \t   \t Access token: \t ${tokenStatus}`,
				 { modal: true },
				 'Refresh Token', 'Copy Service Endpoint'
			).then( async btn => {
				if ( btn === 'Refresh Token') {
					this.refreshToken(workspace);
				}
				else if ( btn === 'Copy Service Endpoint') {
					vscode.env.clipboard.writeText(workspace.serviceEndpoint);
				}
			});
	}

	/*
	* Show not connected workspace for "Show Workspace"
	*/
	showNotConnectedMessage(): void {
		vscode.window.showInformationMessage(
		    `No workspace connection. \n
			To connect, you need to register with a builder url
			or connect with a workspace url and access key`,
			{ modal: true },
			'Register', 'Connect'
		).then( btn => {
			if ( btn === 'Connect') {
				this.connect();
			}
			else if ( btn === 'Register') {
				this.register();
			}
		});
	}

	private showVersions(versions: Versions): void {
		vscode.window.showInformationMessage(
			`Builder Service:
			 \t     \t Runtime:  ${versions.runtime}
			 \t     \t Builder:  ${versions.builder}`,
			 { modal: true }
		);
	}

}
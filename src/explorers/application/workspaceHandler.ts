import * as vscode from 'vscode';
import * as URL from 'url';
import { BuilderService } from '../../backend/builder/builderService';
import { Versions} from '../../backend/builder/builderModel';
import { TryService } from '../../backend/try/tryService';


export class WorkspaceHandler {
	private context: vscode.ExtensionContext;
	private builderService: BuilderService;
	private tryService: TryService;


	constructor(context: vscode.ExtensionContext, builderService: BuilderService, tryService: TryService) {
        this.context = context;
		this.builderService = builderService;
		this.tryService = tryService;
		vscode.commands.registerCommand('servicebuilderExplorer.request', () => this.request());
		vscode.commands.registerCommand('servicebuilderExplorer.connect', () => this.connect());
		vscode.commands.registerCommand('servicebuilderExplorer.workspace', () => this.showWorkspace());    
		vscode.commands.registerCommand('servicebuilderExplorer.about', () => this.about());    
	}

		async request(): Promise<void> {
			// collect email
			const email = await vscode.window.showInputBox({
				placeHolder: 'Email',
				prompt: "email to receive workspace info"
			});	
	
			// validate email string
			const emailRegex = '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$';
			if (!email) {
				vscode.window.setStatusBarMessage("No email entered.");
				return;
			}
			else if (!email.match(emailRegex)) {
				vscode.window.setStatusBarMessage("Invalid email string.");
				return;
			}
	
			// collect request type
			let items = ['Workspace only', 'Workspace and database for tutorial'];
			let options = {ignoreFocusOut: true, placeHolder: "Workspace type", value: "Yes", canPickMany: false};
			let reqType = await vscode.window.showQuickPick(items, options);
			if (!reqType) {
				vscode.window.setStatusBarMessage("No workspace type selected.");
				return;
			}
			reqType = reqType.includes('database') ? 'starter' : 'basic';
	
			// collect mailing list selection
			items = ['Yes', 'No'];
			options = {ignoreFocusOut: true, placeHolder: "Join mailing list for product news", value: "Yes", canPickMany: false};
			let addToMailinglist = await vscode.window.showQuickPick(items, options);
			addToMailinglist = (addToMailinglist === 'Yes') ? 'Y' : 'N';
	
			// request
			try {
				vscode.window.setStatusBarMessage("processing request ...");
				// send request
				const result = await this.tryService.requestWorkspace(email, reqType, addToMailinglist);
				// inform user
				const message = result 
					? `A workspace is assigned to you and connection info is sent to ${email}.`
					: "A workspace/database cannot be reserved at this time. Please try later.";
				vscode.window.showInformationMessage(message, {modal: true});
			} catch (error: any) {
				console.error('Error in requesting workspace.', error);
				vscode.window.showErrorMessage(error.message);
			} finally {
				vscode.window.setStatusBarMessage("");
			}
		}
	

	async connect(): Promise<void> {
		// get url from store
		let url;
		try {
			url = await this.context.secrets.get('servicebuilder.url');
		} catch (error: any) {
			// set to undefined if problem to retrive secret
			url = undefined;
		} 
		// collect url from user
		url = await vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Workspace URL", value: url});
		if (!url) {
            vscode.window.setStatusBarMessage("No url entered.");
            return;
		}

		// collect access key from user
		const accessKey = await vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Access Key"});
		if (!accessKey) {
            vscode.window.setStatusBarMessage("No access key entered.");
            return;
		}

		// extract workspace name. For localhost, set name to "default".
		const host = new URL.URL(url).host;
		const workspaceName = (host.match('localhost')) ? 'default' : host.substring(0, host.indexOf("."));

		// request access token
		let accessToken = 'default+token';
		if ( workspaceName !== 'default' )  {
			try {
				accessToken = await this.tryService.requestAccessToken(url, accessKey);
			} catch(err: any) {
				this.showConnectIssue(url, accessKey, err.message);
				return;
			}
		}

		// save connection
		await this.context.secrets.store('servicebuilder.workspace', workspaceName);
		await this.context.secrets.store('servicebuilder.url', url);
		await this.context.secrets.store('servicebuilder.accessKey', accessKey);
		await this.context.secrets.store('servicebuilder.accessToken', accessToken);

		// test connection
		try {
			await this.builderService.getBuilderVersions();
			vscode.window.showInformationMessage(`Connected. Workspace name: ${workspaceName}.`, {modal: true});
		} catch (err: any) {
			this.showConnectionFailure(workspaceName, url, err.message);
		}
	}

	/*
	* Get and test a new access token
	*/
	async reconnect(): Promise<void> {
		// get new access token
		const workspaceName = await this.context.secrets.get("servicebuilder.workspace") || '';
		const workspaceUrl = await this.context.secrets.get("servicebuilder.url") || '';
		const accessKey = await this.context.secrets.get("servicebuilder.accessKey") || '';
		try {
			const accessToken = await this.tryService.requestAccessToken(workspaceUrl, accessKey);
			this.context.secrets.store("servicebuilder.accessToken", accessToken);
		} catch (err: any) {
			this.showConnectIssue(workspaceUrl, accessKey, err.message);
		}
		
		// test builder connection
		try {
			await this.builderService.getBuilderVersions();
			this.showConnectedMessage(workspaceName, workspaceUrl);
		} catch (err: any) {
			vscode.window.showWarningMessage(`Reconnect failed: ${err.message}. Please try later.`, {modal:true});
		}
	}

	async showWorkspace(): Promise<void> {
		// check accessToken
		const accessToken = await this.context.secrets.get("servicebuilder.accessToken");
		if (!accessToken) {
			this.showNotConnectedMessage();
			return;			
		}

		// get current workspace setting
		const workspaceName = await this.context.secrets.get("servicebuilder.workspace") || '';
		const workspaceUrl = await this.context.secrets.get("servicebuilder.url") || '';

		// test connection
		try {
			await this.builderService.getBuilderVersions();
			this.showConnectedMessage(workspaceName, workspaceUrl);
		} catch(err: any) {
			this.showConnectionFailure(workspaceName, workspaceUrl, err.message);
		}
	}

	async about(): Promise<void> {
		const versions = await this.builderService.getBuilderVersions();
		if (versions) {
			this.showVersions(versions);
		} else {
			vscode.window.showWarningMessage("No workspace connection.");
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
	showConnectedMessage(workspaceName: string, workspaceUrl: string): void {
			vscode.window.showInformationMessage(
				`Workspace:
				 \t   \t Name: \t ${workspaceName}
				 \t   \t Url: \t ${workspaceUrl}
				 \t   \t Status: \t Connected `,
				 { modal: true },
				 'Switch Workspace'
			).then( btn => {
				if ( btn === 'Switch Workspace') {
					this.connect();
				}
			});
	}

	/*
	* Show not connected workspace for "Show Workspace"
	*/
	showNotConnectedMessage(): void {
		vscode.window.showInformationMessage(
			`No workspace is connected. \n
			To connect, you need the workspace url and access key, which
			are available upon request.`,
			 { modal: true },
			 'Connect'
		).then( btn => {
			if ( btn === 'Connect') {
				this.connect();
			}
		});
	}

	/*
	* Show test connection failure for "Show Workspace"
	*/
	showConnectionFailure (workspaceName: string, workspaceUrl: string, issue: string): void {
		vscode.window.showWarningMessage(
			`Connection issue found. \n
			Workspace:
			\t   \t Workspace name: ${workspaceName}
			\t   \t Workspace url: ${workspaceUrl} \n
			Issue: ${issue}`,
		{ modal: true },
			 'Reconnect'
		).then( btn => {
			if ( btn === 'Reconnect') {
				this.reconnect();
			}
		});
	}

	/*
	* Show builder versions for "About"
	*/
	private showVersions(versions: Versions): void {
		vscode.window.showInformationMessage(
			`Service Builder Versions:
			 \t     \t Engine:  ${versions.engine}
			 \t     \t Deployer:  ${versions.deployer}
			 \t     \t Builder:  ${versions.builder}`,
			 { modal: true }
		);
	}

}


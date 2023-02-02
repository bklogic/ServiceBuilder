import * as vscode from 'vscode';
import * as URL from 'url';
import { BuilderService } from '../../backend/builderService';
import { Workspace, Versions} from './workspaceModel';
import { TryService } from '../../backend/tryService';


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
		vscode.commands.registerCommand('servicebuilderExplorer.workspace', () => this.workspace());    
		vscode.commands.registerCommand('servicebuilderExplorer.about', () => this.about());    
	}

		async request(): Promise<void> {
			let result: string;
	
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
				let message = `Workspace is reserved and connection info is sent to ${email}.`;
				if (result === null) {
					message = "Workspace cannot be reserved at this time. Please try later.";
				} 
				vscode.window.showInformationMessage(message);
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
			console.error("Error to read context secrete.", error);
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

		// check whether localhost url
		const host = new URL.URL(url).host;
		const workspace = (host.match('localhost')) ? 'default' : host.substring(0, host.indexOf("."));

		// request access token
		let accessToken = 'default+token';
		if ( workspace !== 'default' )  {
			try {
				accessToken = await this.tryService.requestAccessToken(url, accessKey);
			} catch(err: any) {
				vscode.window.showErrorMessage("Failed to get access token: " + err.message);
				return;
			}
		}

		// save connection
		await this.context.secrets.store('servicebuilder.workspace', workspace);
		await this.context.secrets.store('servicebuilder.url', url);
		await this.context.secrets.store('servicebuilder.accessKey', accessKey);
		await this.context.secrets.store('servicebuilder.accessToken', accessToken);

		// test connection
		try {
			const versions = await this.builderService.getBuilderVersions();
			vscode.window.showInformationMessage("Success. Connected to workspace: " + workspace + ".");
		} catch (error: any) {
			vscode.window.showErrorMessage("Failed to connect to workspace: " + workspace + " for: " + error.message);
		}
	}

	async workspace(): Promise<void> {
		// get current workspace setting
		const workspace = {
			name: await this.context.secrets.get("servicebuilder.workspace"),
			url: await this.context.secrets.get("servicebuilder.url")
		} as Workspace;		

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

	async about(): Promise<void> {
		const versions = await this.builderService.getBuilderVersions();
		if (versions) {
			this.showVersions(versions);
		} else {
			vscode.window.showWarningMessage("No workspace connection.");
		}
	}

	showConnectedMessage(workspace: Workspace): void {
			vscode.window.showInformationMessage(
				`Workspace:
				 \t   \t Name: \t ${workspace.name}
				 \t   \t Url: \t ${workspace.url}
				 \t   \t Status: \t Connected `,
				 { modal: true },
				 'Switch Workspace'
			).then( btn => {
				if ( btn === 'Switch Workspace') {
					this.connect();
				}
			});
	}


	showNotConnectedMessageForUnspecifiedWorkspace(): void {
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

	showNotConnectedMessageForConnectionIssue(workspace: Workspace): void {
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


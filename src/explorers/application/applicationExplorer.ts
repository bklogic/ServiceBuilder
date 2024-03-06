import * as vscode from 'vscode';
import * as util from '../../core/util';
import {ApplicationDataProvider} from './applicationDataProvider';
import {ApplicationExplorerService} from "./applicationExplorerService";
import {Entry, EntryType, ApplicationFile} from './applicationModel';
import { Application, Module, Service } from '../../backend/builder/deployModel';
import { WorkspaceHandler } from './workspaceHandler';
import { BuilderClient } from '../../backend/builder/builderClient';
import { BuilderService } from '../../backend/builder/builderService';
import { ServiceHandler } from './serviceHandler';
import { Workspace } from '../../backend/builder/builderModel';


export class ApplicationExplorer {
	private context: vscode.ExtensionContext;
	private dataProvider: ApplicationDataProvider;
	private treeView: vscode.TreeView<Entry>;
	private explorerService: ApplicationExplorerService;
	private builderService: BuilderService;
	private doubleClick = new util.DoubleClick();

	constructor(context: vscode.ExtensionContext, builderClient: BuilderClient) {
		this.context = context;
		this.explorerService = new ApplicationExplorerService();
		this.builderService = builderClient.builderService;
		this.dataProvider = new ApplicationDataProvider();
		this.treeView = vscode.window.createTreeView('servicebuilderExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
		context.subscriptions.push(this.treeView);
		new WorkspaceHandler(context, builderClient.builderService);
		new ServiceHandler(builderClient, this.dataProvider, this.treeView);
		vscode.commands.registerCommand('servicebuilderExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.refresh', () => this.refresh());
		vscode.commands.registerCommand('servicebuilderExplorer.rename', (resource) => this.onRename(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.delete', (resource) => this.delete(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.copy', (resource) => this.copy(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.paste', (resource) => this.paste(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createApplication', () => this.onCreateApplication());
		vscode.commands.registerCommand('servicebuilderExplorer.deployApplication', (resource) => this.deployApplication(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createModule', (resource) => this.onCreateModule(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployModule', (resource) => this.deployModule(resource));
	}

	openResource(resource: Entry): void {
		vscode.window.showTextDocument(resource.uri, {preview: !this.doubleClick.check(resource)});
	}

	refresh(): void {
		this.dataProvider.refresh();
	}

	onCreateApplication(): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "application name", prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					vscode.window.showQuickPick(['mysql', 'postgresql'], {ignoreFocusOut: true, placeHolder: "database type", canPickMany: false}).then( (dbType) => {
						if (dbType) {
							this.createApplication(name, dbType);							
						} else {
							vscode.window.setStatusBarMessage("No database type selected.");
						}
					});
				} else {
					vscode.window.setStatusBarMessage("No application name specified.");
				}
			});
	}

	onCreateModule(app: Entry): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "module name", prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.createModule(app, name);
				}
			});
	}

	async createApplication(appName: string, dbType: string): Promise<Entry|void> {
		try {
			// clear status message
			vscode.window.setStatusBarMessage('');

			// create application
			const workspace = await util.readWorkspace(this.context) as Workspace;
			const versions = await this.builderService.getVersions(workspace.builderEndpoint);
			const app = await this.explorerService.createApplication(this.dataProvider.workfolder, appName, dbType, versions);

			// reveal
			this.refresh();
			this.treeView.reveal(app, {expand: 2, focus: true, select: true});

			// inform user
			vscode.window.setStatusBarMessage('application is created.');

			return app;
	} catch (error: any) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Application name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}

	async deployApplication(app: Entry): Promise<void> {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'deploying application'
		}, async (progress) => {
			try {
				// clear status message
				vscode.window.setStatusBarMessage('');

				// verify data source configured
				const appFile = await util.readJsonFile(vscode.Uri.joinPath(app.uri, 'src', 'application.json')) as ApplicationFile;
				if (!appFile.dataSource) {
					throw Error("Data source not specified.");
				}

				// zip application
				const appUri = await util.applicationUriForApplication(app.uri.path);
				const archive = await util.getApplicationArchive(app.uri);
				const result = await this.builderService.deployApplication(appUri, archive);
				vscode.window.setStatusBarMessage('application is deployed.');
			} catch (error: any) {
				util.showErrorStatus('Failed to deploy application.', error.message);
			}
		});	
	}

	async redeployApplication(app: Entry, newApp: Entry): Promise<void> {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'redeploying application'
		}, async (progress) => {
			try {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// get app uri
				const appUri = await util.applicationUriForApplication(app.uri.path);
				// undeploy original application
				await this.builderService.undeployApplication(appUri);
				// deploy new application
				const newAppUri = await util.applicationUriForApplication(newApp.uri.path);
				const archive = await util.getApplicationArchive(newApp.uri);
				const result = await this.builderService.deployApplication(newAppUri, archive);
				// inform user
				vscode.window.setStatusBarMessage('Application is redeployed.');
			} catch (error: any) {
				vscode.window.setStatusBarMessage('Failed to redeploy application: ' + error.message);
			}
		});	
	}

	async undeployApplication(app: Entry): Promise<void> {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'undeploying application'
		}, async (progress) => {
			try {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip application
				const appUri = await util.applicationUriForApplication(app.uri.path);
				// call service
				await this.builderService.undeployApplication(appUri);
				// inform user
				vscode.window.setStatusBarMessage('application is undeployed.');
			} catch (error: any) {
				console.error('Error in undeploying application', error);
				vscode.window.setStatusBarMessage('Failed to undeploy application: ' + error.message);
			}
		});		
	}

	
	async createModule(app: Entry, modName: string): Promise<void> {
		try {
			// clear status message
			vscode.window.setStatusBarMessage('creating module: ' + modName);
			// create module
			const mod = await this.explorerService.createModule(app, modName);
			// reveal
			this.dataProvider.fire(app);
			this.treeView.reveal(mod, {expand: 2, focus: true, select: true});	
			// deploy module
			await this.deployModule(mod);
			// inform user
			vscode.window.setStatusBarMessage('Module is created.');
		} catch (error: any) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Module name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}

	async deployModule(mod: Entry): Promise<void> {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'deploying module'
		}, async (progress) => {
			try {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip module
				const appUri = await util.applicationUriForModule(mod.uri.path);
				const archive = await util.getArchive(mod.uri.fsPath);
				// call service
				await this.builderService.deployModule(appUri, mod.name, archive);
				// inform user
				vscode.window.setStatusBarMessage('module is deployed.');
			} catch (error: any) {
				vscode.window.setStatusBarMessage('Failed to deploy module: ' + error.message);
			}
		});		
	}

	/**
	 * Redeploy module as new module
	 * @param mod original module
	 * @param newMod new module
	 */
	async redeployModule(mod: Entry, newMod: Entry): Promise<void> {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'redeploying module'
		}, async (progress) => {
			try {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// get app uri
				const appUri = await util.applicationUriForModule(mod.uri.path);
				// undeploy original module
				await this.builderService.undeployModule(appUri, mod.name);
				// deploy new module
				const archive = await util.getArchive(newMod.uri.fsPath);
				await this.builderService.deployModule(appUri, newMod.name, archive);
				// inform user
				vscode.window.setStatusBarMessage('module is redeployed.');
			} catch (error: any) {
				vscode.window.setStatusBarMessage('Failed to redeploy module: ' + error.message);
			}
		});	
	}

	async undeployModule(mod: Entry): Promise<void> {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'undeploying module'
		}, async (progress) => {
			try {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip module
				const appUri = await util.applicationUriForModule(mod.uri.path);
				// call service
				await this.builderService.undeployModule(appUri, mod.name);
				// inform user
				vscode.window.setStatusBarMessage('module is undeployed.');
			} catch (error: any) {
				console.error('Error in undeploying module', error);
				vscode.window.setStatusBarMessage('Failed to undeploy module: ' + error.message);
			}
		});		
	}

	async delete(entry: Entry): Promise<void> {
		try {
			await this.explorerService.delete(entry.uri);
			if (entry.parent) {
				const parent = (entry.parent.name === 'src') ? entry.parent.parent : entry.parent;
				if (parent === null) { 
					vscode.window.showErrorMessage("Parent is null. Should never happen.");
					return;
				}; 
				this.dataProvider.fire(parent);
				this.treeView.reveal(parent, {focus: true, select: true});
			} else {
				this.refresh();
			}	
		} catch (error: any) {
			vscode.window.setStatusBarMessage('Failed to delete item: ' + error.message);
		}
	}

	private onRename(entry: Entry): void {
		this.treeView.reveal(entry, {select: true});
		vscode.window.showInputBox({
			ignoreFocusOut: true, placeHolder: `new ${entry.type} name`, value: entry.name, prompt: "Enter a new name. Must be an alphanumberic."
		})
			.then( name => {
				if (name) {
					this.rename(entry, name);
				}
			});
	}

	async rename(entry: Entry, name: string): Promise<void> {
		// get target uri
		let targetUri: vscode.Uri;
		if (entry.parent) {
			targetUri = vscode.Uri.joinPath(entry.parent.uri, name);
		} else { // application
			targetUri = vscode.Uri.joinPath(this.dataProvider.workfolder.uri, name);
		}

		// check target exists
		if (await this.explorerService.fileExists(targetUri)) {
			vscode.window.setStatusBarMessage('target name exists');
			return;
		}

		// rename
		try {
			await this.explorerService.rename(entry.uri, targetUri);
		} catch (error: any) {
			vscode.window.setStatusBarMessage('Failed to rename item: ' + error.message);
			return;
		}

		// redeploy
		const newEntry = {
			uri: targetUri,
			name: name,
			type: entry.type,
			fileType: entry.fileType,
			parent: entry.parent
		} as Entry;
		await this.redeploy(entry, newEntry);

		// show
		if (!entry.parent) {
			this.dataProvider.refresh();
		}
		else if (entry.parent.name === 'src') {
			this.dataProvider.fire(entry.parent.parent || entry.parent);
		} else {
			this.dataProvider.fire(entry.parent);
		}
	}

	async redeploy(entry: Entry, newEntry: Entry) {
		switch (entry.type) {
			case EntryType.Application:
				const appUri = vscode.Uri.joinPath(newEntry.uri, 'src', 'application.json');
				const app = await util.readJsonFile(appUri) as Application;
				app.name = newEntry.name;
				await util.writeJsonFile(appUri, app);
				await this.resavePassword(entry, newEntry);
				await this.redeployApplication(entry, newEntry);
				break;
			case EntryType.Module:
				const modUri = vscode.Uri.joinPath(newEntry.uri, 'module.json');
				const mod = await util.readJsonFile(modUri) as Module;
				mod.name = newEntry.name;
				await util.writeJsonFile(modUri, mod);
				await this.redeployModule(entry, newEntry);
				break;
			case EntryType.QueryService: case EntryType.SqlService: case EntryType.CrudService:
				const serviceUri = vscode.Uri.joinPath(newEntry.uri, 'service.json');
				const service = await util.readJsonFile(serviceUri) as Service;
				service.name = newEntry.name;
				await util.writeJsonFile(serviceUri, service);
				// await this.undeployService(entry);
				// await this.deployService(newEntry);
				break;
		}
	}

	private async resavePassword(app: Entry, newApp: Entry): Promise<void> {
        const dataSourceUri = vscode.Uri.joinPath(app.uri, 'src', 'datasource.json');
        const newDataSourceUri = vscode.Uri.joinPath(newApp.uri, 'src', 'datasource.json');
		const password = await util.retrievePassword(this.context, dataSourceUri.path);
		util.storePassword(this.context, newDataSourceUri.path, password);
	}

	private copy(entry: Entry) {
		vscode.env.clipboard.writeText(JSON.stringify(entry));
	}

	private async paste(target: Entry) {
		// retrieve source
		const text = await vscode.env.clipboard.readText();
		if (!text) {
			vscode.window.setStatusBarMessage('Nothing to paste.');
			return;
		}
		let source: Entry;
		try {
			source = JSON.parse(text) as Entry;
		} catch (error: any) {
			vscode.window.setStatusBarMessage('No entry to paste');
			return;
		}
		// copy target
		let targetUri: vscode.Uri;
		if (source.type === EntryType.Application && target.type === EntryType.Application) {
			targetUri = await this.explorerService.getCopyTarget(source.name, this.dataProvider.workfolder.uri);
			await this.explorerService.copy(source.uri, targetUri);
			this.dataProvider.refresh();
		} 
		else if (source.type === EntryType.Module && target.type === EntryType.Application) {
			targetUri = await this.explorerService.getCopyTarget(source.name, vscode.Uri.joinPath(target.uri, 'src'));
			await this.explorerService.copy(source.uri, targetUri);
			this.dataProvider.fire(target);
		} 
		else if (( source.type === EntryType.QueryService 
					|| source.type === EntryType.SqlService 
					|| source.type === EntryType.CrudService 
				) && target.type === EntryType.Module ) {
			targetUri = await this.explorerService.getCopyTarget(source.name, target.uri);
			await this.explorerService.copy(source.uri, targetUri);
			this.dataProvider.fire(target);
		} else {
			vscode.window.setStatusBarMessage('Not right target to paste');
		}
	}

}


import { SSL_OP_EPHEMERAL_RSA } from 'constants';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TreeDataProvider } from "vscode";
import {ApplicationService, Entry, EntryType, ServiceType} from "./applicationService";


export class ApplicationDataProvider implements TreeDataProvider<Entry> {
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | void> = new vscode.EventEmitter<Entry | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Entry | undefined | void> = this._onDidChangeTreeData.event;
	private appService: ApplicationService;
	workfolder: Entry;

	constructor() {
		this.appService = new ApplicationService();
		this.workfolder = this.getWorkfolderEntry();
	}

	getTreeItem(element: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
		const treeItem = new vscode.TreeItem(
			element.uri, 
			(element.fileType === vscode.FileType.Directory) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
		);
		if (element.fileType === vscode.FileType.File) {
			treeItem.command = { command: 'servicebuilderExplorer.openResource', title: "Open File", arguments: [element] };
		}
		switch (element.type) {
			case EntryType.Application:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg')
				};
				treeItem.tooltip = 'application';
				break;
			case EntryType.Module:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg')
				};
				treeItem.tooltip = 'module';
				break;
			case EntryType.QueryService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'window.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'window.svg')
				};
				treeItem.tooltip = 'query service';
				break;
			case EntryType.SqlService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'server-process.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'server-process.svg')
				};
				treeItem.tooltip = 'sql service';
				break;			
			case EntryType.CrudService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'symbol-method.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'symbol-method.svg')
				};
				treeItem.tooltip = 'crud service';
				break;			
			case EntryType.Tests:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'beaker.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'beaker.svg')
				};
				treeItem.tooltip = 'tests';
				break;
			default:
				treeItem.tooltip = element.name.replace('.sql', '').replace('.json', '');
				if (['application', 'module', 'service'].includes(treeItem.tooltip)) {
					treeItem.tooltip = treeItem.tooltip + ' file';
				}
			}
		treeItem.id = element.uri.path;
		treeItem.label = element.name;
		treeItem.description = false;
		treeItem.contextValue = element.type.toString();
		return treeItem;
	}

	getChildren(element?: Entry): Promise<Entry[]> {
		// otherwise, set element to workspace folder if element is passed in
		if (!element) {
			element = this.workfolder;
		}
		// return chilren of element
		return this.appService.getChildren(element);
	}

	getParent?(element: Entry): vscode.ProviderResult<Entry> {
		return element.parent;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	fire(entry: Entry): void {
		this._onDidChangeTreeData.fire(entry);
	}

	getWorkfolderEntry(): Entry {
		// if no workspace folders
		if (!vscode.workspace.workspaceFolders) {
			// throw Error("No workfolder");
			return {} as Entry;
		}
		// otherwise, set element to workspace folder if element is passed in
		const workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
		const entry = { 
			uri: workspaceFolder.uri, 
			type: EntryType.Workfolder,
			serviceType: null, 
			componentType: null, 
			fileType: vscode.FileType.Directory, 
			name: 'workspace',
			parent: null,
			seqNo: 0
		};
		return entry;
	}
}

export class ApplicationExplorer {

	private dataProvider: ApplicationDataProvider;
	private treeView: vscode.TreeView<Entry>;
	private appService: ApplicationService;
	private doubleClick = new DoubleClick();

	constructor(context: vscode.ExtensionContext) {
		this.appService = new ApplicationService();
		this.dataProvider = new ApplicationDataProvider();
		this.treeView = vscode.window.createTreeView('servicebuilderExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
		context.subscriptions.push(this.treeView);
		vscode.commands.registerCommand('servicebuilderExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.refresh', () => this.refresh());
		vscode.commands.registerCommand('servicebuilderExplorer.rename', (resource) => this.onRename(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.delete', (resource) => this.delete(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.copy', (resource) => this.copy(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.paste', (resource) => this.paste(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createApplication', () => this.onCreateApplication());
		vscode.commands.registerCommand('servicebuilderExplorer.configDataSource', (resource) => this.onConfigDataSource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployApplication', (resource) => this.deployApplication(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createModule', (resource) => this.onCreateModule(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployModule', (resource) => this.deployModule(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createQueryService', (resource) => this.onCreateService(resource, 'query'));
		vscode.commands.registerCommand('servicebuilderExplorer.createSqlService', (resource) => this.onCreateService(resource, 'sql'));
		vscode.commands.registerCommand('servicebuilderExplorer.createCrudService', (resource) => this.onCreateService(resource, 'crud'));
		vscode.commands.registerCommand('servicebuilderExplorer.generateCrud', (resource) => this.onGenerateCrud(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genQueryInputOutput', (resource) => this.genQueryInputOutput(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genQueryInputOutputBindings', (resource) => this.genQueryInputOutputBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genSqlInputOutput', (resource) => this.genSqlInputOutput(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genSqlInputOutputBindings', (resource) => this.genSqlInputOutputBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genCrudObject', (resource) => this.genCrudObject(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genCrudInputOutputBindings', (resource) => this.genCrudInputOutputBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genCrudTableBindings', (resource) => this.genCrudTableBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployService', (resource) => this.deployService(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.addTest', (resource) => this.addTest(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.duplicateTest', (resource) => this.duplicateTest(resource));

		// // this.provider.watch(this.workspaceUri, { recursive: true, excludes:[]} );
		// const fsw = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.rootPath, '*'), false, false, false);
	}

	private openResource(resource: Entry): void {
		vscode.window.showTextDocument(resource.uri, {preview: !this.doubleClick.check(resource)});
	}

	openDataSource(app: Entry): void {
		vscode.window.showTextDocument(vscode.Uri.joinPath(app.uri, 'src', 'datasource.json'), {preview: false});
	}

	private refresh(): void {
		this.dataProvider.refresh();
	}

	private onCreateApplication(): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "application name", prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					vscode.window.showQuickPick(['mysql'], {ignoreFocusOut: true, placeHolder: "database type", canPickMany: false}).then( (dbType) => {
						if (dbType) {
							this.createApplication(name, dbType);
						} else {
							vscode.window.showErrorMessage("no database type selected.");
						}
					});
				} else {
					vscode.window.showErrorMessage("no application name specified.");
				}
			});
	}

	onConfigDataSource(app: Entry): void {
		this.openDataSource(app);
	}

	private onCreateModule(app: Entry): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "module name", prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.createModule(app, name);
				}
			});
	}

	private onCreateService(mod: Entry, serviceType: string): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: `${serviceType} service name`, prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.createService(mod, name, serviceType);
				}
			});
	}

	async createApplication(appName: string, dbType: string): Promise<void> {
		try {
			const app = await this.appService.createApplication(this.dataProvider.workfolder, appName, dbType);
			this.refresh();
			this.treeView.reveal(app, {expand: 2, focus: true, select: true});	
		} catch (error) {
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
			console.log("deploy application");
	}

	async createModule(app: Entry, modName: string): Promise<void> {
		try {
			const mod = await this.appService.createModule(app, modName);
			this.dataProvider.fire(app);
			this.treeView.reveal(mod, {expand: 2, focus: true, select: true});	
		} catch (error) {
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

	private deployModule(mod: Entry): void {
		console.log("deploy module");
	}


	async createService(mod: Entry, name: string, type: string): Promise<void> {
		try {
			const service = await this.appService.createService(mod, name, type);
			this.dataProvider.fire(mod);
			this.treeView.reveal(service, {expand: 2, focus: true, select: true});	
		} catch (error) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Service name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}


	private deployService(service: Entry): void {
		console.log("deploy service");
	}

	async delete(entry: Entry): Promise<void> {
		try {
			await this.appService.delete(entry.uri);
			if (entry.parent) {
				this.dataProvider.fire(entry.parent);
				this.treeView.reveal(entry.parent, {focus: true, select: true});
			} else {
				this.refresh();
			}	
		} catch (error) {
			vscode.window.showErrorMessage(error.message);
		}
	}

	private onRename(entry: Entry): void {
		this.treeView.reveal(entry, {select: true});
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: `new ${entry.type} name`, prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.rename(entry, name);
				}
			});
	}

	async rename(entry: Entry, name: string): Promise<void> {
		try {
			let newEntry: Entry;
			if (entry.parent) { 
				await this.appService.rename(entry.uri, vscode.Uri.joinPath(entry.parent.uri, name));
				this.dataProvider.fire(entry.parent);
				newEntry = this.appService.defaultEntry(name, entry.fileType, entry.parent);
			} else {
				await this.appService.rename(entry.uri, vscode.Uri.joinPath(this.dataProvider.workfolder.uri, name));
				this.refresh();
				newEntry = this.appService.defaultEntry(name, entry.fileType, this.dataProvider.workfolder);
				newEntry.parent = null;
			}
			this.treeView.reveal(newEntry, {focus: true});	
		} catch (error) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}

	private copy(entry: Entry) {
		console.log('copy ' + entry.type);
	}

	private paste(entry: Entry) {
		console.log('paste ' + entry.type);
	}

	private onGenerateCrud(module: Entry) {
		console.log('generate CRUD ...');
	}

	genQueryInputOutput(service: Entry) {
		console.log("generate query input and output");
	}

	genQueryInputOutputBindings(service: Entry) {
		console.log("generate query input and output bindings");
	}

	genSqlInputOutput(service: Entry) {
		console.log("generate sql input and output");
	}

	genSqlInputOutputBindings(service: Entry) {
		console.log("generate sql input and output bindings");	
	}

	genCrudObject(service: Entry) {
		console.log("generate crud object");
	}

	genCrudInputOutputBindings(service: Entry) {
		console.log("generate crud input and output bindings");
	}

	genCrudTableBindings(service: Entry) {
		console.log("generate crud table bindings");
	}

	async addTest(testFolder: Entry): Promise<void> {
		try {
			const testFile = await this.appService.addTest(testFolder);
			this.dataProvider.fire(testFolder);
			this.treeView.reveal(testFile, {focus: true, select: false});
			vscode.window.showTextDocument(testFile.uri, {preview: false});
		} catch(error){
			vscode.window.showErrorMessage(error.message);
		}
	}

	async duplicateTest(test: Entry): Promise<void> {
		try {
			const testFile = await this.appService.duplicateTest(test);
			if (!testFile.parent) {
				return;
			}
			this.dataProvider.fire(testFile.parent);
			this.treeView.reveal(testFile, {focus: true, select: false});
			vscode.window.showTextDocument(testFile.uri, {preview: false});
		} catch(error){
			vscode.window.showErrorMessage(error.message);
		}
	}

}

export class DoubleClick {
	clickInterval = 500;
	lastClick = 0;
	lastItem: any = null;

	constructor(clickInterval?: number) {
		if (clickInterval) {
			this.clickInterval = clickInterval;
		}
	}

	check(item: any): boolean {
		const thisClick = new Date().getTime();
		let result = false;
		if ( item === this.lastItem && (thisClick  - this.lastClick) < this.clickInterval ) {
			result = true;
		}
		this.lastClick = thisClick;
		this.lastItem = item;
		return result;
	}

}

export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

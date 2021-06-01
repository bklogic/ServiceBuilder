import * as vscode from 'vscode';
import { TreeDataProvider } from "vscode";
import {ApplicationService, Entry, EntryType, ServiceType} from "./applicationService";


export class ApplicationDataProvider implements TreeDataProvider<Entry> {
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | void> = new vscode.EventEmitter<Entry | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Entry | undefined | void> = this._onDidChangeTreeData.event;
	private appService: ApplicationService;

	constructor() {
		this.appService = new ApplicationService();
	}

	getTreeItem(element: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
		const treeItem = new vscode.TreeItem(
			element.uri, 
			(element.fileType === vscode.FileType.Directory) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
		);
		if (element.fileType === vscode.FileType.File) {
			treeItem.command = { command: 'servicebuilderExplorer.openResource', title: "Open File", arguments: [element] };
		}
		treeItem.id = element.uri.path;
		treeItem.description = false;
		treeItem.contextValue = element.type.toString();
		return treeItem;
	}

	getChildren(element?: Entry): Promise<Entry[]> {
		// if no workspace folders
		if (!vscode.workspace.workspaceFolders) {
			// return new Promise<Entry[]>( (resolve, reject) => { resolve([]); } );
			return Promise.resolve([]);
		}
		// otherwise, set element to workspace folder if element is passed in
		if (!element) {
			const workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
			element = { 
				uri: workspaceFolder.uri, 
				type: EntryType.Workfolder,
				serviceType: null, 
				componentType: null, 
				fileType: vscode.FileType.Directory, 
				name: 'workspace',
				parent: null,
				seqNo: 0
			};
		}
		// return chilren of element
		return this.appService.getChildren(element);
	}

	getParent?(element: Entry): vscode.ProviderResult<Entry> {
		throw new Error('Method not implemented.');
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	fire(entry: Entry): void {
		this._onDidChangeTreeData.fire(entry);
	}

	async getChild(entry: Entry, childName: string): Promise<Entry | undefined> {
		const children = await this.getChildren(entry);
		const child = await children.find(e => {e.name === childName;});
		return child;
	}

	async getModule(name: string, app: Entry): Promise<Entry | undefined> {
		// src
		const src = await this.getChild(app, 'src');
		if (!src) { return undefined; }
		// module
		const mod = await this.getChild(src, name);
		return mod;
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

		// // this.provider.watch(this.workspaceUri, { recursive: true, excludes:[]} );
		// const fsw = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.rootPath, '*'), false, false, false);
	}

	private openResource(resource: Entry): void {
		vscode.window.showTextDocument(resource.uri, {preview: !this.doubleClick.check(resource)});
	}

	private openDataSource(app: Entry): void {
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
		console.log("add data source. open datasource.file");
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
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage('No open workspace folder');
			return;
		}
		const appUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, appName);
		await this.appService.createApplication(appUri, appName, dbType);
		this.refresh();
	}

	private deployApplication(app: Entry): void {
		console.log("deploy application");
	}

	async createModule(app: Entry, modName: string): Promise<void> {
		await this.appService.createModule(app.uri, modName);
		this.refresh();

		const entry = await this.dataProvider.getModule(modName, app);
		if (entry) {
			this.treeView.reveal(entry, {expand: true, focus: true});
		}	
	}

	private deployModule(mod: Entry): void {
		console.log("deploy module");
	}


	async createService(mod: Entry, name: string, type: string): Promise<void> {
		await this.appService.createService(mod.uri, name, type);
		this.refresh();
	}


	private deployService(service: Entry): void {
		console.log("deploy service");
	}

	private delete(entry: Entry): void {
		this.appService.delete(entry.uri);
		this.refresh();
	}

	private onRename(entry: Entry): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: `new ${entry.type} name`, prompt: "must be an alphanumberic"})
			.then( name => {
				if (name && entry.parent) {
					this.rename(entry.uri, vscode.Uri.joinPath(entry.parent.uri, name));
				}
			});
	}

	private rename(uri: vscode.Uri, newUri: vscode.Uri): void {
		this.appService.rename(uri, newUri);
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

	addTest(testFolder: Entry) {
		try {
			this.appService.addTest(testFolder);
			this.refresh();
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
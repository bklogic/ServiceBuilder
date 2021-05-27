import * as vscode from 'vscode';
import { TreeDataProvider } from "vscode";
import {ApplicationService, Entry, EntryType, ServiceType} from "./applicationService"


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
		treeItem.id = element.uri.path
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
			}
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
		const children = await this.getChildren(entry)
		const child = await children.find(e => {e.name === childName})
		return child
	}

	async getModule(name: string, app: Entry): Promise<Entry | undefined> {
		// src
		const src = await this.getChild(app, 'src')
		if (!src) return undefined
		// module
		const mod = await this.getChild(src, name)
		return mod
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
		this.treeView = vscode.window.createTreeView('servicebuilderExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true })
		context.subscriptions.push(this.treeView);
		vscode.commands.registerCommand('servicebuilderExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.refresh', () => this.refresh());
		vscode.commands.registerCommand('servicebuilderExplorer.createApplication', () => this.onCreateApplication());
		vscode.commands.registerCommand('servicebuilderExplorer.deployApplication', (resource) => this.deployApplication(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createModule', (resource) => this.onCreateModule(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployModule', (resource) => this.deployModule(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createQueryService', (resource) => this.onCreateService(resource, 'query'));
		vscode.commands.registerCommand('servicebuilderExplorer.createSqlService', (resource) => this.onCreateService(resource, 'sql'));
		vscode.commands.registerCommand('servicebuilderExplorer.createCrudService', (resource) => this.onCreateService(resource, 'crud'));
		vscode.commands.registerCommand('servicebuilderExplorer.rename', (resource) => this.onRename(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.delete', (resource) => this.delete(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.copy', (resource) => this.copy(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.paste', (resource) => this.paste(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.generate', (resource) => this.onGenerateCrud(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genQueryInputOutput', (resource) => this.genQueryInputOutput(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.bindQueryInputOutput', (resource) => this.bindQueryInputOutput(resource));

		// // this.provider.watch(this.workspaceUri, { recursive: true, excludes:[]} );
		// const fsw = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.rootPath, '*'), false, false, false);
	}

	private openResource(resource: Entry): void {
		vscode.window.showTextDocument(resource.uri, {preview: !this.doubleClick.check(resource)});
	}

	private refresh(): void {
		this.dataProvider.refresh();
	}

	private onCreateApplication(): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "application name", prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.createApplication(name);
				}
			});
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
					this.createService(mod.uri, name, serviceType);
				}
			});
	}

	private createApplication(appName: string): void {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage('No open workspace folder');
			return;
		}
		const appUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, appName);
		this.appService.createApplication(appUri, appName)
			// this.refresh();
		}

	private deployApplication(app: Entry): void {

	}

	async createModule(app: Entry, modName: string): Promise<void> {
		await this.appService.createModule(app.uri, modName)
		const entry = await this.dataProvider.getModule(modName, app)
		if (entry) {
			this.treeView.reveal(entry, {expand: true, focus: true})
		}	
	}

	private deployModule(app: Entry): void {

	}


	private createService(modUri: vscode.Uri, name: string, type: string): void {
		this.appService.createService(modUri, name, type)
		// this.refresh();
	}


	private deployService(app: Entry): void {

	}

	private delete(entry: Entry): void {
		this.appService.delete(entry.uri);
		this.dataProvider.fire(entry);
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
		console.log("generate query input and output")
	}

	bindQueryInputOutput(service: Entry) {
		console.log("bind query input and output")		
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
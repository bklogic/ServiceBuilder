import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider } from "vscode";
import {ApplicationService, Entry, EntryType} from "./applicationService";


export class ApplicationDataProvider implements TreeDataProvider<Entry> {
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | void> = new vscode.EventEmitter<Entry | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Entry | undefined | void> = this._onDidChangeTreeData.event;
	private appService: ApplicationService;
	workfolder: Entry;

	constructor(appService: ApplicationService) {
		this.appService = appService;
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
import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider } from "vscode";
import {ApplicationDataService} from "./applicationDataService";
import {Entry, EntryType} from './applicationModel';


export class ApplicationDataProvider implements TreeDataProvider<Entry> {
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | void> = new vscode.EventEmitter<Entry | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Entry | undefined | void> = this._onDidChangeTreeData.event;
	private appDataService: ApplicationDataService;
	workfolder: Entry;

	constructor() {
		this.appDataService = new ApplicationDataService();
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
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'app-folder.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'app-folder.svg')
				};
				treeItem.tooltip = 'application';
				break;
			case EntryType.Module:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'mod-folder.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'mod-folder.svg')
				};
				treeItem.tooltip = 'module';
				break;
			case EntryType.QueryService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'query-service.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'query-service.svg')
				};
				treeItem.tooltip = 'query service';
				break;
			case EntryType.SqlService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'sql-service.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'sql-service.svg')
				};
				treeItem.tooltip = 'sql service';
				break;			
			case EntryType.CrudService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'crud-service.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'crud-service.svg')
				};
				treeItem.tooltip = 'crud service';
				break;			
			case EntryType.Read:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'book.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'book.svg')
				};
				treeItem.tooltip = 'crud read';
				break;
			case EntryType.Write:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'edit.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'edit.svg')
				};
				treeItem.tooltip = 'crud write';
				break;
			case EntryType.Tests:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'beaker.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'beaker.svg')
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
		return this.appDataService.getChildren(element);
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

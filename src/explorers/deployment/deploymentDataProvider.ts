import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider } from "vscode";
import {DeploymentDataService} from "./deploymentDataService";
import {Item, ItemType} from './deploymentModel';


export class DeploymentDataProvider implements TreeDataProvider<Item> {
	private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined | void> = new vscode.EventEmitter<Item | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Item | undefined | void> = this._onDidChangeTreeData.event;
	private deploymentDataService: DeploymentDataService;

	constructor() {
		this.deploymentDataService = new DeploymentDataService();
	}

	getTreeItem(element: Item): vscode.TreeItem | Thenable<vscode.TreeItem> {
		const treeItem = new vscode.TreeItem(
			element.uri, 
			(element.fileType === vscode.FileType.Directory) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
		);
		if (element.fileType === vscode.FileType.File) {
			treeItem.command = { command: 'servicedeploymentExplorer.openResource', title: "Open File", arguments: [element] };
		}
		switch (element.type) {
			case ItemType.DataSources:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'server2.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'server2.svg')
				};
				treeItem.tooltip = '';
				break;
				case ItemType.DataSource:
					treeItem.iconPath = {
						dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'database.svg'), 
						light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'database.svg')
					};
					treeItem.tooltip = 'data source';
					break;
				case ItemType.Applications:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'server.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'server.svg')
				};
				treeItem.tooltip = '';
				break;
			case ItemType.Application:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'app-folder.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'app-folder.svg')
				};
				treeItem.tooltip = 'application';
				break;
			case ItemType.Module:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', 'mod-folder.svg'), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', 'mod-folder.svg')
				};
				treeItem.tooltip = 'module';
				break;
			case ItemType.QueryService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', ((element.state === 'valid') ? 'query-service.svg' : 'invalid-query.svg')), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', ((element.state === 'valid') ? 'query-service.svg' : 'invalid-query.svg'))
				};
				treeItem.tooltip = 'query service';
				break;
			case ItemType.SqlService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', ((element.state === 'valid') ? 'sql-service.svg' : 'invalid-sql.svg')), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', ((element.state === 'valid') ? 'sql-service.svg' : 'invalid-sql.svg'))
				};
				treeItem.tooltip = 'sql service';
				break;			
			case ItemType.CrudService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', '..', 'resources','dark', ((element.state === 'valid') ? 'crud-service.svg' : 'invalid-crud.svg')), 
					light: path.join(__filename, '..', '..', '..', '..', 'resources','light', ((element.state === 'valid') ? 'crud-service.svg' : 'invalid-crud.svg'))
				};
				treeItem.tooltip = ((element.state === 'valid') ? '' : 'invalid ') + 'crud service';
				break;		
		}	
		treeItem.id = element.uri;
		treeItem.label = element.name;
		treeItem.description = false;
		const invalidService = ([ItemType.QueryService, ItemType.SqlService, ItemType.CrudService].indexOf(element.type) > -1) && (element.state !== 'valid');
		treeItem.contextValue = (invalidService) ? ItemType.InvalidService.toString() : element.type.toString();
		return treeItem;
	}

	getChildren(element?: Item): Promise<Item[]> {
		return this.deploymentDataService.getChildren(element);
	}

	getParent?(element: Item): vscode.ProviderResult<Item> {
		return element.parent;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	fire(item: Item): void {
		this._onDidChangeTreeData.fire(item);
	}

}

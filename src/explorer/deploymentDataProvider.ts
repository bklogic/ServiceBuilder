import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider } from "vscode";
import {DeploymentService} from "./DeploymentService";
import {Item, ItemType} from './deploymentModel';
import { crudServiceFile } from './contentService';


export class DeploymentDataProvider implements TreeDataProvider<Item> {
	private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined | void> = new vscode.EventEmitter<Item | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Item | undefined | void> = this._onDidChangeTreeData.event;
	private deploymentService: DeploymentService;

	constructor(deploymentService: DeploymentService) {
		this.deploymentService = deploymentService;
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
			case ItemType.Application:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'app-folder.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'app-folder.svg')
				};
				treeItem.tooltip = 'application';
				break;
			case ItemType.Module:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'mod-folder.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'mod-folder.svg')
				};
				treeItem.tooltip = 'module';
				break;
			case ItemType.QueryService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', ((element.state === 'valid') ? 'query-service.svg' : 'invalid-query.svg')), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', ((element.state === 'valid') ? 'query-service.svg' : 'invalid-query.svg'))
				};
				treeItem.tooltip = 'query service';
				break;
			case ItemType.SqlService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', ((element.state === 'valid') ? 'sql-service.svg' : 'invalid-sql.svg')), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', ((element.state === 'valid') ? 'sql-service.svg' : 'invalid-sql.svg'))
				};
				treeItem.tooltip = 'sql service';
				break;			
			case ItemType.CrudService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', ((element.state === 'valid') ? 'crud-service.svg' : 'invalid-crud.svg')), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', ((element.state === 'valid') ? 'crud-service.svg' : 'invalid-crud.svg'))
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

	isInvalidService (type: ItemType, state: string): boolean {
		return ([ItemType.QueryService, ItemType.SqlService, ItemType.CrudService].indexOf(type) > -1) && (state === 'valid');
	}

	getChildren(element?: Item): Promise<Item[]> {
		return this.deploymentService.getChildren(element);
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

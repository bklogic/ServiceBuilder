import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider } from "vscode";
import {DeploymentService} from "./DeploymentService";
import {Item, ItemType} from './deploymentModel';


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
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'window.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'window.svg')
				};
				treeItem.tooltip = 'query service';
				break;
			case ItemType.SqlService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'server-process.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'server-process.svg')
				};
				treeItem.tooltip = 'sql service';
				break;			
			case ItemType.CrudService:
				treeItem.iconPath = {
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'symbol-method.svg'), 
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'symbol-method.svg')
				};
				treeItem.tooltip = 'crud service';
				break;		
        }	
		treeItem.id = element.uri;
		treeItem.label = element.name;
		treeItem.description = false;
		treeItem.contextValue = element.type.toString();
		return treeItem;
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

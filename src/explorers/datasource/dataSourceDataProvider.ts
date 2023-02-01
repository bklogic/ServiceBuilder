import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider } from "vscode";
import {DataSourceItem} from "./dataSourceDataModel";
import {DataSourceDataService} from "./dataSourceDataService";

export class DataSourceDataProvider implements TreeDataProvider<DataSourceItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<DataSourceItem | undefined | void> = new vscode.EventEmitter<DataSourceItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<DataSourceItem | undefined | void> = this._onDidChangeTreeData.event;
    private dataSourceDataService = new DataSourceDataService();

    getTreeItem(element: DataSourceItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		const treeItem = new vscode.TreeItem(element.name);
        treeItem.command = { command: 'servicedeploymentExplorer.openResource', title: "Open File", arguments: [element] };
		treeItem.id = element.uri.path;
		treeItem.label = element.name;
		treeItem.description = '';
		treeItem.contextValue = 'datasource';
        treeItem.tooltip = 'data source';
        treeItem.iconPath = {
            dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'database.svg'), 
            light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'database.svg')
        };

        return treeItem;
    }

    getChildren(element?: DataSourceItem): vscode.ProviderResult<DataSourceItem[]> {
        if (!element) {
            return this.dataSourceDataService.getDataSourceItems();
        } else {
            return [];
        }
    }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

}


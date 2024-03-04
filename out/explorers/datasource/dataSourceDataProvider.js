"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceDataProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const dataSourceDataService_1 = require("./dataSourceDataService");
class DataSourceDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.dataSourceDataService = new dataSourceDataService_1.DataSourceDataService();
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.name);
        treeItem.command = { command: 'servicedeploymentExplorer.openResource', title: "Open File", arguments: [element] };
        treeItem.id = element.uri.path;
        treeItem.label = element.name;
        treeItem.description = '';
        treeItem.contextValue = 'datasource';
        treeItem.tooltip = 'data source';
        treeItem.iconPath = {
            dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'database.svg'),
            light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'database.svg')
        };
        return treeItem;
    }
    getChildren(element) {
        if (!element) {
            return this.dataSourceDataService.getDataSourceItems();
        }
        else {
            return [];
        }
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
exports.DataSourceDataProvider = DataSourceDataProvider;
//# sourceMappingURL=dataSourceDataProvider.js.map
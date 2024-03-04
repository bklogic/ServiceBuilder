"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentDataProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const deploymentDataService_1 = require("./deploymentDataService");
const deploymentModel_1 = require("./deploymentModel");
class DeploymentDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.deploymentDataService = new deploymentDataService_1.DeploymentDataService();
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.uri, (element.fileType === vscode.FileType.Directory) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        if (element.fileType === vscode.FileType.File) {
            treeItem.command = { command: 'servicedeploymentExplorer.openResource', title: "Open File", arguments: [element] };
        }
        switch (element.type) {
            case deploymentModel_1.ItemType.DataSources:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'server2.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'server2.svg')
                };
                treeItem.tooltip = '';
                break;
            case deploymentModel_1.ItemType.DataSource:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'database.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'database.svg')
                };
                treeItem.tooltip = 'data source';
                break;
            case deploymentModel_1.ItemType.Applications:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'server.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'server.svg')
                };
                treeItem.tooltip = '';
                break;
            case deploymentModel_1.ItemType.Application:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'app-folder.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'app-folder.svg')
                };
                treeItem.tooltip = 'application';
                break;
            case deploymentModel_1.ItemType.Module:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'mod-folder.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'mod-folder.svg')
                };
                treeItem.tooltip = 'module';
                break;
            case deploymentModel_1.ItemType.QueryService:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', ((element.state === 'valid') ? 'query-service.svg' : 'invalid-query.svg')),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', ((element.state === 'valid') ? 'query-service.svg' : 'invalid-query.svg'))
                };
                treeItem.tooltip = 'query service';
                break;
            case deploymentModel_1.ItemType.SqlService:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', ((element.state === 'valid') ? 'sql-service.svg' : 'invalid-sql.svg')),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', ((element.state === 'valid') ? 'sql-service.svg' : 'invalid-sql.svg'))
                };
                treeItem.tooltip = 'sql service';
                break;
            case deploymentModel_1.ItemType.CrudService:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', ((element.state === 'valid') ? 'crud-service.svg' : 'invalid-crud.svg')),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', ((element.state === 'valid') ? 'crud-service.svg' : 'invalid-crud.svg'))
                };
                treeItem.tooltip = ((element.state === 'valid') ? '' : 'invalid ') + 'crud service';
                break;
        }
        treeItem.id = element.uri;
        treeItem.label = element.name;
        treeItem.description = false;
        const invalidService = ([deploymentModel_1.ItemType.QueryService, deploymentModel_1.ItemType.SqlService, deploymentModel_1.ItemType.CrudService].indexOf(element.type) > -1) && (element.state !== 'valid');
        treeItem.contextValue = (invalidService) ? deploymentModel_1.ItemType.InvalidService.toString() : element.type.toString();
        return treeItem;
    }
    getChildren(element) {
        return this.deploymentDataService.getChildren(element);
    }
    getParent(element) {
        return element.parent;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    fire(item) {
        if (item) {
            this._onDidChangeTreeData.fire(item);
        }
    }
}
exports.DeploymentDataProvider = DeploymentDataProvider;
//# sourceMappingURL=deploymentDataProvider.js.map
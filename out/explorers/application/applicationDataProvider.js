"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationDataProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const applicationDataService_1 = require("./applicationDataService");
const applicationModel_1 = require("./applicationModel");
class ApplicationDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.appDataService = new applicationDataService_1.ApplicationDataService();
        this.workfolder = this.getWorkfolderEntry();
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.uri, (element.fileType === vscode.FileType.Directory) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        if (element.fileType === vscode.FileType.File) {
            treeItem.command = { command: 'servicebuilderExplorer.openResource', title: "Open File", arguments: [element] };
        }
        switch (element.type) {
            case applicationModel_1.EntryType.Application:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'app-folder.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'app-folder.svg')
                };
                treeItem.tooltip = 'application';
                break;
            case applicationModel_1.EntryType.Module:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'mod-folder.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'mod-folder.svg')
                };
                treeItem.tooltip = 'module';
                break;
            case applicationModel_1.EntryType.QueryService:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'query-service.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'query-service.svg')
                };
                treeItem.tooltip = 'query service';
                break;
            case applicationModel_1.EntryType.SqlService:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'sql-service.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'sql-service.svg')
                };
                treeItem.tooltip = 'sql service';
                break;
            case applicationModel_1.EntryType.CrudService:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'crud-service.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'crud-service.svg')
                };
                treeItem.tooltip = 'crud service';
                break;
            case applicationModel_1.EntryType.Read:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'book.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'book.svg')
                };
                treeItem.tooltip = 'crud read';
                break;
            case applicationModel_1.EntryType.Write:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'edit.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'edit.svg')
                };
                treeItem.tooltip = 'crud write';
                break;
            case applicationModel_1.EntryType.Tests:
                treeItem.iconPath = {
                    dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'beaker.svg'),
                    light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'beaker.svg')
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
    getChildren(element) {
        // otherwise, set element to workspace folder if element is passed in
        if (!element) {
            element = this.workfolder;
        }
        // return chilren of element
        return this.appDataService.getChildren(element);
    }
    getParent(element) {
        return element.parent;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    fire(entry) {
        this._onDidChangeTreeData.fire(entry);
    }
    getWorkfolderEntry() {
        // if no workspace folders
        if (!vscode.workspace.workspaceFolders) {
            // throw Error("No workfolder");
            return {};
        }
        // otherwise, set element to workspace folder if element is passed in
        const workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
        const entry = {
            uri: workspaceFolder.uri,
            type: applicationModel_1.EntryType.Workfolder,
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
exports.ApplicationDataProvider = ApplicationDataProvider;
//# sourceMappingURL=applicationDataProvider.js.map
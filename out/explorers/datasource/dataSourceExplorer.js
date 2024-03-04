"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceExplorer = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const dataSourceDataProvider_1 = require("./dataSourceDataProvider");
const dataSourceExplorerService_1 = require("./dataSourceExplorerService");
class DataSourceExplorer {
    constructor(context, builderClient) {
        // set up tree view
        this.dataProvider = new dataSourceDataProvider_1.DataSourceDataProvider();
        this.treeView = vscode.window.createTreeView('servicebuilderDataSourceExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
        context.subscriptions.push(this.treeView);
        // instantiate explorer service
        this.explorerService = new dataSourceExplorerService_1.DataSourceExplorerService(context, builderClient);
        // register commands
        vscode.commands.registerCommand('servicebuilderDataSourceExplorer.refresh', (resource) => this.refresh());
        vscode.commands.registerCommand('servicebuilderDataSourceExplorer.addDataSource', (resource) => this.addDataSource());
        vscode.commands.registerCommand('servicebuilderDataSourceExplorer.testDataSource', (resource) => this.testDataSource(resource));
        vscode.commands.registerCommand('servicebuilderDataSourceExplorer.deployDataSource', (resource) => this.deployDataSource(resource));
        vscode.commands.registerCommand('servicebuilderDataSourceExplorer.renameDataSource', (resource) => this.renameDataSource(resource));
        vscode.commands.registerCommand('servicebuilderDataSourceExplorer.deleteDataSource', (resource) => this.deleteDataSource(resource));
    }
    refresh() {
        this.dataProvider.refresh();
    }
    addDataSource() {
        return __awaiter(this, void 0, void 0, function* () {
            // collect data source name
            const dataSourceName = yield vscode.window.showInputBox({
                placeHolder: 'Data source name',
                prompt: "Enter a name for data source"
            });
            if (!dataSourceName) {
                vscode.window.setStatusBarMessage('No data source name entered.');
                return;
            }
            // collect database type
            const items = ['mysql', 'postgresql'];
            const dbType = yield vscode.window.showQuickPick(items, {
                placeHolder: 'Database type',
                canPickMany: false
            });
            if (!dbType) {
                vscode.window.setStatusBarMessage('No database type picked.');
                return;
            }
            // create data source
            try {
                yield this.explorerService.createDataSource(dataSourceName, dbType);
                vscode.window.setStatusBarMessage('Data source created.');
            }
            catch (err) {
                vscode.window.showErrorMessage(`Failed to create data source: ${err.message}`);
            }
            // refresh explore
            this.refresh();
        });
    }
    testDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.setStatusBarMessage('Data source test in progress ...');
            //
            try {
                const message = yield this.explorerService.testDataSource(item);
                if (message) {
                    vscode.window.setStatusBarMessage(message);
                }
                else {
                    vscode.window.setStatusBarMessage('Data source test succeeded.');
                }
            }
            catch (err) {
                util.showErrorStatus('Test data source error.', err.message);
                vscode.window.setStatusBarMessage('');
            }
        });
    }
    deployDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.setStatusBarMessage('Deploying data source ...');
            //
            try {
                yield this.explorerService.deployDataSource(item);
                vscode.window.setStatusBarMessage('Data source deployed.');
            }
            catch (err) {
                util.showErrorStatus('Data source deployment failed.', err.message);
            }
        });
    }
    renameDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            // collect new name
            const newName = yield vscode.window.showInputBox({
                placeHolder: 'New Data source name',
                prompt: "Enter a new name for data source"
            });
            if (!newName) {
                vscode.window.setStatusBarMessage('No data source name entered.');
                return;
            }
            // change name
            try {
                yield this.explorerService.renameDataSource(item, newName);
                vscode.window.setStatusBarMessage('Data source renamed. You need to make sure that applications use the new name.');
                this.refresh();
            }
            catch (err) {
                vscode.window.showErrorMessage(`Data source rename failed: ${err.message}`);
            }
        });
    }
    deleteDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.deleteDataSource(item);
                vscode.window.setStatusBarMessage('Data source deleted.');
                this.refresh();
            }
            catch (err) {
                vscode.window.showErrorMessage(`Data source delete failed: ${err.message}`);
            }
        });
    }
}
exports.DataSourceExplorer = DataSourceExplorer;
//# sourceMappingURL=dataSourceExplorer.js.map
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
exports.DeploymentExplorer = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const deploymentDataProvider_1 = require("./deploymentDataProvider");
const deploymentExplorerService_1 = require("./deploymentExplorerService");
class DeploymentExplorer {
    constructor(context, builderClient) {
        this.doubleClick = new util.DoubleClick();
        this.explorerService = new deploymentExplorerService_1.DeploymentExplorerService(context, builderClient);
        this.dataProvider = new deploymentDataProvider_1.DeploymentDataProvider();
        this.treeView = vscode.window.createTreeView('servicedeploymentExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
        context.subscriptions.push(this.treeView);
        vscode.commands.registerCommand('servicedeploymentExplorer.openResource', (resource) => this.openResource(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.refresh', () => this.refresh());
        vscode.commands.registerCommand('servicedeploymentExplorer.refreshDataSourceList', (resource) => this.refreshDataSourceList(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.refreshDataSource', (resource) => this.refreshDataSource(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.testDataSource', (resource) => this.testDataSource(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.cleanDataSource', (resource) => this.cleanDataSource(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.refreshAppList', (resource) => this.refreshAppList(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.refreshApplication', (resource) => this.refreshApplication(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.loadTest', (resource) => this.loadTest(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.showInvalidatedReason', (resource) => this.showInvalidatedReason(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.viewDataSource', (resource) => this.viewDataSource(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.viewService', (resource) => this.viewService(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.cleanApplication', (resource) => this.cleanApplication(resource));
        vscode.commands.registerCommand('servicedeploymentExplorer.cleanWorkspace', (resource) => this.cleanWorkspace(resource));
    }
    openResource(resource) {
        vscode.window.showTextDocument(resource.fileUri, { preview: !this.doubleClick.check(resource) });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dataProvider.refresh();
        });
    }
    refreshDataSourceList(item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.refreshDataSourceList();
                yield util.sleep(200);
                this.refresh();
                this.treeView.reveal(item, { expand: 2, focus: true, select: true });
                vscode.window.setStatusBarMessage('Data source list refreshed.');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    refreshDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.refreshDataSource(item);
                vscode.window.setStatusBarMessage('Data source refreshed.');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    cleanDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.cleanDataSource(item);
                vscode.window.setStatusBarMessage('Data source cleaned.');
                this.dataProvider.fire(item.parent);
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    testDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.setStatusBarMessage('Data source test in progress ...');
            //
            try {
                const message = yield this.explorerService.testDataSource(item);
                if (message) {
                    vscode.window.setStatusBarMessage(`Failed: ${message}`);
                }
                else {
                    vscode.window.setStatusBarMessage('Succeeded');
                }
            }
            catch (err) {
                util.showErrorStatus('Test data source error.', err.message);
            }
        });
    }
    refreshAppList(apps) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.refreshAppList();
                yield util.sleep(200);
                this.refresh();
                this.treeView.reveal(apps, { expand: 2, focus: true, select: true });
                vscode.window.setStatusBarMessage('Application list refreshed.');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    refreshApplication(app) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.refreshApp(app);
                this.dataProvider.refresh();
                this.treeView.reveal(app, { expand: 2, focus: true, select: true });
                vscode.window.setStatusBarMessage('Application refreshed.');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    loadTest(service) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.reloadTests(service);
                yield util.sleep(100);
                this.dataProvider.fire(service);
                this.treeView.reveal(service, { expand: 2, focus: true, select: true });
                vscode.window.showTextDocument(vscode.Uri.joinPath(service.fileUri, 'tests.http'), { preview: false });
                vscode.window.setStatusBarMessage('Tests generated.');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    showInvalidatedReason(service) {
        return __awaiter(this, void 0, void 0, function* () {
            const reason = yield this.explorerService.getInvalidatedReason(service);
            vscode.window.setStatusBarMessage('Invalidated reason: ' + reason);
        });
    }
    viewDataSource(app) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const docUri = yield this.explorerService.loadDataSource(app);
                vscode.window.showTextDocument(docUri);
                vscode.window.setStatusBarMessage('Data source loaded.');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    cleanApplication(app) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.cleanApplication(app);
                util.sleep(200);
                this.dataProvider.refresh();
                vscode.window.setStatusBarMessage('Application cleaned');
                this.dataProvider.fire(app.parent);
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    cleanWorkspace(explorer) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(explorer);
                yield this.explorerService.cleanWorkspace();
                util.sleep(200);
                this.refresh();
                vscode.window.setStatusBarMessage('Workspace cleaned');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    viewService(service) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const docUri = yield this.explorerService.loadService(service);
                vscode.window.showTextDocument(docUri);
                vscode.window.setStatusBarMessage('Service loaded.');
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
}
exports.DeploymentExplorer = DeploymentExplorer;
//# sourceMappingURL=deploymentExplorer.js.map
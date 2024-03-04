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
exports.ApplicationExplorer = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const applicationDataProvider_1 = require("./applicationDataProvider");
const applicationExplorerService_1 = require("./applicationExplorerService");
const applicationModel_1 = require("./applicationModel");
const workspaceHandler_1 = require("./workspaceHandler");
const serviceHandler_1 = require("./serviceHandler");
class ApplicationExplorer {
    constructor(context, builderClient) {
        this.doubleClick = new util.DoubleClick();
        this.context = context;
        this.explorerService = new applicationExplorerService_1.ApplicationExplorerService();
        this.builderService = builderClient.builderService;
        this.dataProvider = new applicationDataProvider_1.ApplicationDataProvider();
        this.treeView = vscode.window.createTreeView('servicebuilderExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
        context.subscriptions.push(this.treeView);
        new workspaceHandler_1.WorkspaceHandler(context, builderClient.builderService);
        new serviceHandler_1.ServiceHandler(builderClient, this.dataProvider, this.treeView);
        vscode.commands.registerCommand('servicebuilderExplorer.openResource', (resource) => this.openResource(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.refresh', () => this.refresh());
        vscode.commands.registerCommand('servicebuilderExplorer.rename', (resource) => this.onRename(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.delete', (resource) => this.delete(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.copy', (resource) => this.copy(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.paste', (resource) => this.paste(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.createApplication', () => this.onCreateApplication());
        vscode.commands.registerCommand('servicebuilderExplorer.deployApplication', (resource) => this.deployApplication(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.createModule', (resource) => this.onCreateModule(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.deployModule', (resource) => this.deployModule(resource));
    }
    openResource(resource) {
        vscode.window.showTextDocument(resource.uri, { preview: !this.doubleClick.check(resource) });
    }
    refresh() {
        this.dataProvider.refresh();
    }
    onCreateApplication() {
        vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: "application name", prompt: "must be an alphanumberic" })
            .then(name => {
            if (name) {
                vscode.window.showQuickPick(['mysql', 'postgresql'], { ignoreFocusOut: true, placeHolder: "database type", canPickMany: false }).then((dbType) => {
                    if (dbType) {
                        this.createApplication(name, dbType);
                    }
                    else {
                        vscode.window.setStatusBarMessage("No database type selected.");
                    }
                });
            }
            else {
                vscode.window.setStatusBarMessage("No application name specified.");
            }
        });
    }
    onCreateModule(app) {
        vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: "module name", prompt: "must be an alphanumberic" })
            .then(name => {
            if (name) {
                this.createModule(app, name);
            }
        });
    }
    createApplication(appName, dbType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // clear status message
                vscode.window.setStatusBarMessage('');
                // create application
                const workspace = yield util.readWorkspace(this.context);
                const versions = yield this.builderService.getVersions(workspace.builderEndpoint);
                const app = yield this.explorerService.createApplication(this.dataProvider.workfolder, appName, dbType, versions);
                // reveal
                this.refresh();
                this.treeView.reveal(app, { expand: 2, focus: true, select: true });
                // inform user
                vscode.window.setStatusBarMessage('application is created.');
                return app;
            }
            catch (error) {
                let message;
                switch (error.code) {
                    case 'FileExists':
                        message = 'Application name exists.';
                        break;
                    default:
                        message = error.message;
                }
                vscode.window.showErrorMessage(message);
            }
        });
    }
    deployApplication(app) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'deploying application'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // zip application
                    const appUri = yield util.applicationUriForApplication(app.uri.path);
                    const archive = yield util.getApplicationArchive(app.uri);
                    const result = yield this.builderService.deployApplication(appUri, archive);
                    vscode.window.setStatusBarMessage('application is deployed.');
                }
                catch (error) {
                    util.showErrorStatus('Failed to deploy application.', error.message);
                }
            }));
        });
    }
    redeployApplication(app, newApp) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'redeploying application'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // get app uri
                    const appUri = yield util.applicationUriForApplication(app.uri.path);
                    // undeploy original application
                    yield this.builderService.undeployApplication(appUri);
                    // deploy new application
                    const newAppUri = yield util.applicationUriForApplication(newApp.uri.path);
                    const archive = yield util.getApplicationArchive(newApp.uri);
                    const result = yield this.builderService.deployApplication(newAppUri, archive);
                    // inform user
                    vscode.window.setStatusBarMessage('Application is redeployed.');
                }
                catch (error) {
                    vscode.window.setStatusBarMessage('Failed to redeploy application: ' + error.message);
                }
            }));
        });
    }
    undeployApplication(app) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'undeploying application'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // zip application
                    const appUri = yield util.applicationUriForApplication(app.uri.path);
                    // call service
                    yield this.builderService.undeployApplication(appUri);
                    // inform user
                    vscode.window.setStatusBarMessage('application is undeployed.');
                }
                catch (error) {
                    console.error('Error in undeploying application', error);
                    vscode.window.setStatusBarMessage('Failed to undeploy application: ' + error.message);
                }
            }));
        });
    }
    createModule(app, modName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // clear status message
                vscode.window.setStatusBarMessage('creating module: ' + modName);
                // create module
                const mod = yield this.explorerService.createModule(app, modName);
                // reveal
                this.dataProvider.fire(app);
                this.treeView.reveal(mod, { expand: 2, focus: true, select: true });
                // deploy module
                yield this.deployModule(mod);
                // inform user
                vscode.window.setStatusBarMessage('Module is created.');
            }
            catch (error) {
                let message;
                switch (error.code) {
                    case 'FileExists':
                        message = 'Module name exists.';
                        break;
                    default:
                        message = error.message;
                }
                vscode.window.showErrorMessage(message);
            }
        });
    }
    deployModule(mod) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'deploying module'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // zip module
                    const appUri = yield util.applicationUriForModule(mod.uri.path);
                    const archive = yield util.getArchive(mod.uri.fsPath);
                    // call service
                    yield this.builderService.deployModule(appUri, mod.name, archive);
                    // inform user
                    vscode.window.setStatusBarMessage('module is deployed.');
                }
                catch (error) {
                    vscode.window.setStatusBarMessage('Failed to deploy module: ' + error.message);
                }
            }));
        });
    }
    /**
     * Redeploy module as new module
     * @param mod original module
     * @param newMod new module
     */
    redeployModule(mod, newMod) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'redeploying module'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // get app uri
                    const appUri = yield util.applicationUriForModule(mod.uri.path);
                    // undeploy original module
                    yield this.builderService.undeployModule(appUri, mod.name);
                    // deploy new module
                    const archive = yield util.getArchive(newMod.uri.fsPath);
                    yield this.builderService.deployModule(appUri, newMod.name, archive);
                    // inform user
                    vscode.window.setStatusBarMessage('module is redeployed.');
                }
                catch (error) {
                    vscode.window.setStatusBarMessage('Failed to redeploy module: ' + error.message);
                }
            }));
        });
    }
    undeployModule(mod) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'undeploying module'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // zip module
                    const appUri = yield util.applicationUriForModule(mod.uri.path);
                    // call service
                    yield this.builderService.undeployModule(appUri, mod.name);
                    // inform user
                    vscode.window.setStatusBarMessage('module is undeployed.');
                }
                catch (error) {
                    console.error('Error in undeploying module', error);
                    vscode.window.setStatusBarMessage('Failed to undeploy module: ' + error.message);
                }
            }));
        });
    }
    delete(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.explorerService.delete(entry.uri);
                if (entry.parent) {
                    const parent = (entry.parent.name === 'src') ? entry.parent.parent : entry.parent;
                    if (parent === null) {
                        vscode.window.showErrorMessage("Parent is null. Should never happen.");
                        return;
                    }
                    ;
                    this.dataProvider.fire(parent);
                    this.treeView.reveal(parent, { focus: true, select: true });
                }
                else {
                    this.refresh();
                }
            }
            catch (error) {
                vscode.window.setStatusBarMessage('Failed to delete item: ' + error.message);
            }
        });
    }
    onRename(entry) {
        this.treeView.reveal(entry, { select: true });
        vscode.window.showInputBox({
            ignoreFocusOut: true, placeHolder: `new ${entry.type} name`, value: entry.name, prompt: "Enter a new name. Must be an alphanumberic."
        })
            .then(name => {
            if (name) {
                this.rename(entry, name);
            }
        });
    }
    rename(entry, name) {
        return __awaiter(this, void 0, void 0, function* () {
            // get target uri
            let targetUri;
            if (entry.parent) {
                targetUri = vscode.Uri.joinPath(entry.parent.uri, name);
            }
            else { // application
                targetUri = vscode.Uri.joinPath(this.dataProvider.workfolder.uri, name);
            }
            // check target exists
            if (yield this.explorerService.fileExists(targetUri)) {
                vscode.window.setStatusBarMessage('target name exists');
                return;
            }
            // rename
            try {
                yield this.explorerService.rename(entry.uri, targetUri);
            }
            catch (error) {
                vscode.window.setStatusBarMessage('Failed to rename item: ' + error.message);
                return;
            }
            // redeploy
            const newEntry = {
                uri: targetUri,
                name: name,
                type: entry.type,
                fileType: entry.fileType,
                parent: entry.parent
            };
            yield this.redeploy(entry, newEntry);
            // show
            if (!entry.parent) {
                this.dataProvider.refresh();
            }
            else if (entry.parent.name === 'src') {
                this.dataProvider.fire(entry.parent.parent || entry.parent);
            }
            else {
                this.dataProvider.fire(entry.parent);
            }
        });
    }
    redeploy(entry, newEntry) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (entry.type) {
                case applicationModel_1.EntryType.Application:
                    const appUri = vscode.Uri.joinPath(newEntry.uri, 'src', 'application.json');
                    const app = yield util.readJsonFile(appUri);
                    app.name = newEntry.name;
                    yield util.writeJsonFile(appUri, app);
                    yield this.resavePassword(entry, newEntry);
                    yield this.redeployApplication(entry, newEntry);
                    break;
                case applicationModel_1.EntryType.Module:
                    const modUri = vscode.Uri.joinPath(newEntry.uri, 'module.json');
                    const mod = yield util.readJsonFile(modUri);
                    mod.name = newEntry.name;
                    yield util.writeJsonFile(modUri, mod);
                    yield this.redeployModule(entry, newEntry);
                    break;
                case applicationModel_1.EntryType.QueryService:
                case applicationModel_1.EntryType.SqlService:
                case applicationModel_1.EntryType.CrudService:
                    const serviceUri = vscode.Uri.joinPath(newEntry.uri, 'service.json');
                    const service = yield util.readJsonFile(serviceUri);
                    service.name = newEntry.name;
                    yield util.writeJsonFile(serviceUri, service);
                    // await this.undeployService(entry);
                    // await this.deployService(newEntry);
                    break;
            }
        });
    }
    resavePassword(app, newApp) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSourceUri = vscode.Uri.joinPath(app.uri, 'src', 'datasource.json');
            const newDataSourceUri = vscode.Uri.joinPath(newApp.uri, 'src', 'datasource.json');
            const password = yield util.retrievePassword(this.context, dataSourceUri.path);
            util.storePassword(this.context, newDataSourceUri.path, password);
        });
    }
    copy(entry) {
        vscode.env.clipboard.writeText(JSON.stringify(entry));
    }
    paste(target) {
        return __awaiter(this, void 0, void 0, function* () {
            // retrieve source
            const text = yield vscode.env.clipboard.readText();
            if (!text) {
                vscode.window.setStatusBarMessage('Nothing to paste.');
                return;
            }
            let source;
            try {
                source = JSON.parse(text);
            }
            catch (error) {
                vscode.window.setStatusBarMessage('No entry to paste');
                return;
            }
            // copy target
            let targetUri;
            if (source.type === applicationModel_1.EntryType.Application && target.type === applicationModel_1.EntryType.Application) {
                targetUri = yield this.explorerService.getCopyTarget(source.name, this.dataProvider.workfolder.uri);
                yield this.explorerService.copy(source.uri, targetUri);
                this.dataProvider.refresh();
            }
            else if (source.type === applicationModel_1.EntryType.Module && target.type === applicationModel_1.EntryType.Application) {
                targetUri = yield this.explorerService.getCopyTarget(source.name, vscode.Uri.joinPath(target.uri, 'src'));
                yield this.explorerService.copy(source.uri, targetUri);
                this.dataProvider.fire(target);
            }
            else if ((source.type === applicationModel_1.EntryType.QueryService
                || source.type === applicationModel_1.EntryType.SqlService
                || source.type === applicationModel_1.EntryType.CrudService) && target.type === applicationModel_1.EntryType.Module) {
                targetUri = yield this.explorerService.getCopyTarget(source.name, target.uri);
                yield this.explorerService.copy(source.uri, targetUri);
                this.dataProvider.fire(target);
            }
            else {
                vscode.window.setStatusBarMessage('Not right target to paste');
            }
        });
    }
}
exports.ApplicationExplorer = ApplicationExplorer;
//# sourceMappingURL=applicationExplorer.js.map
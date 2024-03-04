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
exports.DeploymentExplorerService = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const deploymentModel_1 = require("./deploymentModel");
class DeploymentExplorerService {
    constructor(context, builderClient) {
        this.context = context;
        this.deployService = builderClient.deployService;
    }
    refreshDataSourceList() {
        return __awaiter(this, void 0, void 0, function* () {
            // get local workfolder
            const workfolder = util.getWorkFolder();
            if (!workfolder) {
                return;
            }
            // get data source list
            const dataSources = yield this.deployService.getDataSources();
            // write app list
            yield this.writeDataSourceList(util.devtimeDsUri(), dataSources);
        });
    }
    refreshDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            // get data source
            const dataSource = yield this.deployService.getDataSource(item.uri);
            // write data source
            yield util.writeJsonFile(item.fileUri, dataSource);
        });
    }
    cleanDataSource(item) {
        return __awaiter(this, void 0, void 0, function* () {
            // clean deployed data source
            yield this.deployService.cleanDataSource(item.uri);
            // clean local copy
            yield vscode.workspace.fs.delete(item.fileUri);
        });
    }
    testDataSource(dataSource) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.deployService.testDeployedDataSource(dataSource.uri);
            return (result.succeed) ? null : result.message;
        });
    }
    refreshAppList() {
        return __awaiter(this, void 0, void 0, function* () {
            // get local workfolder
            const workfolder = util.getWorkFolder();
            if (!workfolder) {
                return;
            }
            // get remote workspace
            const workspace = yield this.context.secrets.get('servicebuilder.workspace');
            if (!workspace) {
                vscode.window.setStatusBarMessage('Not connected to workspace.');
                return;
            }
            // get applicationas
            const apps = yield this.deployService.getApplications();
            // write app list
            yield this.writeAppList(util.devtimeAppUri(), apps);
        });
    }
    refreshDeployFolder(deployFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield util.fileExists(deployFolder)) {
                yield vscode.workspace.fs.delete(deployFolder, { recursive: true });
            }
            yield vscode.workspace.fs.createDirectory(deployFolder);
        });
    }
    writeAppList(appsFolder, apps) {
        return __awaiter(this, void 0, void 0, function* () {
            // refresh applications folder
            yield this.refreshDeployFolder(appsFolder);
            // write applications
            for (let app of apps) {
                util.writeJsonFile(vscode.Uri.joinPath(appsFolder, app.name, 'application'), app);
            }
        });
    }
    writeDataSourceList(dataSourcesFolder, dataSources) {
        return __awaiter(this, void 0, void 0, function* () {
            // fresh deployment folder
            yield this.refreshDeployFolder(dataSourcesFolder);
            // write data sources
            for (let datasource of dataSources) {
                const name = util.dataSourceNameFromUri(datasource.uri);
                util.writeJsonFile(vscode.Uri.joinPath(dataSourcesFolder, name), datasource);
            }
        });
    }
    refreshApp(app) {
        return __awaiter(this, void 0, void 0, function* () {
            // refresh application folder
            yield this.refreshAppFolder(app.fileUri);
            // get application aggregate
            const application = yield this.deployService.getApplicationAggregate(app.uri);
            // write application
            this.writeAppAggreagte(application, app.fileUri);
        });
    }
    refreshAppFolder(appFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.workspace.fs.delete(appFolder, { recursive: true });
            yield vscode.workspace.fs.createDirectory(appFolder);
        });
    }
    writeAppAggreagte(app, appUri) {
        return __awaiter(this, void 0, void 0, function* () {
            // application file
            util.writeJsonFile(vscode.Uri.joinPath(appUri, 'application'), app.application);
            // write modules
            for (let mod of app.modules) {
                // write module file
                const modUri = vscode.Uri.joinPath(appUri, mod.module.name);
                vscode.workspace.fs.createDirectory(modUri);
                util.writeJsonFile(vscode.Uri.joinPath(modUri, 'module'), mod.module);
                // write services
                for (let service of mod.services) {
                    const splits = service.uri.split('/');
                    const serviceName = splits[splits.length - 1];
                    const serviceUri = vscode.Uri.joinPath(modUri, serviceName);
                    vscode.workspace.fs.createDirectory(serviceUri);
                    util.writeJsonFile(vscode.Uri.joinPath(serviceUri, 'service'), service);
                }
            }
        });
    }
    reloadTests(service) {
        return __awaiter(this, void 0, void 0, function* () {
            // get workspace
            const workspace = yield util.readWorkspace(this.context);
            if (!workspace) {
                throw new Error('No workspace connection.');
            }
            // get tests
            const tests = yield this.deployService.getTests(service.uri);
            // build tests contents
            let content = ['', '## Tests to run with REST Client for Visual Studio Code', ''];
            for (let test of tests) {
                content = content.concat(this.writeTest(test, workspace.serviceEndpoint, workspace.token.token, service.type));
            }
            // write tests file
            const str = content.join('\n');
            vscode.workspace.fs.writeFile(vscode.Uri.joinPath(service.fileUri, 'tests.http'), util.strToBuffer(str));
        });
    }
    writeTest(test, devtimeUrl, token, serviceType) {
        const content = [];
        const modifiedUri = util.modifiedUri(test.serviceUri);
        content.push(`### ${test.testId}`);
        if (serviceType === deploymentModel_1.ItemType.CrudService) {
            content.push(`POST ${devtimeUrl}/${modifiedUri}/${test.operation}`);
        }
        else {
            content.push(`POST ${devtimeUrl}/${modifiedUri}`);
        }
        content.push('Content-Type: application/json');
        if (token) {
            content.push(`Authorization: Bearer ${token}`);
        }
        content.push('');
        content.push(JSON.stringify(test.input, null, 4));
        content.push('');
        content.push('');
        return content;
    }
    loadTests(service) {
        return __awaiter(this, void 0, void 0, function* () {
            // get tests
            const tests = yield this.deployService.getTests(service.uri);
        });
    }
    loadDataSource(app) {
        return __awaiter(this, void 0, void 0, function* () {
            // get data source
            const datasource = yield this.deployService.getDataSourceForApplication(app.uri);
            // write data source
            const docUri = vscode.Uri.joinPath(app.fileUri, '.datasource');
            yield util.writeJsonFile(docUri, datasource);
            // return
            return docUri;
        });
    }
    cleanApplication(app) {
        return __awaiter(this, void 0, void 0, function* () {
            this.deployService.cleanApplication(app.uri);
            vscode.workspace.fs.delete(app.fileUri, { recursive: true });
        });
    }
    cleanWorkspace() {
        return __awaiter(this, void 0, void 0, function* () {
            this.deployService.cleanWorkspace();
            vscode.workspace.fs.delete(util.devtimeAppUri(), { recursive: true });
            vscode.workspace.fs.delete(util.devtimeDsUri(), { recursive: true });
        });
    }
    loadService(service) {
        return __awaiter(this, void 0, void 0, function* () {
            // get service
            const spec = yield this.deployService.getService(service.uri);
            // write service
            const docUri = vscode.Uri.joinPath(service.fileUri, '.service');
            yield util.writeJsonFile(docUri, spec);
            // return
            return docUri;
        });
    }
    getInvalidatedReason(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = yield util.readJsonFile(vscode.Uri.joinPath(item.fileUri, 'service'));
            return service.reason;
        });
    }
}
exports.DeploymentExplorerService = DeploymentExplorerService;
//# sourceMappingURL=deploymentExplorerService.js.map
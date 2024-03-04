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
exports.DeploymentDataService = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const deploymentModel_1 = require("./deploymentModel");
class DeploymentDataService {
    constructor() { }
    getChildren(item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!item) {
                return this.getTopItems();
            }
            else if (item.type === deploymentModel_1.ItemType.DataSources) {
                return this.getDataSourceItems(item);
            }
            else if (item.type === deploymentModel_1.ItemType.Applications) {
                return this.getApplicationItems(item);
            }
            else if (item.type === deploymentModel_1.ItemType.Application) {
                return this.getModuleItems(item);
            }
            else if (item.type === deploymentModel_1.ItemType.Module) {
                return this.getServiceItems(item);
            }
            else if (item.type === deploymentModel_1.ItemType.QueryService || item.type === deploymentModel_1.ItemType.SqlService || item.type === deploymentModel_1.ItemType.CrudService) {
                return this.getTestItems(item);
            }
            else {
                return [];
            }
        });
    }
    getTopItems() {
        return __awaiter(this, void 0, void 0, function* () {
            // get workfolder
            const workfolder = util.getWorkFolder();
            if (!workfolder) {
                return [];
            }
            // data sources item
            const datasources = {
                uri: 'datasources',
                type: deploymentModel_1.ItemType.DataSources,
                name: 'Data Sources',
                fileType: vscode.FileType.Directory,
                fileUri: util.devtimeDsUri(),
                parent: null,
                seqNo: 1
            };
            // applications item
            const applications = {
                uri: 'applications',
                type: deploymentModel_1.ItemType.Applications,
                name: 'Applications',
                fileType: vscode.FileType.Directory,
                fileUri: util.devtimeAppUri(),
                parent: null,
                seqNo: 2
            };
            return [datasources, applications];
        });
    }
    getDataSourceItems(item) {
        return __awaiter(this, void 0, void 0, function* () {
            // check data sources folder
            const exists = yield util.fileExists(item.fileUri);
            if (!exists) {
                return [];
            }
            // get data sources
            const children = yield vscode.workspace.fs.readDirectory(item.fileUri);
            const items = yield Promise.all(children.filter(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                return (fileType === vscode.FileType.File);
            })).map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                let ds = yield util.readJsonFile(vscode.Uri.joinPath(item.fileUri, name));
                return {
                    uri: ds.uri,
                    type: deploymentModel_1.ItemType.DataSource,
                    name: name,
                    fileType: vscode.FileType.File,
                    fileUri: vscode.Uri.joinPath(item.fileUri, name),
                    parent: item
                };
            })));
            // return
            return items;
        });
    }
    getApplicationItems(item) {
        return __awaiter(this, void 0, void 0, function* () {
            // check applications folder
            const exists = yield util.fileExists(item.fileUri);
            if (!exists) {
                return [];
            }
            // get applications
            const children = yield vscode.workspace.fs.readDirectory(item.fileUri);
            const items = yield Promise.all(children.filter(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                return (fileType === vscode.FileType.Directory)
                    && (yield util.fileExists(vscode.Uri.joinPath(item.fileUri, name, 'application')));
            })).map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                let app = yield util.readJsonFile(vscode.Uri.joinPath(item.fileUri, name, 'application'));
                return {
                    uri: app.uri,
                    type: deploymentModel_1.ItemType.Application,
                    name: name,
                    fileType: vscode.FileType.Directory,
                    fileUri: vscode.Uri.joinPath(item.fileUri, name),
                    parent: item
                };
            })));
            // return
            return items;
        });
    }
    getModuleItems(app) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // get children
                const children = yield vscode.workspace.fs.readDirectory(app.fileUri);
                // get modules
                const mods = children.filter(([name, fileType]) => {
                    return (fileType === vscode.FileType.Directory);
                    // && util.fileExists(vscode.Uri.joinPath(app.fileUri , name, 'module'));
                });
                const items = yield Promise.all(mods.map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                    let mod = yield util.readJsonFile(vscode.Uri.joinPath(app.fileUri, name, 'module'));
                    return {
                        uri: mod.uri,
                        type: deploymentModel_1.ItemType.Module,
                        name: name,
                        fileType: vscode.FileType.Directory,
                        fileUri: vscode.Uri.joinPath(app.fileUri, name),
                        parent: app
                    };
                })));
                // return item list
                return items;
            }
            catch (error) {
                console.error(error);
                throw new Error('Error to load modules');
            }
        });
    }
    getServiceItems(mod) {
        return __awaiter(this, void 0, void 0, function* () {
            // get children
            const children = yield vscode.workspace.fs.readDirectory(mod.fileUri);
            // get services
            const services = children.filter(([name, fileType]) => {
                return (fileType === vscode.FileType.Directory);
            });
            const items = yield Promise.all(services.map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                let service = yield util.readJsonFile(vscode.Uri.joinPath(mod.fileUri, name, 'service'));
                return {
                    uri: service.uri,
                    type: this.itemType(service.serviceType),
                    name: name,
                    state: service.state,
                    fileType: (service.state === 'valid') ? vscode.FileType.Directory : vscode.FileType.File,
                    fileUri: vscode.Uri.joinPath(mod.fileUri, name),
                    parent: mod
                };
            })));
            // return item list
            return items;
        });
    }
    getTestItems(service) {
        return __awaiter(this, void 0, void 0, function* () {
            // get children
            const children = yield vscode.workspace.fs.readDirectory(service.fileUri);
            // get tests
            const items = yield Promise.all(children.filter(([name, fileType]) => {
                return (fileType === vscode.FileType.File) && (name === 'tests.http');
            }).map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                return {
                    type: deploymentModel_1.ItemType.Tests,
                    name: name,
                    fileType: vscode.FileType.File,
                    fileUri: vscode.Uri.joinPath(service.fileUri, name),
                    parent: service
                };
            })));
            // return item list
            return items;
        });
    }
    itemType(serviceType) {
        switch (serviceType) {
            case 'query':
                return deploymentModel_1.ItemType.QueryService;
            case 'sql':
                return deploymentModel_1.ItemType.SqlService;
            case 'crud':
                return deploymentModel_1.ItemType.CrudService;
            default:
                return deploymentModel_1.ItemType.Other;
        }
    }
}
exports.DeploymentDataService = DeploymentDataService;
//# sourceMappingURL=deploymentDataService.js.map
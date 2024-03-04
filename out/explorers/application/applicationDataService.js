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
exports.ApplicationDataService = void 0;
const util_1 = require("util");
const vscode = require("vscode");
const util = require("../../core/util");
const applicationModel_1 = require("./applicationModel");
class ApplicationDataService {
    constructor() {
        this.componentNames = ['input', 'output', 'object', 'query', 'sqls', 'input-bindings', 'output-bindings', 'tables', 'columns'];
    }
    construct() { }
    getChildren(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (entry.type) {
                case applicationModel_1.EntryType.Workfolder:
                    return this.getChildrenForWorkspaceFolder(entry);
                case applicationModel_1.EntryType.Application:
                    return this.getChildrenForApplication(entry);
                case applicationModel_1.EntryType.Module:
                    return this.getChildrenForModule(entry);
                case applicationModel_1.EntryType.QueryService:
                    return this.getChildrenForService(entry);
                case applicationModel_1.EntryType.SqlService:
                    return this.getChildrenForService(entry);
                case applicationModel_1.EntryType.CrudService:
                    return this.getChildrenForCrudService(entry);
                case applicationModel_1.EntryType.Read:
                    return this.getChildrenForRead(entry);
                case applicationModel_1.EntryType.Write:
                    return this.getChildrenForWrite(entry);
                case applicationModel_1.EntryType.Tests:
                    return this.getChildrenForTests(entry);
                default:
                    return this.getChildrenForOther(entry);
            }
        });
    }
    getChildrenForWorkspaceFolder(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield vscode.workspace.fs.readDirectory(entry.uri);
            let children = yield Promise.all(files.map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                switch (fileType) {
                    // case vscode.FileType.File:
                    // 	return {name, fileType, valid: name === 'Welcome.md'};
                    case vscode.FileType.Directory:
                        const isApplication = yield util.isApplication(vscode.Uri.joinPath(entry.uri, name));
                        return { name, fileType, valid: isApplication };
                    default:
                        return { name, fileType, valid: false };
                }
            })));
            children = children.filter((file) => {
                return file.valid;
            });
            return children.map((file) => {
                let child = this.defaultEntry(file.name, file.fileType, entry);
                child.parent = null; // workfolder is not true node
                if (file.fileType === vscode.FileType.Directory) {
                    child.type = applicationModel_1.EntryType.Application;
                }
                return child;
            });
        });
    }
    getChildrenForApplication(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            // modules in src folder
            const srcChildren = yield this.getChildrenForApplicationSrc(entry);
            // files in app folder
            const dirChildren = yield this.getChildrenForApplicationDir(entry);
            // return
            return srcChildren.concat(dirChildren);
        });
    }
    getChildrenForApplicationDir(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            return children.filter(([name, fileType]) => {
                return (name === 'README.md');
            }).map(([name, fileType]) => {
                let child = this.defaultEntry(name, fileType, entry);
                return child;
            });
        });
    }
    getChildrenForApplicationSrc(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 2;
            const srcUri = vscode.Uri.joinPath(entry.uri, 'src');
            const src = this.defaultEntry('src', vscode.FileType.Directory, entry);
            const children = yield vscode.workspace.fs.readDirectory(src.uri);
            return children.filter(([name, fileType]) => {
                return true;
            }).map(([name, fileType]) => {
                i++;
                let child = this.defaultEntry(name, fileType, src);
                if (name === 'application.json') {
                    child.type = applicationModel_1.EntryType.ApplicationFile;
                    child.seqNo = 0;
                }
                else if (name === 'datasource.json') {
                    child.type = applicationModel_1.EntryType.ApplicationFile;
                    child.seqNo = 1;
                }
                else if (fileType === vscode.FileType.Directory) {
                    child.type = applicationModel_1.EntryType.Module;
                    child.seqNo = i++;
                }
                return child;
            }).sort((a, b) => {
                return a.seqNo - b.seqNo;
            });
        });
    }
    getChildrenForModule(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 1;
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            const entries = yield Promise.all(children.map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                let child = this.defaultEntry(name, fileType, entry);
                if (name === 'module.json') {
                    child.type = applicationModel_1.EntryType.ModuleFile;
                    child.seqNo = 0;
                }
                else if (fileType === vscode.FileType.Directory) {
                    const serviceType = yield this.serviceType(child.uri);
                    child.type = this.entryType(serviceType);
                    child.serviceType = serviceType;
                    child.seqNo = i++;
                }
                return child;
            })));
            return entries.sort((a, b) => {
                return a.seqNo - b.seqNo;
            });
        });
    }
    getChildrenForService(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 1;
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            return children.map(([name, fileType]) => {
                let child = this.defaultEntry(name, fileType, entry);
                const componentName = name.replace('.json', '').replace('.sql', '');
                if (name === 'service.json') {
                    child.type = applicationModel_1.EntryType.ServiceFile;
                    child.seqNo = 0;
                }
                else if (name === 'tests') {
                    child.type = applicationModel_1.EntryType.Tests;
                    child.seqNo = 1000;
                }
                else if (this.componentNames.includes(componentName)) {
                    child.type = applicationModel_1.EntryType.Component;
                    child.componentType = componentName;
                    switch (componentName) {
                        case 'input':
                            child.seqNo = 1;
                            break;
                        case 'output':
                            child.seqNo = 2;
                            break;
                        case 'sqls':
                            child.seqNo = 3;
                            break;
                        case 'query':
                            child.seqNo = 4;
                            break;
                        case 'input-bindings':
                            child.seqNo = 5;
                            child.type = applicationModel_1.EntryType.Bindings;
                            break;
                        case 'output-bindings':
                            child.seqNo = 6;
                            child.type = applicationModel_1.EntryType.Bindings;
                            break;
                    }
                }
                return child;
            }).sort((a, b) => {
                return a.seqNo - b.seqNo;
            });
        });
    }
    getChildrenForCrudService(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            return children.map(([name, fileType]) => {
                let child = this.defaultEntry(name, fileType, entry);
                switch (name) {
                    case 'service.json':
                        child.type = applicationModel_1.EntryType.ServiceFile;
                        child.seqNo = 0;
                        break;
                    case 'tests':
                        child.type = applicationModel_1.EntryType.Tests;
                        child.seqNo = 1000;
                        break;
                    case 'object.json':
                        child.type = applicationModel_1.EntryType.Component;
                        child.seqNo = 1;
                        break;
                    case 'read':
                        child.type = applicationModel_1.EntryType.Read;
                        child.seqNo = 2;
                        break;
                    case 'write':
                        child.type = applicationModel_1.EntryType.Write;
                        child.seqNo = 3;
                        break;
                }
                return child;
            }).sort((a, b) => {
                return a.seqNo - b.seqNo;
            });
        });
    }
    getChildrenForRead(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            return children.map(([name, fileType]) => {
                let child = this.defaultEntry(name, fileType, entry);
                const componentName = name.replace('.json', '').replace('.sql', '');
                if (this.componentNames.includes(componentName)) {
                    child.type = applicationModel_1.EntryType.Component;
                    child.componentType = componentName;
                    switch (componentName) {
                        case 'input':
                            child.seqNo = 1;
                            break;
                        case 'query':
                            child.seqNo = 2;
                            break;
                        case 'input-bindings':
                            child.seqNo = 3;
                            child.type = applicationModel_1.EntryType.Bindings;
                            break;
                        case 'output-bindings':
                            child.seqNo = 4;
                            child.type = applicationModel_1.EntryType.Bindings;
                            break;
                    }
                }
                return child;
            }).sort((a, b) => {
                return a.seqNo - b.seqNo;
            });
        });
    }
    getChildrenForWrite(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 2;
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            return children.map(([name, fileType]) => {
                let child = this.defaultEntry(name, fileType, entry);
                const componentName = name.replace('.json', '').replace('.sql', '');
                if (this.componentNames.includes(componentName)) {
                    child.type = applicationModel_1.EntryType.Component;
                    child.componentType = componentName;
                    switch (componentName) {
                        case 'tables':
                            child.seqNo = 0;
                            break;
                    }
                }
                else if (componentName.endsWith('columns')) {
                    child.type = applicationModel_1.EntryType.Component;
                    child.componentType = 'columns';
                    child.seqNo = i++;
                }
                child.type = applicationModel_1.EntryType.Bindings;
                return child;
            }).sort((a, b) => {
                return a.seqNo - b.seqNo;
            });
        });
    }
    getChildrenForTests(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            return children.map(([name, fileType]) => {
                let child = this.defaultEntry(name, fileType, entry);
                if (fileType === vscode.FileType.File) {
                    child.type = applicationModel_1.EntryType.TestFile;
                }
                return child;
            });
        });
    }
    getChildrenForOther(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield vscode.workspace.fs.readDirectory(entry.uri);
            return children.map(([name, fileType]) => {
                return this.defaultEntry(name, fileType, entry);
            });
        });
    }
    defaultEntry(name, fileType, parent) {
        return {
            uri: vscode.Uri.joinPath(parent.uri, name),
            type: applicationModel_1.EntryType.Other,
            serviceType: null,
            componentType: null,
            fileType: fileType,
            name: name,
            parent: parent,
            seqNo: 10000
        };
    }
    serviceType(serviceUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield vscode.workspace.fs.readFile(vscode.Uri.joinPath(serviceUri, 'service.json'));
            const service = JSON.parse(new util_1.TextDecoder().decode(content));
            return service.type;
        });
    }
    entryType(serviceType) {
        switch (serviceType) {
            case 'query':
                return applicationModel_1.EntryType.QueryService;
            case 'sql':
                return applicationModel_1.EntryType.SqlService;
            case 'crud':
                return applicationModel_1.EntryType.CrudService;
            default:
                return applicationModel_1.EntryType.Other;
        }
    }
}
exports.ApplicationDataService = ApplicationDataService;
//# sourceMappingURL=applicationDataService.js.map
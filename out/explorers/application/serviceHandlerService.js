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
exports.ServiceHandlerService = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const cs = require("./contentService");
const applicationModel_1 = require("./applicationModel");
class ServiceHandlerService {
    construct() { }
    /**
     * create service
     * @param uri service uri
     * @param name 	service name
     * @param type 	service type
     */
    createService(mod, name, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = this.defaultEntry(name, vscode.FileType.Directory, mod);
            // check name not exists
            const exists = yield util.fileExists(service.uri);
            if (exists) {
                throw vscode.FileSystemError.FileExists();
            }
            // create service
            switch (type) {
                case 'query':
                    yield this.createQueryService(service.uri, name);
                    break;
                case 'sql':
                    yield this.createSqlService(service.uri, name);
                    break;
                case 'crud':
                    yield this.createCrudService(service.uri, name);
                    break;
                default:
                    throw new Error("Unsupported service type: " + type);
            }
            return service;
        });
    }
    createQueryService(uri, name) {
        return __awaiter(this, void 0, void 0, function* () {
            // service folder
            yield vscode.workspace.fs.createDirectory(uri);
            yield Promise.all([
                // service file
                vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'service.json'), cs.queryServiceFile(name)),
                // input file
                vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input.json'), new Uint8Array()),
                // output file
                vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output.json'), new Uint8Array()),
                // query file
                vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'query.sql'), new Uint8Array()),
                // input binding file
                vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input-bindings.json'), new Uint8Array()),
                // output binding file
                vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output-bindings.json'), new Uint8Array()),
                // tests folder
                vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, 'tests'))
            ]);
        });
    }
    createSqlService(uri, name) {
        return __awaiter(this, void 0, void 0, function* () {
            // service folder
            yield vscode.workspace.fs.createDirectory(uri);
            // service file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'service.json'), cs.sqlServiceFile(name));
            // input file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input.json'), new Uint8Array());
            // output file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output.json'), new Uint8Array());
            // sqls file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'sqls.sql'), new Uint8Array());
            // query file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'query.sql'), new Uint8Array());
            // input binding file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input-bindings.json'), new Uint8Array());
            // output binding file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output-bindings.json'), new Uint8Array());
            // tests folder
            yield vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, 'tests'));
        });
    }
    createCrudService(uri, name) {
        return __awaiter(this, void 0, void 0, function* () {
            // service folder
            yield vscode.workspace.fs.createDirectory(uri);
            // service file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'service.json'), cs.crudServiceFile(name));
            // object file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'object.json'), new Uint8Array());
            // read folder
            const readUri = vscode.Uri.joinPath(uri, 'read');
            yield vscode.workspace.fs.createDirectory(readUri);
            // input file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'input.json'), new Uint8Array());
            // query file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'query.sql'), new Uint8Array());
            // input binding file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'input-bindings.json'), new Uint8Array());
            // output binding file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'output-bindings.json'), new Uint8Array());
            // write folder
            const writeUri = vscode.Uri.joinPath(uri, 'write');
            yield vscode.workspace.fs.createDirectory(writeUri);
            // tables file
            yield vscode.workspace.fs.writeFile(vscode.Uri.joinPath(writeUri, 'tables.json'), new Uint8Array());
            // tests folder
            yield vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, 'tests'));
        });
    }
    addTest(testFolder, testType) {
        return __awaiter(this, void 0, void 0, function* () {
            // test file name and input uri
            const service = testFolder.parent;
            if (!(service === null || service === void 0 ? void 0 : service.serviceType)) { // never happen unless bug
                return {};
            }
            let fileName;
            let inputUri;
            let input;
            switch (testType) {
                case 'read':
                case 'delete':
                    fileName = `test${util.initCap(testType)}${util.initCap(service.name)}`;
                    inputUri = vscode.Uri.joinPath(service.uri, 'read', 'input.json');
                    input = yield util.readJsonFile(inputUri);
                    break;
                case 'create':
                case 'update':
                case 'save':
                    fileName = `test${util.initCap(testType)}${util.initCap(service.name)}`;
                    inputUri = vscode.Uri.joinPath(service.uri, 'object.json');
                    input = yield util.readJsonFile(inputUri);
                    break;
                default:
                    fileName = `test${util.initCap(service.name)}`;
                    inputUri = vscode.Uri.joinPath(service.uri, 'input.json');
                    input = yield util.readJsonFile(inputUri);
            }
            // input and test file
            const newFileName = yield this.newTestFileName(testFolder, fileName);
            const newFileUri = vscode.Uri.joinPath(testFolder.uri, newFileName);
            const content = cs.testFile(input, fileName, testType);
            yield vscode.workspace.fs.writeFile(newFileUri, content);
            //return
            return this.defaultEntry(newFileName, vscode.FileType.File, testFolder);
        });
    }
    duplicateTest(sourceTest) {
        return __awaiter(this, void 0, void 0, function* () {
            // target test uri
            if (!sourceTest.parent) { // never unless bug
                return {};
            }
            const newFileName = yield this.newTestFileName(sourceTest.parent, sourceTest.name.replace('.json', ''));
            const newFileUri = vscode.Uri.joinPath(sourceTest.parent.uri, newFileName);
            // duplicate test
            yield vscode.workspace.fs.copy(sourceTest.uri, newFileUri);
            //return
            return this.defaultEntry(newFileName, vscode.FileType.File, sourceTest.parent);
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
    newTestFileName(testFolder, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 2;
            let newFileName = `${fileName}.json`;
            while (yield util.fileExists(vscode.Uri.joinPath(testFolder.uri, newFileName))) {
                newFileName = `${fileName + i.toString()}.json`;
                i++;
            }
            return Promise.resolve(newFileName);
        });
    }
}
exports.ServiceHandlerService = ServiceHandlerService;
//# sourceMappingURL=serviceHandlerService.js.map
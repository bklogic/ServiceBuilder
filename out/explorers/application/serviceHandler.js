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
exports.ServiceHandler = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const serviceHandlerService_1 = require("./serviceHandlerService");
const applicationModel_1 = require("./applicationModel");
const builderModel_1 = require("../../backend/builder/builderModel");
const vscode_1 = require("vscode");
class ServiceHandler {
    constructor(builderClient, dataProvider, treeView) {
        this.doubleClick = new util.DoubleClick();
        this.dataProvider = dataProvider;
        this.treeView = treeView;
        this.handlerService = new serviceHandlerService_1.ServiceHandlerService();
        this.builderService = builderClient.builderService;
        vscode.commands.registerCommand('servicebuilderExplorer.openWithJsonViewer', (resource) => this.openWithJsonViewer(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.createQueryService', (resource) => this.onCreateService(resource, 'query'));
        vscode.commands.registerCommand('servicebuilderExplorer.createSqlService', (resource) => this.onCreateService(resource, 'sql'));
        vscode.commands.registerCommand('servicebuilderExplorer.createCrudService', (resource) => this.onCreateService(resource, 'crud'));
        vscode.commands.registerCommand('servicebuilderExplorer.generateCrud', (resource) => this.onGenerateCrud(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.genQueryInputOutput', (resource) => this.genQueryInputOutput(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.genQueryInputOutputBindings', (resource) => this.genQueryInputOutputBindings(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.genSqlInputOutput', (resource) => this.genSqlInputOutput(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.genSqlInputOutputBindings', (resource) => this.genSqlInputOutputBindings(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.genCrudObject', (resource) => this.genCrudObject(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.genCrudInputOutputBindings', (resource) => this.genCrudInputOutputBindings(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.genCrudTableBindings', (resource) => this.genCrudTableBindings(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.deployService', (resource) => this.deployService(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.addTest', (resource) => this.addTest(resource));
        vscode.commands.registerCommand('servicebuilderExplorer.duplicateTest', (resource) => this.duplicateTest(resource));
    }
    openResource(resource) {
        vscode.window.showTextDocument(resource.uri, { preview: !this.doubleClick.check(resource) });
    }
    openWithJsonViewer(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.window.showTextDocument(resource.uri);
            yield vscode.commands.executeCommand('vscode.openWith', resource.uri, 'jsonGridViewer.json', { viewColumn: vscode_1.ViewColumn.Beside, preserveFocus: true });
            vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
        });
    }
    onCreateService(mod, serviceType) {
        vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: `${serviceType} service name`, prompt: "must be an alphanumberic" })
            .then(name => {
            if (name) {
                this.createService(mod, name, serviceType);
            }
        });
    }
    createService(mod, name, type) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'creating service'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // create service
                    const service = yield this.handlerService.createService(mod, name, type);
                    this.dataProvider.fire(mod);
                    this.treeView.reveal(service, { expand: 2, focus: true, select: true });
                    // inform user
                    vscode.window.setStatusBarMessage('service is created.');
                }
                catch (error) {
                    let message;
                    switch (error.code) {
                        case 'FileExists':
                            message = 'Service name exists.';
                            break;
                        default:
                            message = error.message;
                    }
                    vscode.window.showErrorMessage(message);
                }
            }));
        });
    }
    deployService(service) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'deploying service'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // zip 
                    const appUri = yield util.applicationUriForService(service.uri.path);
                    const modName = ((_a = service.parent) === null || _a === void 0 ? void 0 : _a.name) || 'modName'; // service.parent never be null
                    const archive = yield util.getArchive(service.uri.fsPath);
                    // call service
                    const result = yield this.builderService.deployService(appUri, modName, service.name, archive);
                    // inform user
                    vscode.window.setStatusBarMessage(result.valid ? 'service is deployed.' : 'Error: ' + result.reason);
                }
                catch (error) {
                    util.showErrorStatus('Failed to deploy service.', error.message);
                }
            }));
        });
    }
    undeployService(service) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'undeploying service'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // clear status message
                    vscode.window.setStatusBarMessage('');
                    // zip 
                    const appUri = yield util.applicationUriForService(service.uri.path);
                    const modName = ((_a = service.parent) === null || _a === void 0 ? void 0 : _a.name) || 'modName'; // service.parent never be null
                    // call service
                    yield this.builderService.undeployService(appUri, modName, service.name);
                    // inform user
                    vscode.window.setStatusBarMessage('service is undeployed.');
                }
                catch (error) {
                    console.error('Error in undeploying service', error);
                    vscode.window.setStatusBarMessage('Failed to undeploy service: ' + error.message);
                }
            }));
        });
    }
    onGenerateCrud(module) {
        return __awaiter(this, void 0, void 0, function* () {
            // get table list
            const applicationUri = yield util.applicationUriForModule(module.uri.path);
            const request = {
                applicationUri
            };
            const tables = yield this.builderService.getTableList(request);
            // displace table pick
            vscode.window.showQuickPick(tables, { ignoreFocusOut: true, placeHolder: "tables", canPickMany: true }).then((tbls) => {
                const conventions = ['Camel', 'None'];
                if (tbls && tbls.length > 0) {
                    // display name convention
                    vscode.window.showQuickPick(conventions, { ignoreFocusOut: true, placeHolder: "name conventions", canPickMany: false }).then((convn) => {
                        if (convn) {
                            let cvn;
                            switch (convn) {
                                case 'Camel':
                                    cvn = builderModel_1.NameConvention.CAMEL;
                                    break;
                                case 'None':
                                    cvn = builderModel_1.NameConvention.NONE;
                                    break;
                                default:
                                    cvn = builderModel_1.NameConvention.CAMEL;
                            }
                            const options = { whereClause: builderModel_1.WhereClauseType.keys, fieldNameConvention: cvn };
                            this.generateCrud(module, applicationUri, tbls, options);
                        }
                        else {
                            vscode.window.setStatusBarMessage('No name convention selected');
                        }
                    });
                }
                else {
                    vscode.window.setStatusBarMessage('No table selected');
                }
            });
        });
    }
    generateCrud(module, applicationUri, tableNames, options) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'generating crud services'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // prepare request
                    const request = {
                        applicationUri, tableNames, options
                    };
                    // call service
                    const results = yield this.builderService.genCruds(request);
                    // process result
                    const services = yield this.createCruds(module, results);
                    // inform user
                    vscode.window.setStatusBarMessage('CRUD services are generated');
                }
                catch (error) {
                    console.error('Error in generating crud services', error);
                    util.showErrorStatus('Failed to generate crud services.', error.message);
                }
            }));
        });
    }
    genQueryInputOutput(service) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // prepare request
                const query = yield util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'));
                const request = {
                    applicationUri: yield util.applicationUriForService(service.uri.path),
                    queryString: query,
                    sqlsString: [],
                    nameConvention: builderModel_1.NameConvention.CAMEL
                };
                // call service
                const result = yield this.builderService.genQueryInputOutput(request);
                // process result
                const inputUri = vscode.Uri.joinPath(service.uri, 'input.json');
                const outputUri = vscode.Uri.joinPath(service.uri, 'output.json');
                yield util.writeJsonFile(inputUri, result.input);
                yield util.writeJsonFile(outputUri, result.output);
                vscode.window.showTextDocument(inputUri, { preview: false });
                // vscode.window.showTextDocument(outputUri, {preview: false});
                // inform user
                vscode.window.setStatusBarMessage('input and output are generated');
            }
            catch (error) {
                console.error('Error in generating query input and output', error);
                util.showErrorStatus('Failed to generate query input and output.', error.message);
            }
        });
    }
    genQueryInputOutputBindings(service) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'generating input and output bindings'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // prepare request
                    const [input, output, query] = yield Promise.all([
                        util.readJsonFile(vscode.Uri.joinPath(service.uri, 'input.json')),
                        util.readJsonFile(vscode.Uri.joinPath(service.uri, 'output.json')),
                        util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'))
                    ]);
                    const request = {
                        applicationUri: yield util.applicationUriForService(service.uri.path),
                        input, output, queryString: query
                    };
                    // call service
                    const result = yield this.builderService.bindQuery(request);
                    // process result
                    const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'input-bindings.json');
                    const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'output-bindings.json');
                    yield util.writeJsonFile(inputBidningsUri, result.inputBindings);
                    yield util.writeJsonFile(outputBidningsUri, result.outputBindings);
                    // inform user
                    vscode.window.setStatusBarMessage('input and output bindings are generated');
                }
                catch (error) {
                    console.error('Error in generating query input and output bindings', error);
                    util.showErrorStatus('Failed to generate query input and output bindings.', error.message);
                }
            }));
        });
    }
    genSqlInputOutput(service) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // prepare request
                const [query, sqls] = yield Promise.all([
                    util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql')),
                    util.readSqlFile(vscode.Uri.joinPath(service.uri, 'sqls.sql'))
                ]);
                const request = {
                    applicationUri: yield util.applicationUriForService(service.uri.path),
                    queryString: query,
                    sqlsString: sqls,
                    nameConvention: builderModel_1.NameConvention.CAMEL
                };
                // call service
                const result = yield this.builderService.genSqlInputOutput(request);
                // process result
                const inputUri = vscode.Uri.joinPath(service.uri, 'input.json');
                const outputUri = vscode.Uri.joinPath(service.uri, 'output.json');
                yield util.writeJsonFile(inputUri, result.input);
                yield util.writeJsonFile(outputUri, result.output);
                vscode.window.showTextDocument(inputUri, { preview: true });
                // vscode.window.showTextDocument(outputUri, {preview: true});
                // inform user
                vscode.window.setStatusBarMessage('input and output are generated');
            }
            catch (error) {
                console.error('Error in generating sql input and output', error);
                vscode.window.setStatusBarMessage('Failed to generate sql input and output: ' + error.message);
            }
        });
    }
    genSqlInputOutputBindings(service) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // prepare request
                const [input, output, sqls, query] = yield Promise.all([
                    util.readJsonFile(vscode.Uri.joinPath(service.uri, 'input.json')),
                    util.readJsonFile(vscode.Uri.joinPath(service.uri, 'output.json')),
                    util.readSqlFile(vscode.Uri.joinPath(service.uri, 'sqls.sql')),
                    util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'))
                ]);
                const request = {
                    applicationUri: yield util.applicationUriForService(service.uri.path),
                    input, output, sqlsString: sqls, queryString: query
                };
                // call service
                const result = yield this.builderService.bindSql(request);
                // process result
                const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'input-bindings.json');
                const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'output-bindings.json');
                yield util.writeJsonFile(inputBidningsUri, result.inputBindings);
                yield util.writeJsonFile(outputBidningsUri, result.outputBindings);
                // inform user
                vscode.window.setStatusBarMessage('input and output bindings are generated');
            }
            catch (error) {
                console.error('Error in generating sqls input and output bindings', error);
                util.showErrorStatus('Failed to generate sql input and output bindings.', error.message);
            }
        });
    }
    genCrudObject(service) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // prepare request
                const query = yield util.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql'));
                const request = {
                    applicationUri: yield util.applicationUriForService(service.uri.path),
                    queryString: query,
                    nameConvention: builderModel_1.NameConvention.CAMEL
                };
                // call service
                const result = yield this.builderService.genCrudObject(request);
                // process result
                const objectUri = vscode.Uri.joinPath(service.uri, 'object.json');
                const inputUri = vscode.Uri.joinPath(service.uri, 'read', 'input.json');
                yield util.writeJsonFile(objectUri, result.object);
                yield util.writeJsonFile(inputUri, result.input);
                vscode.window.showTextDocument(objectUri, { preview: false });
                // vscode.window.showTextDocument(inputUri, {preview: false});
                // inform user
                vscode.window.setStatusBarMessage('object is generated');
            }
            catch (error) {
                console.error('Error in generating crud object', error);
                vscode.window.setStatusBarMessage('Failed to generate crud object: ' + error.message);
            }
        });
    }
    genCrudInputOutputBindings(read) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = read.parent;
            if (!service) { // never happen
                return;
            }
            try {
                // prepare request
                const [object, query, input] = yield Promise.all([
                    util.readJsonFile(vscode.Uri.joinPath(service.uri, 'object.json')),
                    util.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql')),
                    util.readJsonFile(vscode.Uri.joinPath(service.uri, 'read', 'input.json')),
                ]);
                const request = {
                    applicationUri: yield util.applicationUriForService(service.uri.path),
                    object, queryString: query, input
                };
                // call service
                const result = yield this.builderService.bindCrudQuery(request);
                // process result
                const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'input-bindings.json');
                const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'output-bindings.json');
                yield util.writeJsonFile(inputBidningsUri, result.inputBindings);
                yield util.writeJsonFile(outputBidningsUri, result.outputBindings);
                // inform user
                vscode.window.setStatusBarMessage('input and output bindings are generated');
            }
            catch (error) {
                console.error('Error in generating crud input and output bindings', error);
                util.showErrorStatus('Failed to generate crud input and output bindings.', error.message);
            }
        });
    }
    genCrudTableBindings(write) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = write.parent;
            if (!service) { // never happen
                return;
            }
            try {
                // clean up current binding files
                const files = yield vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(service.uri, 'write'));
                files.forEach(([name, type]) => __awaiter(this, void 0, void 0, function* () {
                    if (name !== 'tables.json') {
                        yield vscode.workspace.fs.delete(vscode.Uri.joinPath(service.uri, 'write', name));
                    }
                }));
                // prepare request
                const [query, outputBindings] = yield Promise.all([
                    util.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql')),
                    util.readJsonFile(vscode.Uri.joinPath(service.uri, 'read', 'output-bindings.json'))
                ]);
                const request = {
                    applicationUri: yield util.applicationUriForService(service.uri.path),
                    outputBindings, crudQueryString: query
                };
                // call service
                const tables = yield this.builderService.bindCrudTable(request);
                // process result
                const tableContent = [];
                for (let table of tables) {
                    // table
                    tableContent.push({
                        "name": table.table,
                        "alias": table.alias,
                        "object": table.object,
                        "rootTable": table.rootTable,
                        "mainTable": table.mainTable,
                        "operationIndicator": table.operationIndicator,
                        "columns": `./${table.table}.${table.alias}.columns.json`
                    });
                    // columns
                    let columnFileName = `${table.table}.${table.alias}.columns.json`;
                    yield util.writeJsonFile(vscode.Uri.joinPath(service.uri, 'write', columnFileName), table.columns);
                }
                const tablesUri = vscode.Uri.joinPath(service.uri, 'write', 'tables.json');
                yield util.writeJsonFile(tablesUri, tableContent);
                this.dataProvider.fire(service);
                this.revealTables(service);
                // inform user
                vscode.window.setStatusBarMessage('table bindings are generated');
            }
            catch (error) {
                console.error('Error in generating crud tables bindings', error);
                util.showErrorStatus('Failed to generate crud table bindings.', error.message);
            }
        });
    }
    revealTables(service) {
        const write = {
            uri: vscode.Uri.joinPath(service.uri, 'write'),
            name: 'write',
            type: applicationModel_1.EntryType.Write,
            parent: service
        };
        this.dataProvider.fire(write);
        const tables = {
            uri: vscode.Uri.joinPath(write.uri, 'tables.json'),
            name: 'tables',
            type: applicationModel_1.EntryType.Component,
            parent: write
        };
        this.treeView.reveal(tables, { expand: true, select: true });
    }
    addTest(testFolder) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const serviceType = (_a = testFolder.parent) === null || _a === void 0 ? void 0 : _a.serviceType;
            if (!serviceType) { // never happen
                return;
            }
            // get operation if crud service
            let testTypes = [];
            if (serviceType === 'crud') {
                yield vscode.window.showQuickPick(['all', 'read', 'create', 'update', 'delete', 'save'], { ignoreFocusOut: true, placeHolder: "select an operation",
                    canPickMany: false }).then((operation) => {
                    if (operation) {
                        testTypes = (operation === 'all') ? ['read', 'create', 'update', 'delete', 'save'] : [operation];
                    }
                    else {
                        vscode.window.setStatusBarMessage("No operation selected.");
                        return;
                    }
                });
            }
            else {
                testTypes = [serviceType];
            }
            // add tests
            try {
                let testFile;
                const tests = testTypes.length;
                for (let testType of testTypes) {
                    testFile = yield this.handlerService.addTest(testFolder, testType);
                    this.dataProvider.fire(testFolder);
                    this.treeView.reveal(testFile, { focus: true, select: false });
                    if (tests === 1) {
                        vscode.window.showTextDocument(testFile.uri, { preview: false });
                    }
                }
            }
            catch (error) {
                vscode.window.setStatusBarMessage('Failed to add test: ' + error.message);
            }
        });
    }
    duplicateTest(test) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const testFile = yield this.handlerService.duplicateTest(test);
                if (!testFile.parent) {
                    return;
                }
                this.dataProvider.fire(testFile.parent);
                this.treeView.reveal(testFile, { focus: true, select: false });
                vscode.window.showTextDocument(testFile.uri, { preview: true });
            }
            catch (error) {
                vscode.window.setStatusBarMessage('Failed to duplicate test: ' + error.message);
            }
        });
    }
    createCruds(mod, cruds) {
        return __awaiter(this, void 0, void 0, function* () {
            const services = [];
            for (let crud of cruds) {
                const service = yield this.createCrud(mod, crud);
                services.push(service);
            }
            return services;
        });
    }
    createCrud(mod, crud) {
        return __awaiter(this, void 0, void 0, function* () {
            // create service
            yield this.handlerService.createService(mod, crud.serviceName, 'crud');
            // add contents
            // object
            yield util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'object.json'), crud.object);
            // input
            yield util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'input.json'), crud.input);
            // query
            yield util.writeSqlFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'query.sql'), crud.crudQuery);
            // input bindings
            yield util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'input-bindings.json'), crud.inputBindings);
            // output bindings
            yield util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'output-bindings.json'), crud.outputBindings);
            // table
            yield this.createTables(vscode.Uri.joinPath(mod.uri, crud.serviceName), crud.tables);
            // reveal service
            const service = {
                uri: vscode.Uri.joinPath(mod.uri, crud.serviceName),
                type: applicationModel_1.EntryType.CrudService,
                name: crud.serviceName,
                fileType: vscode.FileType.Directory,
                parent: mod
            };
            this.dataProvider.fire(mod);
            this.treeView.reveal(service, { expand: 3, select: true });
            return service;
        });
    }
    createTables(serviceUri, tables) {
        return __awaiter(this, void 0, void 0, function* () {
            const tableContent = [];
            for (let table of tables) {
                // table
                tableContent.push({
                    "name": table.table,
                    "alias": table.alias,
                    "object": table.object,
                    "rootTable": table.rootTable,
                    "mainTable": table.mainTable,
                    "operationIndicator": table.operationIndicator,
                    "columns": `./${table.table}.${table.alias}.columns.json`
                });
                // columns
                let columnFileName = `${table.table}.${table.alias}.columns.json`;
                yield util.writeJsonFile(vscode.Uri.joinPath(serviceUri, 'write', columnFileName), table.columns);
            }
            const tablesUri = vscode.Uri.joinPath(serviceUri, 'write', 'tables.json');
            yield util.writeJsonFile(tablesUri, tableContent);
        });
    }
}
exports.ServiceHandler = ServiceHandler;
//# sourceMappingURL=serviceHandler.js.map
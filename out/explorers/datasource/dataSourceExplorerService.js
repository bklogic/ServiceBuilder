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
exports.DataSourceExplorerService = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const dataSourceContentService_1 = require("./dataSourceContentService");
class DataSourceExplorerService {
    constructor(context, builderClient) {
        this.context = context;
        this.builderService = builderClient.builderService;
        this.contentService = new dataSourceContentService_1.DataSourceContentService();
    }
    createDataSource(dataSourceName, dbType) {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize data source
            const dataSource = this.contentService.initializeDataSource(dbType);
            // write data source file
            const uri = util.dataSourceFileUri(dataSourceName);
            yield util.writeJsonFile(uri, dataSource);
        });
    }
    deleteDataSource(dataSource) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.workspace.fs.delete(dataSource.fileUri);
        });
    }
    renameDataSource(dataSource, newName) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldUri = dataSource.fileUri;
            const newUri = util.dataSourceFileUri(newName);
            yield vscode.workspace.fs.rename(oldUri, newUri);
        });
    }
    testDataSource(dataSourceItem) {
        return __awaiter(this, void 0, void 0, function* () {
            // get data source config
            const ds = yield util.readJsonFile(dataSourceItem.fileUri);
            // get password
            let password = ds.password;
            if (password === util.passwordMask) {
                password = yield util.retrievePassword(this.context, dataSourceItem.name);
                if (!password) {
                    return "Please enter a valid password.";
                }
            }
            // test data source
            const testRequest = {
                dbType: ds.dbType,
                host: ds.host,
                port: ds.port,
                database: ds.database,
                username: ds.username,
                password: password,
                ssl: ds.ssl
            };
            const result = yield this.builderService.testDataSource(testRequest);
            // store and mask password in file if successful
            if (result.succeed && ds.password !== util.passwordMask) {
                util.storePassword(this.context, dataSourceItem.name, ds.password);
                ds.password = util.passwordMask;
                util.writeJsonFile(dataSourceItem.fileUri, ds);
            }
            return (result.succeed) ? null : `Data source test failed: ${result.message}`;
        });
    }
    deployDataSource(dataSourceItem) {
        return __awaiter(this, void 0, void 0, function* () {
            // get data source config
            const ds = yield util.readJsonFile(dataSourceItem.fileUri);
            // deploy data source
            const password = yield util.retrievePassword(this.context, dataSourceItem.name);
            if (!password) {
                throw new Error("No password is stored. Test data source first.");
            }
            const deployRequest = {
                uri: yield util.dataSourceUriForName(dataSourceItem.name),
                dbType: ds.dbType,
                host: ds.host,
                port: ds.port,
                database: ds.database,
                username: ds.username,
                password: password,
                ssl: ds.ssl
            };
            const result = yield this.builderService.deployDataSource(deployRequest);
        });
    }
}
exports.DataSourceExplorerService = DataSourceExplorerService;
//# sourceMappingURL=dataSourceExplorerService.js.map
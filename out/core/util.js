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
exports.strToBuffer = exports.toUint8Array = exports.sleep = exports.readConfig = exports.readWorkspace = exports.storeWorkspace = exports.qualifiedName = exports.storeSecret = exports.readSecret = exports.devtimeDsUri = exports.devtimeAppUri = exports.devtimeUri = exports.localDsUri = exports.testResultUri = exports.isService = exports.isModule = exports.isApplication = exports.fileExists = exports.writeSqlFile = exports.readSqlFile = exports.writeJsonFile = exports.readJsonFile = exports.dataSourceFileUri = exports.modifiedUri = exports.serviceUri = exports.moduleUri = exports.applicationUri = exports.dataSourceUri = exports.fromTest = exports.fromService = exports.fromModule = exports.fromApplication = exports.fromDataSource = exports.fromDataSourceName = exports.servicePathForTest = exports.dataSourceNameFromUri = exports.serviceUriForService = exports.moduleUriForModule = exports.applicationUriForTest = exports.applicationUriForService = exports.applicationUriForModule = exports.applicationUriForApplication = exports.applicationUriForDataSource = exports.dataSourceUriForName = exports.getWorkFolder = exports.passwordSecretName = exports.retrievePassword = exports.storePassword = exports.passwordMask = exports.createGetWorkspaceUtil = void 0;
exports.showErrorStatus = exports.initCap = exports.getApplicationArchive = exports.getArchive = exports.DoubleClick = void 0;
const util_1 = require("util");
const vscode = require("vscode");
const constants = require("./constants");
var ZIP = require("adm-zip");
let getWorkspace;
function createGetWorkspaceUtil(context) {
    getWorkspace = () => __awaiter(this, void 0, void 0, function* () {
        const workspace = yield readWorkspace(context);
        if (!workspace) {
            throw Error('No workspace connection configured.');
        }
        return workspace.name;
    });
}
exports.createGetWorkspaceUtil = createGetWorkspaceUtil;
/**
 * Methods for storing data source password
 */
exports.passwordMask = '*********';
function storePassword(context, dataSourceName, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const secretName = yield passwordSecretName(context, dataSourceName);
        context.secrets.store(secretName, password);
    });
}
exports.storePassword = storePassword;
function retrievePassword(context, dataSourceName) {
    return __awaiter(this, void 0, void 0, function* () {
        let secretName;
        let password;
        try {
            secretName = yield passwordSecretName(context, dataSourceName);
            password = yield context.secrets.get(secretName);
        }
        catch (error) {
            password = undefined;
        }
        return password || '';
    });
}
exports.retrievePassword = retrievePassword;
function passwordSecretName(context, dataSourceName) {
    return __awaiter(this, void 0, void 0, function* () {
        const dsUri = yield dataSourceUriForName(dataSourceName);
        return `servicebuilder.${dsUri.replace('/', '.')}`;
    });
}
exports.passwordSecretName = passwordSecretName;
function getWorkFolder() {
    // let workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];;
    // if (!workspaceFolder) {
    //     workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
    // }
    if (vscode.workspace.workspaceFolders) {
        return vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
    }
    else {
        throw Error('No workspace folder!');
    }
}
exports.getWorkFolder = getWorkFolder;
function dataSourceUriForName(dataSourceName) {
    return dataSourceUri(fromDataSourceName(dataSourceName));
}
exports.dataSourceUriForName = dataSourceUriForName;
function applicationUriForDataSource(dataSourcePath) {
    return applicationUri(fromDataSource(dataSourcePath));
}
exports.applicationUriForDataSource = applicationUriForDataSource;
function applicationUriForApplication(appPath) {
    return applicationUri(fromApplication(appPath));
}
exports.applicationUriForApplication = applicationUriForApplication;
function applicationUriForModule(modPath) {
    return applicationUri(fromModule(modPath));
}
exports.applicationUriForModule = applicationUriForModule;
function applicationUriForService(servicePath) {
    return applicationUri(fromService(servicePath));
}
exports.applicationUriForService = applicationUriForService;
function applicationUriForTest(testPath) {
    return applicationUri(fromTest(testPath));
}
exports.applicationUriForTest = applicationUriForTest;
function moduleUriForModule(modulePath) {
    return moduleUri(fromModule(modulePath));
}
exports.moduleUriForModule = moduleUriForModule;
function serviceUriForService(servicePath) {
    return serviceUri(fromService(servicePath));
}
exports.serviceUriForService = serviceUriForService;
function dataSourceNameFromUri(uri) {
    const splits = uri.split('/');
    return splits[splits.length - 1];
}
exports.dataSourceNameFromUri = dataSourceNameFromUri;
function servicePathForTest(testPath) {
    const splits = testPath.split('/');
    const l = splits.length;
    splits.pop();
    splits.pop();
    return splits.join('/');
}
exports.servicePathForTest = servicePathForTest;
/*
* Note: data source path format: ~/workspace/application/src/datasource.json
*/
function fromDataSourceName(name) {
    return {
        dataSource: name
    };
}
exports.fromDataSourceName = fromDataSourceName;
/*
* Note: data source path format: ~/workspace/application/src/datasource.json
*/
function fromDataSource(path) {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l - 4],
        application: splits[l - 3]
    };
}
exports.fromDataSource = fromDataSource;
/*
* Note: data source path format: ~/workspace/application
*/
function fromApplication(path) {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l - 2],
        application: splits[l - 1]
    };
}
exports.fromApplication = fromApplication;
/*
* Note: data source path format: ~/workspace/application/src/module
*/
function fromModule(path) {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l - 4],
        application: splits[l - 3],
        module: splits[l - 1]
    };
}
exports.fromModule = fromModule;
/*
* Note: data source path format: ~/workspace/application/src/module/service
*/
function fromService(path) {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l - 5],
        application: splits[l - 4],
        module: splits[l - 2],
        service: splits[l - 1]
    };
}
exports.fromService = fromService;
/*
* Note: data source path format: ~/workspace/application/src/module/service/tests/test12.json
*/
function fromTest(path) {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l - 7],
        application: splits[l - 6],
        module: splits[l - 4],
        service: splits[l - 3]
    };
}
exports.fromTest = fromTest;
/**
 * Functions below produce URIs for builder and devtime.
 * Builder workspace is different from local workfolder.
 */
function dataSourceUri(resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const builderWorkspace = yield getWorkspace();
        return `${builderWorkspace}/${resource.dataSource}`;
    });
}
exports.dataSourceUri = dataSourceUri;
function applicationUri(resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const builderWorkspace = yield getWorkspace();
        return `${builderWorkspace}/${resource.application}`;
    });
}
exports.applicationUri = applicationUri;
function moduleUri(resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const builderWorkspace = yield getWorkspace();
        return `${builderWorkspace}/${resource.application}/${resource.module}`;
    });
}
exports.moduleUri = moduleUri;
function serviceUri(resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const builderWorkspace = yield getWorkspace();
        return `${builderWorkspace}/${resource.application}/${resource.module}/${resource.service}`;
    });
}
exports.serviceUri = serviceUri;
// modified uri with workspace removed
function modifiedUri(uri) {
    return uri.substring(uri.indexOf('/') + 1);
}
exports.modifiedUri = modifiedUri;
/**
 * Data Source Files
 */
function dataSourceFileUri(dataSourceName) {
    return vscode.Uri.joinPath(localDsUri(), `${dataSourceName}.json`);
}
exports.dataSourceFileUri = dataSourceFileUri;
/**
 * File
 */
function readJsonFile(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const uint8Array = yield vscode.workspace.fs.readFile(uri);
        if (uint8Array.length === 0) {
            return {};
        }
        const data = JSON.parse(new util_1.TextDecoder().decode(uint8Array));
        return data;
    });
}
exports.readJsonFile = readJsonFile;
function writeJsonFile(uri, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode.workspace.fs.writeFile(uri, toUint8Array(content));
    });
}
exports.writeJsonFile = writeJsonFile;
function readSqlFile(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield vscode.workspace.openTextDocument(uri);
        const lines = [];
        for (let i = 0; i < doc.lineCount; i++) {
            lines.push(doc.lineAt(i).text);
        }
        return lines;
    });
}
exports.readSqlFile = readSqlFile;
function writeSqlFile(uri, lines) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = lines.join('\n');
        yield vscode.workspace.fs.writeFile(uri, strToBuffer(text));
    });
}
exports.writeSqlFile = writeSqlFile;
function fileExists(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stat = yield vscode.workspace.fs.stat(uri);
            return (stat) ? true : false;
        }
        catch (_a) {
            return false;
        }
    });
}
exports.fileExists = fileExists;
function isApplication(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        return fileExists(vscode.Uri.joinPath(uri, 'src', 'application.json'));
    });
}
exports.isApplication = isApplication;
function isModule(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        return fileExists(vscode.Uri.joinPath(uri, 'module.json'));
    });
}
exports.isModule = isModule;
function isService(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        return fileExists(vscode.Uri.joinPath(uri, 'service.json'));
    });
}
exports.isService = isService;
function testResultUri() {
    return vscode.Uri.joinPath(getWorkFolder().uri, '.builder', 'test', 'TestResult');
}
exports.testResultUri = testResultUri;
function localDsUri() {
    return vscode.Uri.joinPath(getWorkFolder().uri, '.builder', 'datasource');
}
exports.localDsUri = localDsUri;
function devtimeUri() {
    return vscode.Uri.joinPath(getWorkFolder().uri, '.builder', 'devtime');
}
exports.devtimeUri = devtimeUri;
function devtimeAppUri() {
    return vscode.Uri.joinPath(devtimeUri(), 'applications');
}
exports.devtimeAppUri = devtimeAppUri;
function devtimeDsUri() {
    const workfolder = getWorkFolder();
    return vscode.Uri.joinPath(devtimeUri(), 'datasources');
}
exports.devtimeDsUri = devtimeDsUri;
/**
 * Secrete
 */
function readSecret(context, name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return context.secrets.get(name);
        }
        catch (err) {
            return undefined;
        }
    });
}
exports.readSecret = readSecret;
function storeSecret(context, name, value) {
    return __awaiter(this, void 0, void 0, function* () {
        context.secrets.store(qualifiedName(name), value);
    });
}
exports.storeSecret = storeSecret;
function qualifiedName(name) {
    return `${constants.namespace}.${name}`;
}
exports.qualifiedName = qualifiedName;
function storeWorkspace(context, workspace) {
    return __awaiter(this, void 0, void 0, function* () {
        context.secrets.store(qualifiedName('workspace'), JSON.stringify(workspace));
    });
}
exports.storeWorkspace = storeWorkspace;
function readWorkspace(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const json = yield context.secrets.get(qualifiedName('workspace'));
            if (json) {
                return JSON.parse(json);
            }
            else {
                return undefined;
            }
        }
        catch (err) {
            return undefined;
        }
    });
}
exports.readWorkspace = readWorkspace;
/**
 * configuration
 */
function readConfig(name) {
    return __awaiter(this, void 0, void 0, function* () {
        return vscode.workspace.getConfiguration(constants.namespace).get(name);
    });
}
exports.readConfig = readConfig;
/**
 * Misc
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function toUint8Array(content) {
    // return Buffer.from(JSON.stringify(content, null, 4), 'utf8');
    return strToBuffer(JSON.stringify(content, null, 4));
}
exports.toUint8Array = toUint8Array;
function strToBuffer(str) {
    const buffer = new Uint8Array(new ArrayBuffer(str.length));
    for (let i = 0; i < str.length; i++) {
        buffer[i] = str.charCodeAt(i);
    }
    return buffer;
}
exports.strToBuffer = strToBuffer;
class DoubleClick {
    constructor(clickInterval) {
        this.clickInterval = 500;
        this.lastClick = 0;
        this.lastItem = null;
        if (clickInterval) {
            this.clickInterval = clickInterval;
        }
    }
    check(item) {
        const thisClick = new Date().getTime();
        let result = false;
        if (item === this.lastItem && (thisClick - this.lastClick) < this.clickInterval) {
            result = true;
        }
        this.lastClick = thisClick;
        this.lastItem = item;
        return result;
    }
}
exports.DoubleClick = DoubleClick;
/*
* Methods to get file archives
*/
function getArchive(fsPath) {
    const archive = new ZIP();
    archive.addLocalFolder(fsPath);
    const buffer = archive.toBuffer();
    return buffer;
}
exports.getArchive = getArchive;
function getApplicationArchive(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        // get archive
        const buffer = getArchive(uri.fsPath);
        // return
        return buffer;
    });
}
exports.getApplicationArchive = getApplicationArchive;
function initCap(str) {
    if (str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
    else {
        return '';
    }
}
exports.initCap = initCap;
/*
* Methods for showing error
*/
function showErrorStatus(message, error) {
    if (message.length + error.length <= 120) {
        vscode.window.setStatusBarMessage(message + ' ' + error);
    }
    else {
        vscode.window.setStatusBarMessage(message + ' Detail in error message.');
        vscode.window.showErrorMessage(error);
    }
}
exports.showErrorStatus = showErrorStatus;
//# sourceMappingURL=util.js.map
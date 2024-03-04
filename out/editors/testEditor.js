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
exports.TestEditor = void 0;
const vscode = require("vscode");
const util = require("../core/util");
class TestEditor {
    constructor(context, builderClient) {
        this.builderService = builderClient.builderService;
        this.outputChannel = vscode.window.createOutputChannel('Service Builder Test');
        vscode.commands.registerCommand('servicebuilderEditor.runTest', (resource) => this.runTest(resource.path, 'true'));
        vscode.commands.registerCommand('servicebuilderEditor.runTestWithoutCommit', (resource) => this.runTest(resource.path, 'false'));
    }
    runTest(path, withCommit) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'testing service'
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // save test
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        console.log('No active test editor');
                        vscode.window.showErrorMessage('No active editor. Please click the test editor and try again');
                        return;
                    }
                    yield editor.document.save();
                    // read and validate test
                    const test = yield util.readJsonFile(vscode.Uri.parse(path));
                    // prepare request
                    const resource = yield util.fromTest(path);
                    const request = {
                        applicationUri: yield util.applicationUriForTest(path),
                        moduleName: resource.module,
                        serviceName: resource.service,
                        input: JSON.stringify(test.input),
                        operation: test.operation || '',
                        withCommit: withCommit
                    };
                    // zip 
                    const servicePath = yield util.servicePathForTest(path);
                    const fsPath = vscode.Uri.file(servicePath).fsPath;
                    const archive = yield util.getArchive(fsPath);
                    // call service
                    const start = new Date().getTime();
                    const result = yield this.builderService.testService(request, archive);
                    const end = new Date().getTime();
                    // process result
                    const output = (result.succeed) ? result.output : result.exception;
                    const message = (result.succeed) ? `Test sucessful (${end - start} ms)` : `Test exception (${end - start} ms)`;
                    const uri = util.testResultUri();
                    yield util.writeJsonFile(uri, output);
                    vscode.window.showTextDocument(uri, { viewColumn: vscode.ViewColumn.Beside, preview: false, preserveFocus: true });
                    vscode.window.setStatusBarMessage(message);
                }
                catch (error) {
                    console.error('Error in testing service', error);
                    vscode.window.showErrorMessage(error.message);
                }
            }));
        });
    }
    /**
     *
     * @param testPath
     */
    serviceUri(testPath) {
        const servicePath = testPath.substr(0, testPath.indexOf('/tests'));
        return vscode.Uri.file(servicePath);
    }
}
exports.TestEditor = TestEditor;
//# sourceMappingURL=testEditor.js.map
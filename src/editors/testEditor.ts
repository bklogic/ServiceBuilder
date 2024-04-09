import * as vscode from 'vscode';
import * as util from '../core/util';
import {
    BuilderService
} from '../backend/builder/builderService';
import {
    BuilderClient
} from '../backend/builder/builderClient';
import {
    TestServiceRequest, TestServiceResult
} from '../backend/builder/builderModel';


export class TestEditor {
    private builderService: BuilderService; 

    constructor(context: vscode.ExtensionContext, builderClient: BuilderClient) {
        const testResultScheme = 'TestResult';
        this.builderService = builderClient.builderService;
		vscode.commands.registerCommand('servicebuilderEditor.runTest', (resource) => this.runTest(resource.path, 'true'));
		vscode.commands.registerCommand('servicebuilderEditor.runTestWithoutCommit', (resource) => this.runTest(resource.path, 'false'));        
        vscode.workspace.registerTextDocumentContentProvider(testResultScheme, new TestResultContentProvider());
    }

    async runTest(path: string, withCommit: string) {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            cancellable: false,
            title: 'testing service'
        }, async (progress) => {
            try {
                // save test
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    console.log('No active test editor');
                    vscode.window.showErrorMessage('No active editor. Please click the test editor and try again');
                    return;
                }
                await editor.document.save();

                // read and validate test
                const test: Test = await util.readJsonFile(vscode.Uri.parse(path));
                
                // prepare request
                const resource = await util.fromTest(path);
                const request: TestServiceRequest = {
                    applicationUri: await util.applicationUriForTest(path),
                    moduleName: resource.module,
                    serviceName: resource.service,
                    input: JSON.stringify(test.input),
                    operation: test.operation || '',
                    withCommit: withCommit
                };

				// zip 
                const servicePath = await util.servicePathForTest(path);
                const fsPath = vscode.Uri.file(servicePath).fsPath;
				const archive = await util.getArchive(fsPath);

				// call service
                const start = new Date().getTime();
                const result: TestServiceResult = await this.builderService.testService(request, archive);
                const end = new Date().getTime();

                // process result
                const output = (result.succeed) ? result.output : result.exception;
                const message = (result.succeed) ? `Test successful (${end-start} ms)` : `Test exception (${end-start} ms)`;
                const uri = vscode.Uri.parse('TestResult:TestResult');
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document, {viewColumn: vscode.ViewColumn.Beside, preview: false, preserveFocus: true});

                // update document
                const range = new vscode.Range(
                    document.positionAt(0), // Start position (line 0, character 0)
                    document.positionAt(document.getText().length) // End position (last character)
                );
                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, range, JSON.stringify(output, undefined, 4));
                await vscode.workspace.applyEdit(edit);

                // update test status
                vscode.window.setStatusBarMessage(message);
            } catch (error: any) {
                console.error('Error in testing service', error);
                vscode.window.showErrorMessage(error.message);
            }
        });
    }

    /**
     * 
     * @param testPath 
     */
    serviceUri(testPath: string): vscode.Uri {
        const servicePath = testPath.substring(0, testPath.indexOf('/tests')); 
        return vscode.Uri.file(servicePath);
    }

}


export class TestResultContentProvider implements vscode.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vscode.Uri): string {
        return '';
    }
};


export interface Test {
    name: string,
    input: any,
    operation: string
}

export interface TestBlock {
    start: number,
    end: number
}

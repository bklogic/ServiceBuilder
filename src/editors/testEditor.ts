import * as vscode from 'vscode';
import * as util from '../core/util';
import {
    BuilderService
} from '../backend/builderService';
import {
    TestServiceRequest, TestServiceResult
} from '../backend/builderModel';

export class TestEditor {
    private builderService: BuilderService; 
    private outputChannel;

    constructor(context: vscode.ExtensionContext, buildService: BuilderService) {
        this.builderService = buildService;
        this.outputChannel = vscode.window.createOutputChannel('Service Builder Test');
		vscode.commands.registerCommand('servicebuilderEditor.runTest', (resource) => this.runTest(resource.path, 'true'));
		vscode.commands.registerCommand('servicebuilderEditor.runTestWithoutCommit', (resource) => this.runTest(resource.path, 'false'));
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
                const result: TestServiceResult = await this.builderService.testService(request, archive);

                // process result
                this.outputChannel.clear();
                let output = (result.succeed) ? result.output : result.exception;
                this.outputChannel.appendLine( (result.succeed) ? 'TEST OUTPUT: ' : 'TEST EXCEPTION: ');
                this.outputChannel.append(JSON.stringify(output, null, 4));
                this.outputChannel.show(true);

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
        const servicePath = testPath.substr(0, testPath.indexOf('/tests'));
        return vscode.Uri.file(servicePath);
    }

}

export interface Test {
    name: string,
    input: any,
    operation: string
}

export interface TestBlock {
    start: number,
    end: number
}

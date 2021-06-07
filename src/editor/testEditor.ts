import * as vscode from 'vscode';
import * as util from '../core/util';
import {
    BuilderService, 
    TestServiceRequest, TestServiceResult
} from '../core/builderService';

export class TestEditor {
    private builderService: BuilderService; 
    private outputChannel;

    constructor(context: vscode.ExtensionContext, buildService: BuilderService) {
        this.builderService = buildService;
        this.outputChannel = vscode.window.createOutputChannel('Service Builder Test');
		vscode.commands.registerCommand('servicebuilderEditor.runTest', (resource) => this.runTest(resource.path));
    }

    async runTest(path: string) {
		try {
            // save test
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                console.log('No active test editor');
                vscode.window.showErrorMessage('No active editor. Please click the test editor and try again');
                return;
            }
            await editor.document.save();

			// prepare request
            const resource = util.fromTest(path);
            const test: Test = await util.readJsonFile(vscode.Uri.parse(path));
			const request: TestServiceRequest = {
				applicationUri: `${resource.workspace}/${resource.application}`,
                moduleName: resource.module,
                serviceName: resource.service,
                input: test.input,
                operation: test.operation,
                withCommit: true
            };
			// call service
			const result: TestServiceResult = await this.builderService.testService(request);
			// process result
            this.outputChannel.clear();
            let output = (result.succeed) ? result.output : result.exception;
            this.outputChannel.appendLine( (result.succeed) ? 'TEST OUTPUT: ' : 'TEST EXCEPTION: ');
            this.outputChannel.append(JSON.stringify(output, null, 4));
            this.outputChannel.show(false);
		} catch (error) {
			console.error('Error in testing service', error);
			vscode.window.showErrorMessage(error.message);
		}
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

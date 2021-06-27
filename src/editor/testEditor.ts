import * as vscode from 'vscode';
import * as util from '../core/util';
import * as model from '../core/model';
import {
    BuilderService, 
    TestServiceRequest, TestServiceResult
} from '../core/builderService';
import { ServiceReader } from '../core/serviceReader';

export class TestEditor {
    private serviceReader: ServiceReader;
    private builderService: BuilderService; 
    private outputChannel;

    constructor(context: vscode.ExtensionContext, buildService: BuilderService) {
        this.builderService = buildService;
        this.serviceReader = new ServiceReader();
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
            const test: Test = await util.readJsonFile(vscode.Uri.parse(path));
			const request: TestServiceRequest = {
                applicationUri: await util.applicationUriForTest(path),
                serviceSpec: await this.serviceReader.getService(this.serviceUri(path)),
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

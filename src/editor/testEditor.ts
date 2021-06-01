import * as vscode from 'vscode';
import {TestService} from './testService';

export class TestEditor {
    private testService: TestService;

    constructor(context: vscode.ExtensionContext) {
        this.testService = new TestService();
		vscode.commands.registerCommand('servicebuilderEditor.addTest', (resource) => this.addTest(resource.path));
		vscode.commands.registerCommand('servicebuilderEditor.runTest', (resource) => this.runTest(resource));
    }

    addTest(resource: string) {
        console.log('add test...');
    }

    runTest(test: any) {
        console.log('run test...');
        console.log(test);
        // this.testService.runTest();
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

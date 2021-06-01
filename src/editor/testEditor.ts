import * as vscode from 'vscode';
import {TestService} from './testService';

// export class TestCodeLensProvider implements vscode.CodeLensProvider {
//     construct() {}

//     public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
//         const codeLens: vscode.CodeLens[] = [];
//         const lines: string[] = document.getText().split(/\r?\n/g);
//         const blocks: TestBlock[] = this.getTestRanges(lines);

//         for (const block of blocks) {
//             const test = this.getTest(lines, block);
//             const range = new vscode.Range(block.start, 0, block.end, 0);
//             const cmd: vscode.Command = {
//                 arguments: [test],
//                 title: 'Run',
//                 command: 'serviceBuilder.runTest'
//             };
//             codeLens.push(new vscode.CodeLens(range, cmd));
//         }

//         return Promise.resolve(codeLens);
//     }

//     getTestRanges(lines: string[]): TestBlock[] {
//         const blocks: TestBlock[] = [];
//         const testLineNumbers = lines.filter( (line) => {
//             line.match(/^TEST\.*/);
//         })
//         .map(([index, ]) => +index);

//         let start = 0;
//         let end = testLineNumbers[0] - 1;
//         for (const lineNumber of testLineNumbers) {
//             start = end + 1;
//             end = lineNumber - 1;
//             if (start < end) {
//                 blocks.push({start: start, end: end});
//             }
//         } 
//         blocks.push({start: end+1, end: lines.length-1});
//         return blocks;
//     }

//     getTest(lines: string[], block: TestBlock): Test {
//         let testString = '';
//         for (let i = block.start+1; i <= block.end; i++) {
//             testString = testString + lines[i];
//         }
//         return JSON.parse(testString) as Test;
//     }
// }

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


import * as vscode from 'vscode';
import * as util from '../core/util';
import {
    BuilderService
} from '../services/builderService';
import {
    DataSource,
    TestDataSourceRequest,
} from '../model/builder';

export class DataSourceEditor {

    private context: vscode.ExtensionContext;
    private builderService: BuilderService;
    
    constructor(context: vscode.ExtensionContext, builderService: BuilderService) {
        this.context = context;
        this.builderService = builderService;
		vscode.commands.registerCommand('servicebuilderEditor.testDataSource', (resource) => this.testDataSource(resource.path));
    }

    async testDataSource(path: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        // if no editor. Inpossible to happen.
        if (!editor) {
            vscode.window.showErrorMessage('no active editor. impossible.'); 
            return;
        }
        // continue
        try {
            // read data source config
            const dataSource = JSON.parse(editor.document.getText()) as DataSource;
            if (dataSource.password === util.passwordMask) {
                dataSource.password = await util.retrievePassword(this.context, path);
            }

            // make request
            const testRequest: TestDataSourceRequest = {
                applicationUri: await util.applicationUriForDataSource(path),
                dbType: dataSource.dbType,
                host: dataSource.host,
                port: dataSource.port,
                database: dataSource.database,
                username: dataSource.username,
                password: dataSource.password
            };
            // call service
            const result = await this.builderService.testDataSource(testRequest);
            if (result.succeed) {
                // store password in secret
                util.storePassword(this.context, path,  dataSource.password);
                // save data source file
                dataSource.password = util.passwordMask;
                const text = JSON.stringify(dataSource, null, 4) + "\n"; 
                editor.edit(rewriteDocumentCallback(editor, text));       
                await editor.document.save();
                // inform user
                vscode.window.showInformationMessage(result.message);
            } else {
                vscode.window.showWarningMessage(result.message);
            }            
        } catch (error: any) {
            vscode.window.showErrorMessage('failed. cause: ' + error.message);
        }
    }
}

export function rewriteDocumentCallback(editor: vscode.TextEditor, newText: string): (editBuilder: vscode.TextEditorEdit) => void {
    const endLineNumber = editor.document.lineCount-1;
    const endLine = editor.document.lineAt(endLineNumber);
    const range = new vscode.Range(new vscode.Position(0,0), endLine.range.end);

    return function(editBuilder: vscode.TextEditorEdit) {
        editBuilder.replace(range, newText);
    };
}


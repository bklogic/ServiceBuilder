
import * as vscode from 'vscode';
import {
    BuilderService, 
    DataSourceConfig, DeployResult,
    TestDataSourceRequest, TestDataSourceResult
} from '../core/builderService';
import * as util from '../core/util';

export class DataSourceEditor {

    private builderService: BuilderService;
    
    constructor(context: vscode.ExtensionContext, builderService: BuilderService) {
        this.builderService = builderService;
		vscode.commands.registerCommand('servicebuilderEditor.testDataSource', (resource) => this.testDataSource(resource.path));
		vscode.commands.registerCommand('servicebuilderEditor.applyDataSource', (resource) => this.applyDataSource(resource.path));
    }

    async testDataSource(resource: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        // if no editor. Inpossible to happen.
        if (!editor) {
            vscode.window.showErrorMessage('no active editor. impossible.'); 
            return;
        }
        // continue
        try {
            const dataSource = JSON.parse(editor.document.getText()) as DataSource;
            const testRequest: TestDataSourceRequest = {
                dbType: dataSource.dbType,
                jdbcUrl: 'jdbc:' + dataSource.url,
                username: dataSource.username,
                password: dataSource.password
            };

            const result = await this.builderService.testDataSource(testRequest);

            if (result.succeed) {
                vscode.window.showInformationMessage(result.message);
            } else {
                vscode.window.showWarningMessage(result.message);
            }            
        } catch (error) {
            vscode.window.showErrorMessage('failed. cause: ' + error.message);
        }
    }

    async applyDataSource(resource: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                // deploy data source
                const dataSource = JSON.parse(editor.document.getText()) as DataSource;
                const dataSourceConfig: DataSourceConfig = {
                    applicationUri: util.applicationUriForDataSource(editor.document.uri.path),
                    dbType: dataSource.dbType,
                    jdbcUrl: 'jdbc:' + dataSource.url,
                    username: dataSource.username,
                    password: dataSource.password    
                };
                const result: DeployResult = await this.builderService.deployDataSource(dataSourceConfig);

                // save data source
                dataSource.password = "**********";
                const text = JSON.stringify(dataSource, null, 4) + "\n"; 
                editor.edit(rewriteDocumentCallback(editor, text));       
                await editor.document.save();

                // inform user
                vscode.window.showInformationMessage("Data source saved and applied in workspace");
            } catch (error) {
                vscode.window.showErrorMessage('failed. cause: ' + error.message);
            }
        } else {
            vscode.window.showErrorMessage('no active editor. impossible.');
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

export interface DataSource {
    dbType: string;
    url: string;
    username: string;
    password: string;
}

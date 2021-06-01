
import * as vscode from 'vscode';
import {DataSource, DataSourceService} from './dataSourceService';

export class DataSourceEditor {

    private dsService: DataSourceService;
    
    constructor(context: vscode.ExtensionContext) {
        this.dsService = new DataSourceService();
		vscode.commands.registerCommand('servicebuilderEditor.testDataSource', (resource) => this.testDataSource(resource.path));
		vscode.commands.registerCommand('servicebuilderEditor.applyDataSource', (resource) => this.applyDataSource(resource.path));
    }


    testDataSource(resource: string): void {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                const dataSource = JSON.parse(editor.document.getText()) as DataSource;
                this.dsService.testDataSource(dataSource).then( (message) => {
                    vscode.window.showInformationMessage(message);
                });
            } catch (error) {
                vscode.window.showErrorMessage('failed. cause: ' + error.message);
            }
        } else {
            vscode.window.showErrorMessage('no active editor. impossible.');
        }        
    }

    async applyDataSource(resource: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                const dataSource = JSON.parse(editor.document.getText()) as DataSource;
                await this.dsService.deployDataSource(dataSource);
                dataSource.password = "**********";
                const text = JSON.stringify(dataSource, null, 4) + "\n"; 
                editor.edit(rewriteDocumentCallback(editor, text));       
                await editor.document.save();
                vscode.window.showInformationMessage("Data source saved in workspace");
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

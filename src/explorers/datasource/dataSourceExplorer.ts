
import { utils } from 'mocha';
import * as vscode from 'vscode';
import * as util from '../../core/util';
import { BuilderClient } from '../../backend/builder/builderClient';
import { DataSourceItem } from './dataSourceDataModel';
import {DataSourceDataProvider} from './dataSourceDataProvider';
import {DataSourceExplorerService} from './dataSourceExplorerService';

export class DataSourceExplorer {
    private dataProvider: DataSourceDataProvider;
    private treeView: vscode.TreeView<DataSourceItem>;
    private explorerService: DataSourceExplorerService;

    constructor(context: vscode.ExtensionContext, builderClient: BuilderClient) {
        // set up tree view
        this.dataProvider = new DataSourceDataProvider();
        this.treeView = vscode.window.createTreeView('servicebuilderDataSourceExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
        context.subscriptions.push(this.treeView);

        // instantiate explorer service
        this.explorerService = new DataSourceExplorerService(context, builderClient);

        // register commands
		vscode.commands.registerCommand('servicebuilderDataSourceExplorer.refresh', (resource) => this.refresh());        
		vscode.commands.registerCommand('servicebuilderDataSourceExplorer.addDataSource', (resource) => this.addDataSource()); 
		vscode.commands.registerCommand('servicebuilderDataSourceExplorer.testDataSource', (resource) => this.testDataSource(resource));        
		vscode.commands.registerCommand('servicebuilderDataSourceExplorer.deployDataSource', (resource) => this.deployDataSource(resource));        
		vscode.commands.registerCommand('servicebuilderDataSourceExplorer.renameDataSource', (resource) => this.renameDataSource(resource));        
		vscode.commands.registerCommand('servicebuilderDataSourceExplorer.deleteDataSource', (resource) => this.deleteDataSource(resource));        
    }

    refresh(): void {
		this.dataProvider.refresh();
    }

    async addDataSource(): Promise<void> {
        // collect data source name
        const dataSourceName = await vscode.window.showInputBox({
            placeHolder: 'Data source name',
            prompt: "Enter a name for data source"
        });
        if (!dataSourceName) {
            vscode.window.setStatusBarMessage('No data source name entered.');
            return;
        }

        // collect database type
        const items = ['mysql', 'postgresql', 'oracle', 'sqlserver'];
        const dbType = await vscode.window.showQuickPick(items, {
            placeHolder: 'Database type',
            canPickMany: false
        });
        if (!dbType) {
            vscode.window.setStatusBarMessage('No database type picked.');
            return;
        }

        // create data source
        try {
            await this.explorerService.createDataSource(dataSourceName, dbType);
            vscode.window.setStatusBarMessage('Data source created.');
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to create data source: ${err.message}`);
        }

        // refresh explore
        this.refresh();
    }

    async testDataSource(item: DataSourceItem): Promise<void> {
        vscode.window.setStatusBarMessage('Data source test in progress ...');
        //
        try {
            const message = await this.explorerService.testDataSource(item);
            if (message) {
                vscode.window.setStatusBarMessage(message);
            } else {
                vscode.window.setStatusBarMessage('Data source test succeeded.');
            }
        } catch (err: any) {
            util.showErrorStatus('Test data source error.', err.message); 
            vscode.window.setStatusBarMessage('');
        }
    }

    async deployDataSource(item: DataSourceItem): Promise<void> {
        vscode.window.setStatusBarMessage('Deploying data source ...');
        //
        try {
            await this.explorerService.deployDataSource(item);
            vscode.window.setStatusBarMessage('Data source deployed.');
        } catch (err: any) {
            util.showErrorStatus('Data source deployment failed.', err.message); 
        }
    }

    async renameDataSource(item: DataSourceItem): Promise<void> {
        // collect new name
        const newName = await vscode.window.showInputBox({
            placeHolder: 'New Data source name',
            prompt: "Enter a new name for data source"
            
        });
        if (!newName) {
            vscode.window.setStatusBarMessage('No data source name entered.');
            return;
        }

        // change name
        try {
            await this.explorerService.renameDataSource(item, newName);
            vscode.window.setStatusBarMessage('Data source renamed. You need to make sure that applications use the new name.');    
            this.refresh();
        } catch (err: any) {
            vscode.window.showErrorMessage(`Data source rename failed: ${err.message}`);    
        }
    }

    async deleteDataSource(item: DataSourceItem): Promise<void> {
        try {
            await this.explorerService.deleteDataSource(item);
            vscode.window.setStatusBarMessage('Data source deleted.');
            this.refresh();
        } catch (err: any) {
            vscode.window.showErrorMessage(`Data source delete failed: ${err.message}`);    
        }
    }

}
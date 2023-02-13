import * as vscode from 'vscode';
import * as util from '../../core/util';
import { DeploymentDataProvider } from './deploymentDataProvider';
import { Item } from './deploymentModel';
import { DeploymentExplorerService } from './deploymentExplorerService';
import { BuilderClient } from '../../backend/builder/builderClient';

export class DeploymentExplorer {

    private dataProvider: DeploymentDataProvider;
    private treeView: vscode.TreeView<Item>;
    private explorerService: DeploymentExplorerService;
	private doubleClick = new util.DoubleClick();

    constructor(context: vscode.ExtensionContext, builderClient: BuilderClient) {
        this.explorerService = new DeploymentExplorerService(context, builderClient);
        this.dataProvider = new DeploymentDataProvider();
        this.treeView = vscode.window.createTreeView('servicedeploymentExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
        context.subscriptions.push(this.treeView);
		vscode.commands.registerCommand('servicedeploymentExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.refresh', () => this.refresh());
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshDataSourceList', (resource) => this.refreshDataSourceList(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshDataSource', (resource) => this.refreshDataSource(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.testDataSource', (resource) => this.testDataSource(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.cleanDataSource', (resource) => this.cleanDataSource(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshAppList', (resource) => this.refreshAppList(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshApplication', (resource) => this.refreshApplication(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.loadTest', (resource) => this.loadTest(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.showInvalidatedReason', (resource) => this.showInvalidatedReason(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.viewDataSource', (resource) => this.viewDataSource(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.viewService', (resource) => this.viewService(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.cleanApplication', (resource) => this.cleanApplication(resource));        
    }

	openResource(resource: Item): void {
		vscode.window.showTextDocument(resource.fileUri, {preview: !this.doubleClick.check(resource)});
	}

	async refresh(): Promise<void> {
		this.dataProvider.refresh();
	}

	async refreshDataSourceList(item: Item): Promise<void> {
        try {
            await this.explorerService.refreshDataSourceList(item);
            await util.sleep(200);
            this.refresh();
            this.treeView.reveal(item, {expand: 2, focus: true, select: true});
            vscode.window.setStatusBarMessage('Data source list refreshed.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
	}

	async refreshDataSource(item: Item): Promise<void> {
        try {
            await this.explorerService.refreshDataSource(item);
            vscode.window.setStatusBarMessage('Data source refreshed.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
	}

	async cleanDataSource(item: Item): Promise<void> {
        try {
            await this.explorerService.cleanDataSource(item);
            vscode.window.setStatusBarMessage('Data source cleaned.');
            this.dataProvider.fire(item.parent);
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
	}

    async testDataSource(item: Item): Promise<void> {
        vscode.window.setStatusBarMessage('Data source test in progress ...');
        //
        try {
            const message = await this.explorerService.testDataSource(item);
            if (message) {
                vscode.window.setStatusBarMessage(`Failed: ${message}`);
            } else {
                vscode.window.setStatusBarMessage('Succeeded');
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`Test data source error: ${err.message}`);    
        }
    }

    async refreshAppList(apps: Item): Promise<void> {
        try {
            await this.explorerService.refreshAppList();
            await util.sleep(200);
            this.refresh();
            this.treeView.reveal(apps, {expand: 2, focus: true, select: true});
            vscode.window.setStatusBarMessage('Application list refreshed.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
	}

	async refreshApplication(app: Item): Promise<void> {
        try {
            await this.explorerService.refreshApp(app);
            this.dataProvider.refresh();
            this.treeView.reveal(app, {expand: 2, focus: true, select: true});
            vscode.window.setStatusBarMessage('Application refreshed.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
	}

    async loadTest(service: Item): Promise<void> {
        try {
            await this.explorerService.reloadTests(service);
            await util.sleep(100);
            this.dataProvider.fire(service);
            this.treeView.reveal(service, {expand: 2, focus: true, select: true});
            vscode.window.showTextDocument(vscode.Uri.joinPath(service.fileUri, 'tests.http'), {preview: false});
            vscode.window.setStatusBarMessage('Tests generated.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    async showInvalidatedReason(service: Item): Promise<void> {
        const reason = await this.explorerService.getInvalidatedReason(service);
        vscode.window.setStatusBarMessage('Invalidated reason: ' + reason);
    }

    async viewDataSource(app: Item): Promise<void> {
        try {
            const docUri = await this.explorerService.loadDataSource(app);
            vscode.window.showTextDocument(docUri);
            vscode.window.setStatusBarMessage('Data source loaded.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    async cleanApplication(app: Item): Promise<void> {
        try {
            await this.explorerService.cleanApplication(app);
            util.sleep(200);
            this.dataProvider.refresh();
            vscode.window.setStatusBarMessage('Application cleaned');
            this.dataProvider.fire(app.parent);
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    async viewService(service: Item): Promise<void> {
        try {
            const docUri = await this.explorerService.loadService(service);
            vscode.window.showTextDocument(docUri);
            vscode.window.setStatusBarMessage('Service loaded.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

}
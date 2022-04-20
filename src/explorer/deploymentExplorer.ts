import * as vscode from 'vscode';
import * as util from '../core/util';
import { DeployService } from '../core/deployService';
import { DeploymentDataProvider } from './deploymentDataProvider';
import { Item } from './deploymentModel';
import { DeploymentService } from './DeploymentService';

export class DeploymentExplorer {

    private context: vscode.ExtensionContext;
    private dataProvider: DeploymentDataProvider;
    private treeView: vscode.TreeView<Item>;
    private deploymentService: DeploymentService;
	private doubleClick = new util.DoubleClick();

    constructor(context: vscode.ExtensionContext, deployService: DeployService) {
        this.context = context;
        this.deploymentService = new DeploymentService(context, deployService);
        this.dataProvider = new DeploymentDataProvider(this.deploymentService);
        this.treeView = vscode.window.createTreeView('servicedeploymentExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
        context.subscriptions.push(this.treeView);
		vscode.commands.registerCommand('servicedeploymentExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshAppList', () => this.refreshAppList());
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshApplication', (resource) => this.refreshApplication(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.loadTest', (resource) => this.loadTest(resource));
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

	async refreshAppList(): Promise<void> {
        try {
            await this.deploymentService.refreshAppList();
            await util.sleep(200);
            this.refresh();
            vscode.window.setStatusBarMessage('Application list refreshed.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
	}

	async refreshApplication(app: Item): Promise<void> {
        try {
            await this.deploymentService.refreshApp(app);
            this.dataProvider.refresh();
            this.treeView.reveal(app, {expand: 2, focus: true, select: true});
            vscode.window.setStatusBarMessage('Application loaded.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
	}

    async loadTest(service: Item): Promise<void> {
        try {
            await this.deploymentService.reloadTests(service);
            await util.sleep(100);
            this.dataProvider.fire(service);
            this.treeView.reveal(service, {expand: 2, focus: true, select: true});
            vscode.window.showTextDocument(vscode.Uri.joinPath(service.fileUri, 'tests.http'), {preview: false});
            vscode.window.setStatusBarMessage('Tests generated.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    async viewDataSource(app: Item): Promise<void> {
        try {
            const docUri = await this.deploymentService.loadDataSource(app);
            vscode.window.showTextDocument(docUri);
            vscode.window.setStatusBarMessage('Data source loaded.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    async cleanApplication(app: Item): Promise<void> {
        try {
            await this.deploymentService.cleanApplication(app);
            util.sleep(200);
            this.dataProvider.refresh();
            vscode.window.setStatusBarMessage('Application cleaned');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

    async viewService(service: Item): Promise<void> {
        try {
            const docUri = await this.deploymentService.loadService(service);
            vscode.window.showTextDocument(docUri);
            vscode.window.setStatusBarMessage('Service loaded.');
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }

}
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
		vscode.commands.registerCommand('servicedeploymentExplorer.refresh', () => this.refresh());
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshAppList', () => this.refreshAppList());
		vscode.commands.registerCommand('servicedeploymentExplorer.refreshApplication', (resource) => this.refreshApplication(resource));
		vscode.commands.registerCommand('servicedeploymentExplorer.loadTest', (resource) => this.loadTest(resource));
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
            await util.sleep(100);
            this.refresh();
            vscode.window.setStatusBarMessage('application list refreshed.');
        } catch (error) {
            vscode.window.showErrorMessage(error.message);
        }
	}

	async refreshApplication(app: Item): Promise<void> {
        try {
            await this.deploymentService.refreshApp(app);
            this.dataProvider.refresh();
            this.treeView.reveal(app, {expand: 2, focus: true, select: true});
            vscode.window.setStatusBarMessage('application reloaded.');
        } catch (error) {
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
            vscode.window.setStatusBarMessage('tests generated.');
        } catch (error) {
            vscode.window.showErrorMessage(error.message);
        }
    }

}
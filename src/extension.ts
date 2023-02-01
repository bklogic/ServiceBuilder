// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as util from './core/util';
import { BuilderService } from './services/builderService';
import { ApplicationExplorer } from './explorer/applicationExplorer';
import { TestEditor } from './editors/testEditor';
import { DeployService } from './services/deployService';
import { DeploymentExplorer } from './explorer/deploymentExplorer';
import { HttpService } from './core/httpService';
import { TryService } from './explorer/tryService';
import { WorkspaceHandler } from './explorer/workspaceHandler';
import { TryHandler } from './explorer/tryHandler';
import { ApplicationService } from './explorer/applicationService';
import { DataSourceExplorer } from './explorer/dataSourceExplorer';
import { TestService } from './services/testService';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// initiate util
	util.createGetWorkspaceUtil(context);

	// construct builder service
	const httpService = new HttpService(context);
	const builderService = new BuilderService(httpService);
	const deployService = new DeployService(httpService);
	const testService = new TestService(httpService);
	const tryService = new TryService(httpService);
	const appService = new ApplicationService();

	// register viewVersion command
	let disposable = vscode.commands.registerCommand('servicebuilder.versions', () => {
		builderService.getBuilderVersions()
			.then( versions => {
				const msg = `Engine: ${versions.engine} | Deployer: ${versions.deployer} | Builder: ${versions.builder}.`;
				vscode.window.showInformationMessage(msg);
			});
	});	
	context.subscriptions.push(disposable);

	// explorer
	new ApplicationExplorer(context, appService, builderService);
	new DeploymentExplorer(context, deployService, testService);
	new DataSourceExplorer(context, builderService);
	new WorkspaceHandler(context, builderService, tryService);
	new TryHandler(tryService);

	// editors
	new TestEditor(context, builderService);

}

// this method is called when your extension is deactivated
export function deactivate() {}

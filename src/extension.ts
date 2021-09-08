// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as util from './core/util';
import { BuilderService } from './core/builderService';
import { ApplicationExplorer } from './explorer/applicationExplorer';
import { DataSourceEditor } from './editor/dataSourceEditor';
import { TestEditor } from './editor/testEditor';
import { DeployService } from './core/deployService';
import { DeploymentExplorer } from './explorer/deploymentExplorer';
import { HttpService } from './core/httpService';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// check env
	let ws = process.env.WORKSPACE; 
	let url = process.env.BUILDERURL;
	let token = process.env.BUILDERTOKEN;
	if (ws) {
		console.log("preset builder workspace: " + ws);
		context.secrets.store('servicebuilder.workspace', ws);
	}
	if (url) {
		console.log("preset builder url: " + url);
		context.secrets.store('servicebuilder.url', url);
	}
	if (token) {
		context.secrets.store('servicebuilder.token', token);
	}

	// initiate util
	util.createGetWorkspaceUtil(context);

	// construct builder service
	const httpService = new HttpService(context);
	const builderService = new BuilderService(httpService);
	const deployService = new DeployService(httpService);

	// register viewVersion command
	let disposable = vscode.commands.registerCommand('servicebuilder.versions', () => {
		const versions = builderService.getBuilderVersions()
			.then( versions => {
				const msg = `Specification: ${versions.specification} | Engine: ${versions.engine} | Builder: ${versions.builder}.`;
				vscode.window.showInformationMessage(msg);
			});
	});	
	context.subscriptions.push(disposable);

	// explorer
	new ApplicationExplorer(context, builderService);
	new DeploymentExplorer(context, deployService);

	// editors
	new DataSourceEditor(context, builderService);
	new TestEditor(context, builderService);

	// open welcome
	vscode.commands.executeCommand("servicebuilderExplorer.openWelcome");	
}

// this method is called when your extension is deactivated
export function deactivate() {}

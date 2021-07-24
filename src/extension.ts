// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as util from './core/util';
import { BuilderService } from './core/builderService';
import { ApplicationExplorer } from './explorer/applicationExplorer';
import { DataSourceEditor } from './editor/dataSourceEditor';
import { TestEditor } from './editor/testEditor';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// check env
	const ws = process.env.WORKSPACE; 
	const url = process.env.BUILDERURL;
	const token = process.env.BUILDERTOKEN;
	if (ws) {
		console.log("preset workspace: " + ws);
		context.secrets.store('servicebuilder.workspace', ws);
	}
	if (url) {
		console.log("preset builder: " + url);
		context.secrets.store('servicebuilder.url', url);
	}
	if (token) {
		context.secrets.store('servicebuilder.token', token);
	}

	// initiate util
	util.createGetWorkspaceUtil(context);

	// construct builder service
	const builderService = new BuilderService(context);

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

	// editors
	new DataSourceEditor(context, builderService);
	new TestEditor(context, builderService);

	// open welcome
	vscode.commands.executeCommand("servicebuilderExplorer.openWelcome");	
}

// this method is called when your extension is deactivated
export function deactivate() {}

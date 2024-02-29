// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as util from './core/util';
import { ApplicationExplorer } from './explorers/application/applicationExplorer';
import { TestEditor } from './editors/testEditor';
import { DeploymentExplorer } from './explorers/deployment/deploymentExplorer';
import { HttpService } from './core/httpService';
import { DataSourceExplorer } from './explorers/datasource/dataSourceExplorer';
import { BuilderClient } from './backend/builder/builderClient';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// initiate util
	util.createGetWorkspaceUtil(context);

	// construct client services
	const httpService = new HttpService(context);
	const builderClient = new BuilderClient(httpService);

	// explorer
	new ApplicationExplorer(context, builderClient);
	new DeploymentExplorer(context, builderClient);
	new DataSourceExplorer(context, builderClient);

	// editors
	new TestEditor(context, builderClient);

}

// this method is called when your extension is deactivated
export function deactivate() {}

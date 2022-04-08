import * as vscode from 'vscode';
import * as path from 'path';
import * as util from '../core/util';
import {TryService} from "./tryService";
import { TryWorkspace } from './tryModel';

export class TryHandler {
	private context: vscode.ExtensionContext;
    private tryService: TryService;

	constructor(context: vscode.ExtensionContext, tryService: TryService) {
        this.context = context;
        this.tryService = tryService;
		// vscode.commands.registerCommand('servicebuilderExplorer.try', () => this.try());
    }

	async try(): Promise<void> {
		// request workspace
		try {
			const workspace = await this.tryService.requestTryWorkspace();

            if (workspace) {
                const proceedBtn = "Proceed"; 
                vscode.window.showInformationMessage(
                    `Workspace is connected. \n
                     Name: ${workspace?.workspaceName}
                     Url: ${workspace?.workspaceUrl}
                     Access Token: ${workspace?.accessToken}`,
                     { modal: true },
                     proceedBtn
                ).then( btn => {
                    if ( btn === proceedBtn) {
                        this.startTrySession(workspace);
                    }
                });    
            } else {
                vscode.window.showInformationMessage(
                    "All workspaces are taken at the moment. Please try later."
                );    
            }
		} catch(error: any) {
            console.error('Error in requesting workspace.', error);
            vscode.window.showErrorMessage(
                error.message
            );    
        }

		// display message
	}

    async startTrySession(workspace: TryWorkspace) {
        
    }

}
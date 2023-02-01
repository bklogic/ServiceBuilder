import * as vscode from 'vscode';
import * as util from '../../core/util';
import {TryService} from "./tryService";
import { TryWorkspace, TrySession, TryDataSource } from './tryModel';
import { DataSource } from '../../model/dataSource';
import {ApplicationExplorer} from "./applicationExplorer";
import { DeployService } from '../../services/deployService';

export class TryHandler {
    private tryService: TryService;

	constructor(tryService: TryService) {
        this.tryService = tryService;
		vscode.commands.registerCommand('servicebuilderExplorer.request', () => this.request());
    }

	async request(): Promise<void> {
        let result: string;

        // collect email
        const email = await vscode.window.showInputBox({
            placeHolder: 'Email',
            prompt: "email to receive workspace info"
        });	

        // validate email string
        const emailRegex = '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$';
        if (!email) {
            vscode.window.setStatusBarMessage("No email entered.");
            return;
        }
        else if (!email.match(emailRegex)) {
            vscode.window.setStatusBarMessage("Invalid email string.");
            return;
        }

        // collect request type
        let items = ['Workspace only', 'Workspace and database for tutorial'];
        let options = {ignoreFocusOut: true, placeHolder: "Workspace type", value: "Yes", canPickMany: false};
        let reqType = await vscode.window.showQuickPick(items, options);
        if (!reqType) {
            vscode.window.setStatusBarMessage("No workspace type selected.");
            return;
        }
        reqType = reqType.includes('database') ? 'starter' : 'basic';

        // collect mailing list selection
        items = ['Yes', 'No'];
        options = {ignoreFocusOut: true, placeHolder: "Join mailing list for product news", value: "Yes", canPickMany: false};
        let addToMailinglist = await vscode.window.showQuickPick(items, options);
        addToMailinglist = (addToMailinglist === 'Yes') ? 'Y' : 'N';

        // request
        try {
            vscode.window.setStatusBarMessage("processing request ...");
            // send request
            const result = await this.tryService.requestWorkspace(email, reqType, addToMailinglist);
            // inform user
            let message = `Workspace is reserved and connection info is sent to ${email}.`;
            if (result === null) {
                message = "Workspace cannot be reserved at this time. Please try later.";
            } 
            vscode.window.showInformationMessage(message);
        } catch (error: any) {
            console.error('Error in requesting workspace.', error);
            vscode.window.showErrorMessage(error.message);
        } finally {
            vscode.window.setStatusBarMessage("");
        }
	}


}
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceHandler = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
const URL = require("url");
class WorkspaceHandler {
    constructor(context, builderService) {
        this.context = context;
        this.builderService = builderService;
        vscode.commands.registerCommand('servicebuilderWorkspace.register', () => this.register());
        vscode.commands.registerCommand('servicebuilderWorkspace.connect', () => this.connect());
        vscode.commands.registerCommand('servicebuilderWorkspace.show', () => this.showWorkspace());
        vscode.commands.registerCommand('servicebuilderWorkspace.about', () => this.about());
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            // collect user input
            const builderEndpoint = yield vscode.window.showInputBox({
                placeHolder: 'Builder endpoint',
                prompt: "Enter builder URL"
            });
            if (!builderEndpoint) {
                vscode.window.setStatusBarMessage("No builder URL entered.");
                return;
            }
            // register
            try {
                vscode.window.setStatusBarMessage("registering ...");
                // send request
                const workspace = yield this.builderService.register(builderEndpoint);
                // inform user
                vscode.window.showInformationMessage("Registered and workspace created.", { modal: true });
                // save workspace
                util.storeWorkspace(this.context, workspace);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to register. \n ' + error.message);
            }
            finally {
                vscode.window.setStatusBarMessage("");
            }
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            // get workspace from store
            let workspace;
            try {
                workspace = (yield util.readWorkspace(this.context));
            }
            catch (err) {
                workspace = undefined;
            }
            // collect url from user
            const url = yield vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: "Workspace URL", value: workspace === null || workspace === void 0 ? void 0 : workspace.url });
            if (!url) {
                vscode.window.setStatusBarMessage("No url entered.");
                return;
            }
            // collect access key from user
            let accessKey = yield vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: "Access Key" });
            if (!accessKey) {
                accessKey = 'none';
            }
            // parse workspaceUrl for builderUrl
            const builderEndpoint = `${new URL.URL(url).protocol}//${new URL.URL(url).host}`;
            // connect 
            try {
                vscode.window.setStatusBarMessage("connecting ...");
                // send request
                const request = { workspaceUrl: url, accessKey: accessKey };
                workspace = yield this.builderService.connect(builderEndpoint, request);
                // save workspace
                util.storeWorkspace(this.context, vscode.workspace);
                // inform user
                vscode.window.showInformationMessage(`Connected to workspace: ${workspace.name}.`, { modal: true });
            }
            catch (err) {
                this.showConnectIssue(url, accessKey, err.message);
            }
            finally {
                vscode.window.setStatusBarMessage("");
            }
        });
    }
    showWorkspace() {
        return __awaiter(this, void 0, void 0, function* () {
            // get workspace
            const workspace = yield util.readWorkspace(this.context);
            if (workspace) {
                this.showConnectedMessage(workspace);
            }
            else {
                this.showNotConnectedMessage();
            }
        });
    }
    about() {
        return __awaiter(this, void 0, void 0, function* () {
            const workspace = yield util.readWorkspace(this.context);
            try {
                const versions = yield this.builderService.getVersions(workspace.builderEndpoint);
                this.showVersions(versions);
            }
            catch (err) {
                vscode.window.showWarningMessage("Failed to retrieve builder versions: " + err.message);
            }
        });
    }
    /*
    * Reconnect to fresh access token.
    */
    refreshToken(workspace) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const request = { workspaceName: workspace.name, accessKey: workspace.accessKey };
                const token = yield this.builderService.refreshToken(workspace.builderEndpoint, request);
                workspace.token = token;
                util.storeWorkspace(this.context, workspace);
                vscode.window.showInformationMessage(`Access token refreshed.`);
            }
            catch (err) {
                vscode.window.showWarningMessage("Failed to refresh access token: " + err.message);
            }
        });
    }
    /*
    * Show issues for "Connect Workspace"
    */
    showConnectIssue(workspaceUrl, accessKey, issue) {
        vscode.window.showWarningMessage(`Failed to connect. Please retry with correct url and access key. \n
			You have entered:
		    \t   \t Workspace url: ${workspaceUrl}
		    \t   \t Access key: ${accessKey} \n
			Issue: ${issue}`, { modal: true }, 'Retry').then(btn => {
            if (btn === 'Retry') {
                this.connect();
            }
        });
    }
    /*
    * Show connected workspace for "Show Workspace"
    */
    showConnectedMessage(workspace) {
        var _a;
        // token status
        let tokenStatus = "Valid";
        const expireAt = (_a = workspace.token) === null || _a === void 0 ? void 0 : _a.expireAt;
        if (!expireAt) {
            tokenStatus = 'None';
        }
        else if (expireAt < new Date()) {
            tokenStatus = 'Expired';
        }
        // display
        vscode.window.showInformationMessage(`Workspace:
				 \t   \t Name: \t ${workspace.name}
				 \t   \t Url: \t ${workspace.url}
				 \t   \t Service endpoint: \t ${workspace.serviceEndpoint}
				 \t   \t Access token: \t ${tokenStatus}`, { modal: true }, 'Refresh Token', 'Copy Service Endpoint').then((btn) => __awaiter(this, void 0, void 0, function* () {
            if (btn === 'Refresh Token') {
                this.refreshToken(workspace);
            }
            else if (btn === 'Copy Service Endpoint') {
                vscode.env.clipboard.writeText(workspace.serviceEndpoint);
            }
        }));
    }
    /*
    * Show not connected workspace for "Show Workspace"
    */
    showNotConnectedMessage() {
        vscode.window.showInformationMessage(`No workspace connection. \n
			To connect, you need to register with a builder url
			or connect with a workspace url and access key`, { modal: true }, 'Register', 'Connect').then(btn => {
            if (btn === 'Connect') {
                this.connect();
            }
            else if (btn === 'Register') {
                this.register();
            }
        });
    }
    showVersions(versions) {
        vscode.window.showInformationMessage(`Builder Service:
			 \t     \t Runtime:  ${versions.runtime}
			 \t     \t Builder:  ${versions.builder}`, { modal: true });
    }
}
exports.WorkspaceHandler = WorkspaceHandler;
//# sourceMappingURL=workspaceHandler.js.map
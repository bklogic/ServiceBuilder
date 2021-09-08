import { TextDecoder } from 'util';
import * as vscode from 'vscode';

var ZIP = require("adm-zip");

let getWorkspace: () => Promise<string>;

export function createGetWorkspaceUtil(context: vscode.ExtensionContext): void {
    getWorkspace = async () => { 
        const workspace = await context.secrets.get('servicebuilder.workspace'); 
        if (!workspace) {
            throw Error('No workspace connection configured.');
        }
        return workspace;
    };
}

export function getWorkFolder(): vscode.WorkspaceFolder | undefined {
		// if no workspace folders
		if (!vscode.workspace.workspaceFolders) {
			return;
		}
		// otherwise, set element to workspace folder if element is passed in
		return vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
}

export function applicationUriForDataSource(dataSourcePath: string) {
    return applicationUri(fromDataSource(dataSourcePath));
}

export function applicationUriForApplication(appPath: string) {
    return applicationUri(fromApplication(appPath));
}

export function applicationUriForModule(modPath: string) {
    return applicationUri(fromModule(modPath));
}

export function applicationUriForService(servicePath: string) {
    return applicationUri(fromService(servicePath));
}

export function applicationUriForTest(testPath: string) {
    return applicationUri(fromTest(testPath));
}

export function moduleUriForModule(modulePath: string) {
    return moduleUri(fromModule(modulePath));
}

export function serviceUriForService(servicePath: string) {
    return serviceUri(fromService(servicePath));
}

export function servicePathForTest(testPath: string) {
    const splits = testPath.split('/');
    const l = splits.length;
    splits.pop();
    splits.pop();
    return splits.join('/');
}

/*
* Note: data source path format: ~/workspace/application/src/datasource.json
*/
export function fromDataSource(path: string): Resource {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l-4],
        application: splits[l-3]
    } as Resource;
}

/*
* Note: data source path format: ~/workspace/application
*/
export function fromApplication(path: string): Resource {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l-2],
        application: splits[l-1]
    } as Resource;
}

/*
* Note: data source path format: ~/workspace/application/src/module
*/
export function fromModule(path: string): Resource {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l-4],
        application: splits[l-3],
		module: splits[l-1]
    } as Resource;
}

/*
* Note: data source path format: ~/workspace/application/src/module/service
*/
export function fromService(path: string): Resource {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l-5],
        application: splits[l-4],
		module: splits[l-2],
		service: splits[l-1]
    } as Resource;
}

/*
* Note: data source path format: ~/workspace/application/src/module/service/tests/test12.json
*/
export function fromTest(path: string): Resource {
    const splits = path.split('/');
    const l = splits.length;
    return {
        workspace: splits[l-7],
        application: splits[l-6],
		module: splits[l-4],
		service: splits[l-3]
    } as Resource;
}


/**
 * Functions below produce URIs for builder and devtime.
 * Builder workspace is different from local workfolder.
 */
export async function applicationUri(resource: Resource) {
    const builderWorkspace = await getWorkspace();
    return `${builderWorkspace}/${resource.application}`;
}

export async function moduleUri(resource: Resource) {
    const builderWorkspace = await getWorkspace();
    return `${builderWorkspace}/${resource.application}/${resource.module}`;
}

export async function serviceUri(resource: Resource) {
    const builderWorkspace = await getWorkspace();
    return `${builderWorkspace}/${resource.application}/${resource.module}/${resource.service}`;
}

export interface Resource {
    workspace: string;
    application: string;
    module: string;
    service: string;
}

/**
 * File
 */
 export async function readJsonFile(uri: vscode.Uri): Promise<any> {
	const uint8Array = await vscode.workspace.fs.readFile(uri);
	if (uint8Array.length === 0) {
		return {};
	}
	const data = JSON.parse(new TextDecoder().decode(uint8Array));
	return data;
}

export async function writeJsonFile(uri: vscode.Uri, content: any): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, toUint8Array(content));
}

export async function readSqlFile(uri: vscode.Uri): Promise<string[]> {
    const doc = await vscode.workspace.openTextDocument(uri);
    const lines : string[] = [];
    for (let i = 0; i < doc.lineCount; i++) {
        lines.push(doc.lineAt(i).text);
    }
    return lines;
}

export async function writeSqlFile(uri: vscode.Uri, lines: string[]): Promise<void> {
    const text = lines.join('\n');
    await vscode.workspace.fs.writeFile(uri, Buffer.from(text, 'utf8'));
}

export async function fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        return (stat) ? true : false;
    } catch {
        return false;
    }
}

export async function isApplication(uri: vscode.Uri): Promise<boolean> {
    return fileExists(vscode.Uri.joinPath(uri, 'src', 'application.json'));
}

export async function isModule(uri: vscode.Uri): Promise<boolean> {
    return fileExists(vscode.Uri.joinPath(uri, 'module.json'));
}

export async function isService(uri: vscode.Uri): Promise<boolean> {
    return fileExists(vscode.Uri.joinPath(uri, 'service.json'));
}

/**
 * Misc 
 */
export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function toUint8Array(content: any): Uint8Array {
	return Buffer.from(JSON.stringify(content, null, 4), 'utf8');
}

export function strToBuffer(str: string): Uint8Array {
    const buffer = new Uint8Array( new ArrayBuffer(str.length) );
    for (let i = 0; i < str.length; i++) {
        buffer[i] = str.charCodeAt(i);
    }
    return buffer;
}

export class DoubleClick {
	clickInterval = 500;
	lastClick = 0;
	lastItem: any = null;

	constructor(clickInterval?: number) {
		if (clickInterval) {
			this.clickInterval = clickInterval;
		}
	}

	check(item: any): boolean {
		const thisClick = new Date().getTime();
		let result = false;
		if ( item === this.lastItem && (thisClick  - this.lastClick) < this.clickInterval ) {
			result = true;
		}
		this.lastClick = thisClick;
		this.lastItem = item;
		return result;
	}

}


export function getArchive(fsPath: string): Buffer {
    const archive = new ZIP();
    archive.addLocalFolder(fsPath);
    const buffer = archive.toBuffer();
    return buffer;	
}


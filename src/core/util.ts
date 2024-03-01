import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import * as constants from './constants';

var ZIP = require("adm-zip");

let getWorkspace: () => Promise<string>;

export function createGetWorkspaceUtil(context: vscode.ExtensionContext): void {
    getWorkspace = async () => { 
        const workspace = await readWorkspace(context); 
        if (!workspace) {
            throw Error('No workspace connection configured.');
        }
        return workspace.name;
    };
}

/**
 * Methods for storing data source password
 */
export const passwordMask = '*********';

export async function storePassword(context: vscode.ExtensionContext, dataSourceName: string, password: string): Promise<void> {
    const secretName = await passwordSecretName(context, dataSourceName);
    context.secrets.store(secretName, password);
}

export async function retrievePassword(context: vscode.ExtensionContext, dataSourceName: string): Promise<string> {
    let secretName;
    let password;
    try {
        secretName = await passwordSecretName(context, dataSourceName);
        password = await context.secrets.get(secretName);
    } catch (error: any) {
        password = undefined;
    }
    return password || '';
}

export async function passwordSecretName(context: vscode.ExtensionContext, dataSourceName: string): Promise<string> {
    const dsUri = await dataSourceUriForName(dataSourceName);
    return `servicebuilder.${dsUri.replace('/', '.')}`;
}

export function getWorkFolder(): vscode.WorkspaceFolder {
        // let workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];;
		// if (!workspaceFolder) {
        //     workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
		// }
        if (vscode.workspace.workspaceFolders) {
            return vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
        } else {
            throw Error('No workspace folder!');            
        }
    }

export function dataSourceUriForName(dataSourceName: string): Promise<string> {
    return dataSourceUri(fromDataSourceName(dataSourceName));
}
    
export function applicationUriForDataSource(dataSourcePath: string): Promise<string> {
    return applicationUri(fromDataSource(dataSourcePath));
}

export function applicationUriForApplication(appPath: string): Promise<string> {
    return applicationUri(fromApplication(appPath));
}

export function applicationUriForModule(modPath: string): Promise<string> {
    return applicationUri(fromModule(modPath));
}

export function applicationUriForService(servicePath: string): Promise<string> {
    return applicationUri(fromService(servicePath));
}

export function applicationUriForTest(testPath: string): Promise<string> {
    return applicationUri(fromTest(testPath));
}

export function moduleUriForModule(modulePath: string) {
    return moduleUri(fromModule(modulePath));
}

export function serviceUriForService(servicePath: string) {
    return serviceUri(fromService(servicePath));
}

export function dataSourceNameFromUri(uri: string) {
    const splits =  uri.split('/');
    return splits[splits.length-1];
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
export function fromDataSourceName(name: string): Resource {
    return {
        dataSource: name
    } as Resource;
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
export async function dataSourceUri(resource: Resource): Promise<string> {
    const builderWorkspace = await getWorkspace();
    return `${builderWorkspace}/${resource.dataSource}`;
}

export async function applicationUri(resource: Resource): Promise<string> {
    const builderWorkspace = await getWorkspace();
    return `${builderWorkspace}/${resource.application}`;
}

export async function moduleUri(resource: Resource): Promise<string> {
    const builderWorkspace = await getWorkspace();
    return `${builderWorkspace}/${resource.application}/${resource.module}`;
}

export async function serviceUri(resource: Resource): Promise<string> {
    const builderWorkspace = await getWorkspace();
    return `${builderWorkspace}/${resource.application}/${resource.module}/${resource.service}`;
}

export interface Resource {
    workspace: string;
    dataSource: string;
    application: string;
    module: string;
    service: string;
}


/**
 * Data Source Files
 */
export function dataSourceFolderUri(): vscode.Uri {
    const workfolder = getWorkFolder();
    return vscode.Uri.joinPath(workfolder.uri, constants.dataSourceFolderName);
}


export function dataSourceFileUri(dataSourceName: string) {
    return vscode.Uri.joinPath(dataSourceFolderUri(), `${dataSourceName}.json`);
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
    await vscode.workspace.fs.writeFile(uri, strToBuffer(text));
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

export function testResultUri(): vscode.Uri {
    let uri = vscode.Uri.joinPath(getWorkFolder().uri, '.test');
    if (!fileExists(uri)) {
        vscode.workspace.fs.createDirectory(uri);
    }
    return vscode.Uri.joinPath(uri, 'TestResult');
}

/**
 * Secrete
 */
export async function readSecret(context: vscode.ExtensionContext, name: string): Promise<string | undefined> {
    try {
        return context.secrets.get(name);
    } catch (err: any) {
        return undefined;
    }
}

export async function storeSecret(context: vscode.ExtensionContext, name: string, value: string): Promise<void> {
    context.secrets.store(qualifiedName(name), value);
}

export function qualifiedName(name: String): string {
    return  `${constants.namespace}.${name}`;
}

export async function storeWorkspace(context: vscode.ExtensionContext, workspace: any): Promise<void> {
    context.secrets.store(qualifiedName('workspace'), JSON.stringify(workspace));
}

export async function readWorkspace(context: vscode.ExtensionContext): Promise<any | undefined> {
    try {
        const json = await context.secrets.get(qualifiedName('workspace'));
        if (json) {
            return JSON.parse(json);
        } else {
            return undefined;
        }
    } catch (err: any) {
        return undefined;
    }
}

/**
 * configuration
 */
export async function readConfig(name: string): Promise<string | undefined> {
    return vscode.workspace.getConfiguration(constants.namespace).get(name) as string;
}


/**
 * Misc 
 */
export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function toUint8Array(content: any): Uint8Array {
	// return Buffer.from(JSON.stringify(content, null, 4), 'utf8');
	return strToBuffer(JSON.stringify(content, null, 4));
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

/*
* Methods to get file archives
*/
export function getArchive(fsPath: string): Buffer {
    const archive = new ZIP();
    archive.addLocalFolder(fsPath);
    const buffer = archive.toBuffer();
    return buffer;	
}

export async function getApplicationArchive(uri: vscode.Uri): Promise<Buffer> {
    // get archive
    const buffer = getArchive(uri.fsPath);
    // return
    return buffer;	
}

export function initCap(str: string | null | undefined): string {
    if (str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    } else {
        return '';
    }
}

/*
* Methods for showing error
*/ 
export function showErrorStatus(message: string, error: string) {
    if (message.length + error.length <= 120) {
        vscode.window.setStatusBarMessage(message + ' ' + error);
    } else {
        vscode.window.setStatusBarMessage(message  + ' Detail in error message.');
        vscode.window.showErrorMessage(error);
    }
}
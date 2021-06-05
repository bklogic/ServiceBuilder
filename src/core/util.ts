import { TextDecoder } from 'util';
import * as vscode from 'vscode';

export function applicaitionUriForDataSource(dataSourcePath: string) {
    return applicationUri(fromDataSource(dataSourcePath));
}

export function applicaitionUriForApplication(appPath: string) {
    return applicationUri(fromApplication(appPath));
}

export function applicaitionUriForModule(modPath: string) {
    return applicationUri(fromModule(modPath));
}

export function applicaitionUriForService(servicePath: string) {
    return applicationUri(fromService(servicePath));
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

export function applicationUri(resource: Resource) {
    return `${resource.workspace}/${resource.application}`;
}

export function moduleUri(resource: Resource) {
    return `${resource.workspace}/${resource.application}/${resource.module}`;
}

export function serviceUri(resource: Resource) {
    return `${resource.workspace}/${resource.application}/${resource.module}/${resource.service}`;
}

export interface Resource {
    workspace: string;
    application: string;
    module: string;
    service: string;
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

export async function readJsonFile(uri: vscode.Uri): Promise<any> {
	const uint8Array = await vscode.workspace.fs.readFile(uri);
	if (uint8Array.length === 0) {
		return {};
	}
	const data = JSON.parse(new TextDecoder().decode(uint8Array));
	return data;
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


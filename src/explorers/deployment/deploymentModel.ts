import * as vscode from 'vscode';

export interface Item {
	uri: string;
	type: ItemType;
	name: string;
	state: string;
	fileType: vscode.FileType;
	fileUri: vscode.Uri;
	parent: Item | null;
	seqNo: number;
}

export enum ItemType {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	DataSources = 'datasources', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	DataSource = 'datasource', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Applications = 'applications', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Application = 'application', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Module = 'module', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	QueryService = 'queryservice', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	SqlService = 'sqlservice', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	CrudService = 'crudservice', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Tests = 'tests', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	InvalidService = 'invalidservice', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Other = 'other', 
}


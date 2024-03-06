import * as vscode from 'vscode';

export interface Entry {
	uri: vscode.Uri;
	type: EntryType;
	serviceType: string | null;
	componentType: string | null;
	name: string;
	fileType: vscode.FileType;
	parent: Entry | null;
	seqNo: number;
}

export enum EntryType {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Workfolder = 'workfolder',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Application = 'application', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ApplicationSrc = 'applicationsrc', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ApplicationFile = 'applicationfile', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Module = 'module', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ModuleFile = 'modulefile', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	QueryService = 'queryservice', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	SqlService = 'sqlservice', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	CrudService = 'crudservice', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ServiceFile = 'servicefile', 
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Tests = 'tests',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	TestFile = 'testfile',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Read = 'read',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Write = 'write',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Bindings = 'bindings',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Component = 'component',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Other = 'other'
}

export interface ApplicationFile {
    name: string;
    description: string;
    dbType: string;
    dataSource: string;
    schema: string;
}
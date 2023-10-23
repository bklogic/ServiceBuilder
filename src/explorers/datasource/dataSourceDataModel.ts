import * as vscode from 'vscode';

// DataSourceExplorer node
export interface DataSourceItem {
	uri: vscode.Uri;
	name: string;
	state: string;
	fileType: vscode.FileType;
	fileUri: vscode.Uri;
	parent: DataSourceItem | null;
}

// DataSource file
export interface DataSource {
    dbType: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
	ssl: boolean;
	comments: string;
}

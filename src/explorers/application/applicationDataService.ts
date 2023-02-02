import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import * as util from '../../core/util';
import * as cs from './contentService';
import {Entry, EntryType} from './applicationModel';

export class ApplicationDataService {

	construct() {}

	public async getChildren(entry: Entry): Promise<Entry[]> {
		switch (entry.type) {
			case EntryType.Workfolder:
				return this.getChildrenForWorkspaceFolder(entry);
			case EntryType.Application:
				return this.getChildrenForApplication(entry);
			case EntryType.Module:
				return this.getChildrenForModule(entry);
			case EntryType.QueryService:
				return this.getChildrenForService(entry);
			case EntryType.SqlService:
				return this.getChildrenForService(entry);
			case EntryType.CrudService:
				return this.getChildrenForCrudService(entry);
			case EntryType.Read:
				return this.getChildrenForRead(entry);
			case EntryType.Write:
				return this.getChildrenForWrite(entry);
			case EntryType.Tests:
				return this.getChildrenForTests(entry);
			default:
				return this.getChildrenForOther(entry);
		}
	}

	async getChildrenForWorkspaceFolder(entry: Entry): Promise<Entry[]> {
		const files = await vscode.workspace.fs.readDirectory(entry.uri);
		let children: ValidFile[] = await Promise.all(
			files.map( async ([name, fileType]) => { 
				switch (fileType) {
					// case vscode.FileType.File:
					// 	return {name, fileType, valid: name === 'Welcome.md'};
					case vscode.FileType.Directory:
						const isApplication = await util.isApplication(vscode.Uri.joinPath(entry.uri, name));
						return {name, fileType, valid: isApplication};
					default:
						return {name, fileType, valid: false};
				}
			})	
		);
		children = children.filter(  (file) => { 
			return file.valid;
		});	
		return children.map((file) => {
			let child: Entry = this.defaultEntry(file.name, file.fileType, entry);
			child.parent = null;  // workfolder is not true node
			if (file.fileType === vscode.FileType.Directory) {
				child.type = EntryType.Application;
			} 
			return child;
		});	
	}

	async getChildrenForApplication(entry: Entry): Promise<Entry[]> {
		// modules in src folder
		const srcChildren = await this.getChildrenForApplicationSrc(entry); 
		// files in app folder
		const dirChildren = await this.getChildrenForApplicationDir(entry);
		// return
		return srcChildren.concat(dirChildren);
	}

	async getChildrenForApplicationDir(entry: Entry): Promise<Entry[]> {
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		return children.filter(([name, fileType]) => {
			return (
				name === 'README.md'
			);
		}).map(([name, fileType]) => {
			let child: Entry = this.defaultEntry(name, fileType, entry);
			return child;
		});	
	}

	async getChildrenForApplicationSrc(entry: Entry): Promise<Entry[]> {
		let i = 2;
		const srcUri = vscode.Uri.joinPath(entry.uri, 'src');
		const src = this.defaultEntry('src', vscode.FileType.Directory, entry);
		const children = await vscode.workspace.fs.readDirectory(src.uri);		
		return children.filter(([name, fileType]) => {
			return true;
		}).map(([name, fileType]) => {
			i++;
			let child: Entry = this.defaultEntry(name, fileType, src);
			if ( name === 'application.json') {
				child.type = EntryType.ApplicationFile;
				child.seqNo = 0;
			}
			else if ( name === 'datasource.json') {
				child.type = EntryType.ApplicationFile;
				child.seqNo = 1;
			}
			else if (fileType === vscode.FileType.Directory) {
				child.type = EntryType.Module;
				child.seqNo = i++;
			} 
			return child;
		}).sort( (a, b) => {
			return a.seqNo - b.seqNo;
		});	
	}

	async getChildrenForModule(entry: Entry): Promise<Entry[]> {
		let i = 1;
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		const entries = await Promise.all(
			children.map(async ([name, fileType]) => {
				let child: Entry = this.defaultEntry(name, fileType, entry);
				if ( name === 'module.json') {
					child.type = EntryType.ModuleFile;
					child.seqNo = 0;
				}
				else if (fileType === vscode.FileType.Directory) { 
					const serviceType = await this.serviceType(child.uri);
					child.type = this.entryType(serviceType);
					child.serviceType = serviceType;
					child.seqNo = i++;
			} 
				return child;
			})	
		);
		return entries.sort( (a, b) => {
			return a.seqNo - b.seqNo;
		});	
	}

	componentNames = ['input', 'output', 'object', 'query', 'sqls', 'input-bindings', 'output-bindings', 'tables', 'columns'];

	async getChildrenForService(entry: Entry): Promise<Entry[]> {
		let i = 1;
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		return children.map(([name, fileType]) => {
			let child: Entry = this.defaultEntry(name, fileType, entry);
			const componentName = name.replace('.json', '').replace('.sql', '');
		    if ( name === 'service.json') {
				child.type = EntryType.ServiceFile;
				child.seqNo = 0;
			}
			else if ( name === 'tests') {
				child.type = EntryType.Tests;
				child.seqNo = 1000;
			}
			else if (this.componentNames.includes(componentName)) {
				child.type = EntryType.Component;
				child.componentType = componentName;
				switch (componentName) {
					case 'input':
						child.seqNo = 1;
						break;
					case 'output':
						child.seqNo = 2;
						break;
					case 'sqls':
						child.seqNo = 3;		
						break;
					case 'query':
						child.seqNo = 4;
						break;
					case 'input-bindings':
						child.seqNo = 5;
						child.type = EntryType.Bindings;
						break;
					case 'output-bindings':
						child.seqNo = 6;
						child.type = EntryType.Bindings;
						break;
					}
			} 
			return child;
		}).sort( (a, b) => {
			return a.seqNo - b.seqNo;
		});	
	}

	async getChildrenForCrudService(entry: Entry): Promise<Entry[]> {
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		return children.map(([name, fileType]) => {
			let child: Entry = this.defaultEntry(name, fileType, entry);
			switch (name) {
				case 'service.json':
					child.type = EntryType.ServiceFile;
					child.seqNo = 0;
					break;
				case 'tests':
					child.type = EntryType.Tests;
					child.seqNo = 1000;
					break;
				case 'object.json':
					child.type = EntryType.Component;
					child.seqNo = 1;
					break;
				case 'read': 	
					child.type = EntryType.Read;
					child.seqNo = 2;
					break;
				case 'write': 	
					child.type = EntryType.Write;
					child.seqNo = 3;
					break;
			}
			return child;
		}).sort( (a, b) => {
			return a.seqNo - b.seqNo;
		});	
	}

	async getChildrenForRead(entry: Entry): Promise<Entry[]> {
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		return children.map(([name, fileType]) => {
			let child: Entry = this.defaultEntry(name, fileType, entry);
			const componentName = name.replace('.json', '').replace('.sql', '');
			if (this.componentNames.includes(componentName)) {
				child.type = EntryType.Component;
				child.componentType = componentName;
				switch (componentName) {
					case 'input':
						child.seqNo = 1;
						break;
					case 'query':
						child.seqNo = 2;
						break;
					case 'input-bindings':
						child.seqNo = 3	;
						child.type = EntryType.Bindings;
						break;
					case 'output-bindings':
						child.seqNo = 4;
						child.type = EntryType.Bindings;
						break;
				}
			} 
			return child;
		}).sort( (a, b) => {
			return a.seqNo - b.seqNo;
		});	
	}

	async getChildrenForWrite(entry: Entry): Promise<Entry[]> {
		let i = 2;
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		return children.map(([name, fileType]) => {
			let child: Entry = this.defaultEntry(name, fileType, entry);
			const componentName = name.replace('.json', '').replace('.sql', '');
			if (this.componentNames.includes(componentName)) {
				child.type = EntryType.Component;
				child.componentType = componentName;
				switch (componentName) {
					case 'tables':
						child.seqNo = 0	;
						break;
				}
			} 
			else if (componentName.endsWith('columns')) {
				child.type = EntryType.Component;
				child.componentType = 'columns';
				child.seqNo = i++;
			}
			child.type = EntryType.Bindings;
			return child;
		}).sort( (a, b) => {
			return a.seqNo - b.seqNo;
		});	
	}

	async getChildrenForTests(entry: Entry): Promise<Entry[]> {
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		return children.map(([name, fileType]) => {
			let child: Entry = this.defaultEntry(name, fileType, entry);
			if (fileType === vscode.FileType.File) {
					child.type = EntryType.TestFile;
			}
			return child;
		});	
	}

	async getChildrenForOther(entry: Entry): Promise<Entry[]> {
		const children = await vscode.workspace.fs.readDirectory(entry.uri);
		return children.map(([name, fileType]) => {
			return this.defaultEntry(name, fileType, entry);
		});	
	}


	defaultEntry(name: string, fileType: vscode.FileType, parent: Entry): Entry {
		return { 
			uri: vscode.Uri.joinPath(parent.uri, name), 
			type: EntryType.Other, 
			serviceType: null, 
			componentType: null, 
			fileType: fileType, 
			name: name,
			parent: parent,
			seqNo: 10000
		};	
	}

	async serviceType(serviceUri: vscode.Uri): Promise<string> {
		const content = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(serviceUri, 'service.json'));
		const service = JSON.parse(new TextDecoder().decode(content)) as cs.ServiceDefintion;
		return service.type;
	}

	entryType(serviceType?: string): EntryType {
		switch(serviceType) {
			case 'query':
				return EntryType.QueryService;
			case 'sql':
				return EntryType.SqlService;
			case 'crud':
				return EntryType.CrudService;
			default:
				return EntryType.Other;	
		}
	}

}

interface ValidFile {
	name: string;
	fileType: vscode.FileType,
	valid: boolean
}

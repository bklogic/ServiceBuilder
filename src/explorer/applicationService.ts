import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import * as path from 'path';
import * as util from '../core/util';
import * as cs from './contentService';
import {Entry, EntryType} from './applicationModel';
import {GitExtension} from './git.d';

export class ApplicationService {

	construct() {}

	/**
	 * Description:
	 * Each workspace folder serves a backlogic workspace. will be created the first time user uses service builder.
	 * @param uri workfolder uri
	 */
	public createWorkspacefolder(uri: vscode.Uri) {
	}

	/**
	 * create application
	 * @param uri application uri
	 * @param name application name
	 */
	async createApplication(workfolder: Entry, name: string, dbType: string, versions: any): Promise<Entry> {
		const app = this.defaultEntry(name, vscode.FileType.Directory, workfolder);
		app.parent = null;
		// check name not exists
		const exists = await this.fileExists(app.uri);
		if (exists) {
			throw vscode.FileSystemError.FileExists();
		}
		// application foler
		await vscode.workspace.fs.createDirectory(app.uri);
		// source folder
		await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(app.uri, 'src'));
		// application file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(app.uri, 'src', 'application.json'), cs.applicationFile(name, dbType, versions));

		// datasource file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(app.uri, 'src', 'datasource.json'), cs.dataSourceFile(dbType));

		// README file
		const templatePath = path.join(__filename, '..', '..', '..', 'resources', 'README.md');
		const templateUri = vscode.Uri.parse('file:' + templatePath, true);
		const readmeUri = vscode.Uri.joinPath(app.uri, 'README.md');
		await vscode.workspace.fs.copy(templateUri, readmeUri);

		// init git repository
		await this.initGit(app.uri);

		// return 
		return app;
	}

	private initGit(appUri: vscode.Uri): Promise<void> {
		const extension = vscode.extensions.getExtension<GitExtension>('vscode.git') as vscode.Extension<GitExtension>;
		if (!extension) {
			console.error('vscode git extension is missing.');
		}
		const gitExtension = extension.exports;
		const git = gitExtension.getAPI(1);
		git.init(appUri)
		   .then( repository => {
			   console.log(repository);
		   })
		   .catch ( error => {
			   console.error('git init error:');
			   console.error(error);
		   });
		return Promise.resolve();
	}

	/**
	 * create module
	 * @param uri 	module uri
	 * @param name 	module name
	 */
	async createModule(app: Entry, modName: string): Promise<Entry> {
			// mod entry
			const src = this.defaultEntry('src', vscode.FileType.Directory, app);
			const mod = this.defaultEntry(modName, vscode.FileType.Directory, src);
			// check if module name exists
			const exists = await this.fileExists(mod.uri);
			if (exists) {
				throw vscode.FileSystemError.FileExists();
			}
			// module folder
			await vscode.workspace.fs.createDirectory(mod.uri);
			// module file
			await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(mod.uri, 'module.json'), cs.moduleFile(modName));
			// return
			return mod;
	}

	/**
	 * create service 
	 * @param uri service uri
	 * @param name 	service name
	 * @param type 	service type
	 */
	async createService(mod: Entry, name: string, type: string): Promise<Entry> {
		const service = this.defaultEntry(name, vscode.FileType.Directory, mod);
		// check name not exists
		const exists = await this.fileExists(service.uri);
		if (exists) {
			throw vscode.FileSystemError.FileExists();
		}
		// create service
		switch (type) {
			case 'query':
				await this.createQueryService(service.uri, name);
				break;
			case 'sql':
				await this.createSqlService(service.uri, name);
				break;
			case 'crud':
				await this.createCrudService(service.uri, name);
				break;
			default:
				throw new Error("Unsupported service type: " + type);
		}
		return service;
	}

	async createQueryService(uri: vscode.Uri, name: string): Promise<void> {
		// service folder
		await vscode.workspace.fs.createDirectory(uri);
		await Promise.all ([
			// service file
			vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'service.json'), cs.queryServiceFile(name)),
			// input file
			vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input.json'), new Uint8Array()),
			// output file
			vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output.json'), new Uint8Array()),
			// query file
			vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'query.sql'), new Uint8Array()),
			// input binding file
			vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input-bindings.json'), new Uint8Array()),
			// output binding file
			vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output-bindings.json'), new Uint8Array()),
			// tests folder
			vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, 'tests'))
		]);
	}

	async createSqlService(uri: vscode.Uri, name: string): Promise<void> {
		// service folder
		await vscode.workspace.fs.createDirectory(uri);
		// service file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'service.json'), cs.sqlServiceFile(name));
		// input file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input.json'), new Uint8Array());
		// output file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output.json'), new Uint8Array());
		// sqls file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'sqls.sql'), new Uint8Array());
		// query file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'query.sql'), new Uint8Array());
		// input binding file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'input-bindings.json'), new Uint8Array());
		// output binding file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'output-bindings.json'), new Uint8Array());
		// tests folder
		await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, 'tests'));
	}

	async createCrudService(uri: vscode.Uri, name: string): Promise<void> {
		// service folder
		await vscode.workspace.fs.createDirectory(uri);
		// service file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'service.json'), cs.crudServiceFile(name));
		// object file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(uri, 'object.json'), new Uint8Array());

		// read folder
		const readUri = vscode.Uri.joinPath(uri, 'read');
		await vscode.workspace.fs.createDirectory(readUri);
		// input file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'input.json'), new Uint8Array());
		// query file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'query.sql'), new Uint8Array());
		// input binding file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'input-bindings.json'), new Uint8Array());
		// output binding file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(readUri, 'output-bindings.json'), new Uint8Array());

		// write folder
		const writeUri = vscode.Uri.joinPath(uri, 'write');
		await vscode.workspace.fs.createDirectory(writeUri);
		// tables file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(writeUri, 'tables.json'), new Uint8Array());

		// tests folder
		await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, 'tests'));
	}

	async addTest(testFolder: Entry, testType: string | undefined): Promise<Entry> {
		// test file name and input uri
		const service = testFolder.parent;
		if (!service?.serviceType) { // never happen unless bug
			return {} as Entry;
		}
		let fileName;
		let inputUri;
		switch (testType) {
			case 'read': case 'delete':
				fileName = `test${util.initCap(testType)}${util.initCap(service.name)}`;
				inputUri = vscode.Uri.joinPath(service.uri, 'read', 'input.json');
				break;
			case 'create': case 'update': 
				fileName = `test${util.initCap(testType)}${util.initCap(service.name)}`;
				inputUri = vscode.Uri.joinPath(service.uri, 'object.json');
				break;
			default:
				fileName = `test${util.initCap(service.name)}`;
				inputUri = vscode.Uri.joinPath(service.uri, 'input.json');
		}

		// input and test file
		const newFileName = await this.newTestFileName(testFolder, fileName);
		const newFileUri = vscode.Uri.joinPath(testFolder.uri, newFileName);
		const input = await util.readJsonFile(inputUri);
		const content =cs.testFile(input, fileName, testType);
		await vscode.workspace.fs.writeFile(newFileUri, content);

		//return
		return this.defaultEntry(newFileName, vscode.FileType.File, testFolder);
    }

	async duplicateTest(sourceTest: Entry): Promise<Entry> {
		// target test uri
		if (!sourceTest.parent) { // never unless bug
			return {} as Entry;
		}
		const newFileName = await this.newTestFileName(sourceTest.parent, sourceTest.name.replace('.json', ''));
		const newFileUri = vscode.Uri.joinPath(sourceTest.parent.uri, newFileName);

		// duplicate test
		await vscode.workspace.fs.copy(sourceTest.uri, newFileUri);

		//return
		return this.defaultEntry(newFileName, vscode.FileType.File, sourceTest.parent);
    }

	/**
	 * 
	 * @param uri delete application, module or service
	 */
	async delete(uri: vscode.Uri): Promise<void> {
		await vscode.workspace.fs.delete(uri, {recursive: true, useTrash: false});
	}


	async rename(uri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
		await vscode.workspace.fs.rename(uri, newUri, {overwrite: false});
	}

	async renameApplication(uri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
		// rename file
		await vscode.workspace.fs.rename(uri, newUri, {overwrite: false});
		// clean old application

		// redeploy new application
	}

	async renameModule(uri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
		// rename file
		await vscode.workspace.fs.rename(uri, newUri, {overwrite: false});
		// clean old application

		// redeploy new application
	}

	async renameService(uri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
		// rename file
		await vscode.workspace.fs.rename(uri, newUri, {overwrite: false});
		// clean old service
		
		// redeploy new service
	}

	async getCopyTarget(name: string, target: vscode.Uri): Promise<vscode.Uri> {
		const uri = vscode.Uri.joinPath(target, name);
		if (await util.fileExists(uri)) {
			return this.getCopyTarget(name + '_copy', target);
		} else {
			return uri;
		}
	}

	async copy(source: vscode.Uri, target: vscode.Uri): Promise<void> {
		await vscode.workspace.fs.copy(source, target, {overwrite: false});
	}

	async move(source: vscode.Uri, target: vscode.Uri): Promise<void> {
		vscode.workspace.fs.rename(source, target, {overwrite: false});
	}

	async fileExists(uri: vscode.Uri): Promise<boolean> {
		let exists = true;
		try {
			const stat = await vscode.workspace.fs.stat(uri);
		} catch (error: any) {
			if (error.code === 'FileNotFound') {
				return false;
			}
		}
		return exists;
	}

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
					case vscode.FileType.File:
						return {name, fileType, valid: name === 'Welcome.md'};
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
						break;
					case 'output-bindings':
						child.seqNo = 6;
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
						break;
					case 'output-bindings':
						child.seqNo = 4;
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

	async newTestFileName(testFolder: Entry, fileName: string): Promise<string> {
		let i = 2;
		let newFileName = `${fileName}.json`;
		while (await util.fileExists( vscode.Uri.joinPath(testFolder.uri, newFileName))){
			newFileName = `${fileName + i.toString()}.json`;
			i++;
		}
		return Promise.resolve(newFileName);
	}

}

interface ValidFile {
	name: string;
	fileType: vscode.FileType,
	valid: boolean
}

import * as vscode from 'vscode';
import * as util from '../../core/util';
import * as cs from './contentService';
import {Entry, EntryType} from './applicationModel';

export class ApplicationExplorerService {

	construct() {}

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
		// application folder
		await vscode.workspace.fs.createDirectory(app.uri);
		// source folder
		await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(app.uri, 'src'));
		// application file
		await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(app.uri, 'src', 'application.json'), cs.applicationFile(name, dbType));

		// version file
		await util.writeJsonFile(vscode.Uri.joinPath(app.uri, 'src', '.versions.json'), versions);

		// return 
		return app;
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

import * as vscode from 'vscode';
import * as util from '../core/util';
import {ApplicationDataProvider} from './applicationDataProvider';
import {ApplicationService, Entry, EntryType} from "./applicationService";
import {
	BindCrudQueryRequest,
	BindCrudTableRequest,
	BindQueryRequest,
	BindQueryResult,
	BindSqlsRequest,
    BuilderService,
	DeployRequest,
	Table
} from '../core/builderService';

export class ApplicationExplorer {

	private dataProvider: ApplicationDataProvider;
	private treeView: vscode.TreeView<Entry>;
	private appService: ApplicationService;
	private builderService: BuilderService;
	private doubleClick = new util.DoubleClick();

	constructor(context: vscode.ExtensionContext, builderService: BuilderService) {
		this.appService = new ApplicationService();
		this.builderService = builderService;
		this.dataProvider = new ApplicationDataProvider(this.appService);
		this.treeView = vscode.window.createTreeView('servicebuilderExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
		context.subscriptions.push(this.treeView);
		vscode.commands.registerCommand('servicebuilderExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.refresh', () => this.refresh());
		vscode.commands.registerCommand('servicebuilderExplorer.rename', (resource) => this.onRename(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.delete', (resource) => this.delete(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.copy', (resource) => this.copy(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.paste', (resource) => this.paste(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createApplication', () => this.onCreateApplication());
		vscode.commands.registerCommand('servicebuilderExplorer.configDataSource', (resource) => this.onConfigDataSource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployApplication', (resource) => this.deployApplication(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createModule', (resource) => this.onCreateModule(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployModule', (resource) => this.deployModule(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createQueryService', (resource) => this.onCreateService(resource, 'query'));
		vscode.commands.registerCommand('servicebuilderExplorer.createSqlService', (resource) => this.onCreateService(resource, 'sql'));
		vscode.commands.registerCommand('servicebuilderExplorer.createCrudService', (resource) => this.onCreateService(resource, 'crud'));
		vscode.commands.registerCommand('servicebuilderExplorer.generateCrud', (resource) => this.onGenerateCrud(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genQueryInputOutput', (resource) => this.genQueryInputOutput(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genQueryInputOutputBindings', (resource) => this.genQueryInputOutputBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genSqlInputOutput', (resource) => this.genSqlInputOutput(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genSqlInputOutputBindings', (resource) => this.genSqlInputOutputBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genCrudObject', (resource) => this.genCrudObject(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genCrudInputOutputBindings', (resource) => this.genCrudInputOutputBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.genCrudTableBindings', (resource) => this.genCrudTableBindings(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.deployService', (resource) => this.deployService(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.addTest', (resource) => this.addTest(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.duplicateTest', (resource) => this.duplicateTest(resource));
	}

	openResource(resource: Entry): void {
		vscode.window.showTextDocument(resource.uri, {preview: !this.doubleClick.check(resource)});
	}

	openDataSource(app: Entry): void {
		vscode.window.showTextDocument(vscode.Uri.joinPath(app.uri, 'src', 'datasource.json'), {preview: false});
	}

	refresh(): void {
		this.dataProvider.refresh();
	}

	onCreateApplication(): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "application name", prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					vscode.window.showQuickPick(['mysql'], {ignoreFocusOut: true, placeHolder: "database type", canPickMany: false}).then( (dbType) => {
						if (dbType) {
							this.createApplication(name, dbType);
						} else {
							vscode.window.showErrorMessage("no database type selected.");
						}
					});
				} else {
					vscode.window.showErrorMessage("no application name specified.");
				}
			});
	}

	onConfigDataSource(app: Entry): void {
		this.openDataSource(app);
	}

	onCreateModule(app: Entry): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "module name", prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.createModule(app, name);
				}
			});
	}

	onCreateService(mod: Entry, serviceType: string): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: `${serviceType} service name`, prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.createService(mod, name, serviceType);
				}
			});
	}

	async createApplication(appName: string, dbType: string): Promise<void> {
		try {
			const versions = await this.builderService.getBuilderVersions();
			const app = await this.appService.createApplication(this.dataProvider.workfolder, appName, dbType, versions);
			this.refresh();
			this.treeView.reveal(app, {expand: 2, focus: true, select: true});	
		} catch (error) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Application name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}

	async deployApplication(app: Entry): Promise<void> {
		try {
			// prepare request
			const request: DeployRequest = {
				deployType: 'deploy',
				applicationUri: util.applicaitionUriForApplication(app.uri.path)
			} as DeployRequest;
			// call service
			await this.builderService.deployApplication(request);
			// inform user
			vscode.window.showInformationMessage('application is deployed.');
		} catch (error) {
			console.error('Error in deploying application', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async createModule(app: Entry, modName: string): Promise<void> {
		try {
			const mod = await this.appService.createModule(app, modName);
			this.dataProvider.fire(app);
			this.treeView.reveal(mod, {expand: 2, focus: true, select: true});	
		} catch (error) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Module name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}

	async deployModule(mod: Entry): Promise<void> {
		try {
			// prepare request
			const request: DeployRequest = {
				deployType: 'deploy',
				applicationUri: util.applicaitionUriForModule(mod.uri.path),
				moduleName: mod.name
			} as DeployRequest;
			// call service
			await this.builderService.deployModule(request);
			// inform user
			vscode.window.showInformationMessage('module is deployed.');
		} catch (error) {
			console.error('Error in deploying module', error);
			vscode.window.showErrorMessage(error.message);
		}
	}


	async createService(mod: Entry, name: string, type: string): Promise<void> {
		try {
			const service = await this.appService.createService(mod, name, type);
			this.dataProvider.fire(mod);
			this.treeView.reveal(service, {expand: 2, focus: true, select: true});	
		} catch (error) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Service name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}

	async deployService(service: Entry): Promise<void> {
		try {
			// prepare request
			const resource: util.Resource = util.fromService(service.uri.path);
			const request: DeployRequest = {
				deployType: 'deploy',
				applicationUri: `${resource.workspace}/${resource.application}`,
				moduleName: resource.module,
				serviceName: resource.service
			} as DeployRequest;
			// call service
			await this.builderService.deployService(request);
			// inform user
			vscode.window.showInformationMessage('service is deployed.');
		} catch (error) {
			console.error('Error in deploying service', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async delete(entry: Entry): Promise<void> {
		try {
			await this.appService.delete(entry.uri);
			if (entry.parent) {
				this.dataProvider.fire(entry.parent);
				this.treeView.reveal(entry.parent, {focus: true, select: true});
			} else {
				this.refresh();
			}	
		} catch (error) {
			vscode.window.showErrorMessage(error.message);
		}
	}

	private onRename(entry: Entry): void {
		this.treeView.reveal(entry, {select: true});
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: `new ${entry.type} name`, prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.rename(entry, name);
				}
			});
	}

	async rename(entry: Entry, name: string): Promise<void> {
		try {
			let newEntry: Entry;
			if (entry.parent) { 
				await this.appService.rename(entry.uri, vscode.Uri.joinPath(entry.parent.uri, name));
				this.dataProvider.fire(entry.parent);
				newEntry = this.appService.defaultEntry(name, entry.fileType, entry.parent);
			} else {
				await this.appService.rename(entry.uri, vscode.Uri.joinPath(this.dataProvider.workfolder.uri, name));
				this.refresh();
				newEntry = this.appService.defaultEntry(name, entry.fileType, this.dataProvider.workfolder);
				newEntry.parent = null;
			}
			this.treeView.reveal(newEntry, {focus: true});	
		} catch (error) {
			let message: string;
			switch (error.code) {
				case 'FileExists':
					message = 'Name exists.';
					break;
				default:
					message = error.message;
			}
			vscode.window.showErrorMessage(message);
		}
	}

	private copy(entry: Entry) {
		console.log('copy ' + entry.type);
	}

	private paste(entry: Entry) {
		console.log('paste ' + entry.type);
	}

	onGenerateCrud(module: Entry) {
		console.log('generate CRUD ...');
	}

	async genQueryInputOutput(service: Entry) {
		console.log("generate query input and output");
	}

	async genQueryInputOutputBindings(service: Entry) {
		try {
			// prepare request
			const [input, output, query] = await Promise.all([
				this.appService.readJsonFile(vscode.Uri.joinPath(service.uri, 'input.json')),
				this.appService.readJsonFile(vscode.Uri.joinPath(service.uri, 'output.json')),
				this.appService.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'))
			]);
			const request: BindQueryRequest = {
				applicationUri: util.applicaitionUriForService(service.uri.path),
				input, output, queryString: query
			};
			// call service
			const result: BindQueryResult = await this.builderService.bindQuery(request);
			// process result
			const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'input-bindings.json');
			const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'output-bindings.json');
			await this.appService.writeJsonFile(inputBidningsUri, result.inputBindings);
			await this.appService.writeJsonFile(outputBidningsUri, result.outputBindings);
			vscode.window.showTextDocument(inputBidningsUri, {preview: false});
			vscode.window.showTextDocument(outputBidningsUri, {preview: false});
			// inform user
			vscode.window.showInformationMessage('input and output bindings are generated');
		} catch (error) {
			console.error('Error in generating query input and output bindings', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async genSqlInputOutput(service: Entry): Promise<void> {
		console.log("generate sql input and output");
	}

	async genSqlInputOutputBindings(service: Entry): Promise<void> {
		try {
			// prepare request
			const [input, output, sqls, query] = await Promise.all([
				this.appService.readJsonFile(vscode.Uri.joinPath(service.uri, 'input.json')),
				this.appService.readJsonFile(vscode.Uri.joinPath(service.uri, 'output.json')),
				this.appService.readSqlFile(vscode.Uri.joinPath(service.uri, 'sqls.sql')),
				this.appService.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'))
			]);
			const request: BindSqlsRequest = {
				applicationUri: util.applicaitionUriForService(service.uri.path),
				input, output, sqlsString: sqls, queryString: query
			};
			// call service
			const result = await this.builderService.bindSql(request);
			// process result
			const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'input-bindings.json');
			const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'output-bindings.json');
			await this.appService.writeJsonFile(inputBidningsUri, result.inputBindings);
			await this.appService.writeJsonFile(outputBidningsUri, result.outputBindings);
			vscode.window.showTextDocument(inputBidningsUri, {preview: false});
			vscode.window.showTextDocument(outputBidningsUri, {preview: false});
			// inform user
			vscode.window.showInformationMessage('input and output bindings are generated');
		} catch (error) {
			console.error('Error in generating sqls input and output bindings', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async genCrudObject(service: Entry): Promise<void> {
		console.log("generate crud object");
	}

	async genCrudInputOutputBindings(service: Entry): Promise<void> {
		try {
			// prepare request
			const [object, query] = await Promise.all([
				this.appService.readJsonFile(vscode.Uri.joinPath(service.uri, 'object.json')),
				this.appService.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql'))
			]);
			const request: BindCrudQueryRequest = {
				applicationUri: util.applicaitionUriForService(service.uri.path),
				object, queryString: query
			};
			// call service
			const result = await this.builderService.bindCrudQuery(request);
			// process result
			const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'input-bindings.json');
			const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'output-bindings.json');
			await this.appService.writeJsonFile(inputBidningsUri, result.inputBindings);
			await this.appService.writeJsonFile(outputBidningsUri, result.outputBindings);
			vscode.window.showTextDocument(inputBidningsUri, {preview: false});
			vscode.window.showTextDocument(outputBidningsUri, {preview: false});
			// inform user
			vscode.window.showInformationMessage('input and output bindings are generated');
		} catch (error) {
			console.error('Error in generating crud input and output bindings', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async genCrudTableBindings(service: Entry): Promise<void> {
		try {
			// prepare request
			const [query, outputBindings] = await Promise.all([
				this.appService.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql')),
				this.appService.readJsonFile(vscode.Uri.joinPath(service.uri, 'read', 'output-bindings.json'))
			]);
			const request: BindCrudTableRequest = {
				applicationUri: util.applicaitionUriForService(service.uri.path),
				outputBindings, crudQueryString: query
			};
			// call service
			const tables: Table[] = await this.builderService.bindCrudTable(request);
			// process result
			const tableContent = [];
			for (let table of tables) {
				// table
				tableContent.push({
					"name": table.table,
					"alias": table.alias,
					"object": table.object,
					"rootTable": table.rootTable,
					"columns": `./${table.table}.columns.json`
				});
				// columns
				let columnFileName = `${table.table}.columns.json`;
				this.appService.writeJsonFile(vscode.Uri.joinPath(service.uri, 'write', columnFileName), table.columns);
			}
			const tablesUri = vscode.Uri.joinPath(service.uri, 'write', 'tables.json');
			await this.appService.writeJsonFile(tablesUri, tableContent);
			vscode.window.showTextDocument(tablesUri, {preview: false});
			// inform user
			vscode.window.showInformationMessage('table bindings are generated');
		} catch (error) {
			console.error('Error in generating crud tables bindings', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async addTest(testFolder: Entry): Promise<void> {
		try {
			const testFile = await this.appService.addTest(testFolder);
			this.dataProvider.fire(testFolder);
			this.treeView.reveal(testFile, {focus: true, select: false});
			vscode.window.showTextDocument(testFile.uri, {preview: false});
		} catch(error){
			vscode.window.showErrorMessage(error.message);
		}
	}

	async duplicateTest(test: Entry): Promise<void> {
		try {
			const testFile = await this.appService.duplicateTest(test);
			if (!testFile.parent) {
				return;
			}
			this.dataProvider.fire(testFile.parent);
			this.treeView.reveal(testFile, {focus: true, select: false});
			vscode.window.showTextDocument(testFile.uri, {preview: false});
		} catch(error){
			vscode.window.showErrorMessage(error.message);
		}
	}

}


import * as vscode from 'vscode';
import * as path from 'path';
import * as util from '../core/util';
import * as model from '../core/model';
import {ApplicationDataProvider} from './applicationDataProvider';
import {ApplicationService} from "./applicationService";
import {Entry, EntryType} from './applicationModel';
import {
	BindCrudQueryRequest,
	BindCrudTableRequest,
	BindQueryRequest,
	BindQueryResult,
	BindSqlsRequest,
    BuilderService,
	GenerateCrudOptions,
	GenerateCrudRequest,
	GenerateCrudResult,
	GenerateInputOutputRequest,
	GenerateInputOutputResult,
	GenerateObjectRequest,
	GenerateObjectResult,
	GetTableListRequest,
	NameConvention,
	Table,
	WhereClauseType,
	Versions
} from '../core/builderService';
import { ServiceReader } from '../core/serviceReader';

export class ApplicationExplorer {
	private context: vscode.ExtensionContext;
	private dataProvider: ApplicationDataProvider;
	private treeView: vscode.TreeView<Entry>;
	private appService: ApplicationService;
	private serviceReader: ServiceReader;
	private builderService: BuilderService;
	private doubleClick = new util.DoubleClick();

	constructor(context: vscode.ExtensionContext, builderService: BuilderService) {
		this.context = context;
		this.appService = new ApplicationService();
		this.serviceReader = new ServiceReader();
		this.builderService = builderService;
		this.dataProvider = new ApplicationDataProvider(this.appService);
		this.treeView = vscode.window.createTreeView('servicebuilderExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
		context.subscriptions.push(this.treeView);
		vscode.commands.registerCommand('servicebuilderExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.connect', () => this.connect());
		vscode.commands.registerCommand('servicebuilderExplorer.workspace', () => this.workspace());
		vscode.commands.registerCommand('servicebuilderExplorer.openWelcome', () => this.openWelcome());
		vscode.commands.registerCommand('servicebuilderExplorer.openTutorial', () => this.openTutorial());
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

	connect(): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Workspace URL", prompt: "from Service Console"})
			.then( url => {
				if (url) {
					vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: "Access Token", prompt: "from Service Console"}).then( async (token) => {
						if (token) {
							//validate url
							if (!url.match(/^.+\.builder\..+$/)) {
								vscode.window.showErrorMessage("invalid connection URL: " + url);	
								return;							
							}
							// save connection
							const workspace = url.substr(url.indexOf('://')+3, url.indexOf('.builder.')-url.indexOf('://')-3);
							await this.context.secrets.store('servicebuilder.url', url);
							await this.context.secrets.store('servicebuilder.token', token);
							await this.context.secrets.store('servicebuilder.workspace', workspace);
							this.workspace();
						} else {
							vscode.window.showErrorMessage("no token entered.");
						}
					});
				} else {
					vscode.window.showErrorMessage("no url entered.");
				}
			});		
	}

	async workspace(): Promise<void> {
		// get workspace
		const workspace = {
			name: await this.context.secrets.get("servicebuilder.workspace"),
			url: await this.context.secrets.get("servicebuilder.url"),
			token: await this.context.secrets.get("servicebuilder.token"),
			versions: {} as Versions
		};
		// get builder versions
		try {
			// test connection
			workspace.versions = await this.builderService.getBuilderVersions();
			// show
			vscode.window.showInformationMessage(
			   `Workspace Connection Is Good. \n
				Name: ${workspace.name} \n
				Url: ${workspace.url} \n
				Versions: 
					specification:  ${workspace.versions.specification}
					engine:  ${workspace.versions.engine}
					builder:  ${workspace.versions.builder}`,
				{ modal: true },
				"OK"
			);
		} catch(error) {
			vscode.window.showErrorMessage(
				`Workspace Connection Not Working. Please check connection parameters.\n
				 Name: ${workspace.name} \n
				 Url: ${workspace.url} \n
				 Token: ${workspace.token} \n
				 Message: ${error.message}`,
				{ modal: true },
				"OK"
			);
		}
	}

	openWelcome(): void {
		const uri = vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'Welcome.md'));
		vscode.commands.executeCommand("markdown.showPreview", uri);	
	}

	openTutorial(): void {
		const uri = vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'Tutorial.md'));
		vscode.commands.executeCommand("markdown.showPreviewToSide", uri);	
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
			// create application
			const versions = await this.builderService.getBuilderVersions();
			const app = await this.appService.createApplication(this.dataProvider.workfolder, appName, dbType, versions);
			// reveal
			this.refresh();
			this.treeView.reveal(app, {expand: 2, focus: true, select: true});
			// deploy application
			this.deployApplication(app);
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
			// read application
			const application = await this.getApplication(app);
			// call service
			await this.builderService.deployApplication(application);
			// inform user
			vscode.window.showInformationMessage('application is deployed.');
		} catch (error) {
			console.error('Error in deploying application', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async getApplication(app: Entry): Promise<model.ApplicationAggregate> {
		// application
		const application: model.ApplicationAggregate = {
			application: await this.serviceReader.getApplication(app.uri),
			modules: []
		};
		// src
		let children: Entry[] = await this.appService.getChildren(app);
		let src: Entry = this.appService.defaultEntry('src', vscode.FileType.Directory, app);
		for (let child of children) {
			if (child.name === 'src') {
				src = child;
			}
		}
		// modules
		children = await this.appService.getChildren(src);
		const promises: Promise<model.ModuleAggregate>[] = [];
		for (let child of children) {
			if (child.type === EntryType.Module) {
				promises.push(this.getModule(child));
			}
		}
		application.modules = await Promise.all(promises);
		// return
		return application;
	}

	async createModule(app: Entry, modName: string): Promise<void> {
		try {
			// create module
			const mod = await this.appService.createModule(app, modName);
			// reveal module
			this.dataProvider.fire(app);
			this.treeView.reveal(mod, {expand: 2, focus: true, select: true});	
			// deploy module
			this.deployModule(mod);
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
			const module = await this.getModule(mod);

			// call deploy service
			await this.builderService.deployModule(module);

			// inform user
			vscode.window.showInformationMessage('module is deployed.');
		} catch (error) {
			console.error('Error in deploying module', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async getModule(mod: Entry): Promise<model.ModuleAggregate> {
			// module
			const module: model.ModuleAggregate = {
				module: await this.serviceReader.getModule(mod.uri),
				services: []
			};
			// services
			const children: Entry[] = await this.appService.getChildren(mod);
			const promises: Promise<model.ServiceSpec>[] = [];
			for (let child of children) {
				if ([EntryType.QueryService, EntryType.SqlService, EntryType.CrudService].includes(child.type)) {
					promises.push(this.serviceReader.getService(child.uri));
				}
			}
			module.services = await Promise.all(promises);
			// return
			return module;
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
			// get service
			const serviceSpec = await this.serviceReader.getService(service.uri);
			// call service
			await this.builderService.deployService(serviceSpec);
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

	async onGenerateCrud(module: Entry) {
		// get table list
		const applicationUri = await util.applicationUriForModule(module.uri.path);
		const request: GetTableListRequest = {
			applicationUri
		};
		const tables = await this.builderService.getTableList(request);

		// displace table pick
		vscode.window.showQuickPick(tables, {ignoreFocusOut: true, placeHolder: "tables", canPickMany: true}).then( (tbls) => {
			const options: GenerateCrudOptions = {
				whereClause: WhereClauseType.keys, fieldNameConvention: NameConvention.CAMEL
			};
			if (tbls) {
				this.generateCrud(module, applicationUri, tbls, options);
			} else {
				vscode.window.showInformationMessage('no table selected');
			}
		});
	}

	async generateCrud(module: Entry, applicationUri: string, tableNames: string[], options: GenerateCrudOptions) {
		try {
			// prepare request
			const request: GenerateCrudRequest = {
				applicationUri, tableNames, options
			} ;
			// call service
			const results: GenerateCrudResult[] = await this.builderService.genCruds(request);
			// process result
			this.createCruds(module, results);
			// inform user
			vscode.window.showInformationMessage('CRUD services are generated');
		} catch (error) {
			console.error('Error in generating crud services', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async genQueryInputOutput(service: Entry) {
		try {
			// prepare request
			const query = await util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'));
			const request: GenerateInputOutputRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
				queryString: query,
				sqlsString:[],
				nameConvention: NameConvention.CAMEL
			} ;
			// call service
			const result: GenerateInputOutputResult = await this.builderService.genQueryInputOutput(request);
			// process result
			const inputUri = vscode.Uri.joinPath(service.uri, 'input.json');
			const outputUri = vscode.Uri.joinPath(service.uri, 'output.json');
			await util.writeJsonFile(inputUri, result.input);
			await util.writeJsonFile(outputUri, result.output);
			vscode.window.showTextDocument(inputUri, {preview: false});
			vscode.window.showTextDocument(outputUri, {preview: false});
			// inform user
			vscode.window.showInformationMessage('input and output are generated');
		} catch (error) {
			console.error('Error in generating query input and output', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async genQueryInputOutputBindings(service: Entry) {
		try {
			// prepare request
			const [input, output, query] = await Promise.all([
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'input.json')),
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'output.json')),
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'))
			]);
			const request: BindQueryRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
				input, output, queryString: query
			};
			// call service
			const result: BindQueryResult = await this.builderService.bindQuery(request);
			// process result
			const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'input-bindings.json');
			const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'output-bindings.json');
			await util.writeJsonFile(inputBidningsUri, result.inputBindings);
			await util.writeJsonFile(outputBidningsUri, result.outputBindings);
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
		try {
			// prepare request
			const [query, sqls] = await Promise.all([
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql')),
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'sqls.sql'))
			]);
			const request: GenerateInputOutputRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
				queryString: query,
				sqlsString: sqls,
				nameConvention: NameConvention.CAMEL
			} ;
			// call service
			const result: GenerateInputOutputResult = await this.builderService.genSqlInputOutput(request);
			// process result
			const inputUri = vscode.Uri.joinPath(service.uri, 'input.json');
			const outputUri = vscode.Uri.joinPath(service.uri, 'output.json');
			await util.writeJsonFile(inputUri, result.input);
			await util.writeJsonFile(outputUri, result.output);
			vscode.window.showTextDocument(inputUri, {preview: false});
			vscode.window.showTextDocument(outputUri, {preview: false});
			// inform user
			vscode.window.showInformationMessage('input and output are generated');
		} catch (error) {
			console.error('Error in generating sql input and output', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async genSqlInputOutputBindings(service: Entry): Promise<void> {
		try {
			// prepare request
			const [input, output, sqls, query] = await Promise.all([
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'input.json')),
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'output.json')),
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'sqls.sql')),
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'query.sql'))
			]);
			const request: BindSqlsRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
				input, output, sqlsString: sqls, queryString: query
			};
			// call service
			const result = await this.builderService.bindSql(request);
			// process result
			const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'input-bindings.json');
			const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'output-bindings.json');
			await util.writeJsonFile(inputBidningsUri, result.inputBindings);
			await util.writeJsonFile(outputBidningsUri, result.outputBindings);
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
		try {
			// prepare request
			const query = await util.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql'));
			const request: GenerateObjectRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
				queryString: query,
				nameConvention: NameConvention.CAMEL
			} ;
			// call service
			const result: GenerateObjectResult = await this.builderService.genCrudObject(request);
			// process result
			const objectUri = vscode.Uri.joinPath(service.uri, 'object.json');
			await util.writeJsonFile(objectUri, result.object);
			vscode.window.showTextDocument(objectUri, {preview: false});
			// inform user
			vscode.window.showInformationMessage('object is generated');
		} catch (error) {
			console.error('Error in generating crud object', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	async genCrudInputOutputBindings(service: Entry): Promise<void> {
		try {
			// prepare request
			const [object, query] = await Promise.all([
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'object.json')),
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql'))
			]);
			const request: BindCrudQueryRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
				object, queryString: query
			};
			// call service
			const result = await this.builderService.bindCrudQuery(request);
			// process result
			const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'input-bindings.json');
			const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'output-bindings.json');
			await util.writeJsonFile(inputBidningsUri, result.inputBindings);
			await util.writeJsonFile(outputBidningsUri, result.outputBindings);
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
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql')),
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'read', 'output-bindings.json'))
			]);
			const request: BindCrudTableRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
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
				await util.writeJsonFile(vscode.Uri.joinPath(service.uri, 'write', columnFileName), table.columns);
			}
			const tablesUri = vscode.Uri.joinPath(service.uri, 'write', 'tables.json');
			await util.writeJsonFile(tablesUri, tableContent);
			vscode.window.showTextDocument(tablesUri, {preview: false});
			this.revealTables(service);
			// inform user
			vscode.window.showInformationMessage('table bindings are generated');
		} catch (error) {
			console.error('Error in generating crud tables bindings', error);
			vscode.window.showErrorMessage(error.message);
		}
	}

	revealTables(service: Entry): void {
		const write = {
			uri: vscode.Uri.joinPath(service.uri, 'write'),
			name: 'write',
			type: EntryType.Write,
			parent: service
		} as Entry;
		this.dataProvider.fire(write);
		const tables = {
			uri: vscode.Uri.joinPath(write.uri, 'tables.json'),
			name: 'tables',
			type: EntryType.Component,
			parent: write
		} as Entry;
		this.treeView.reveal(tables, {expand: true, select: true});
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

    async createCruds(mod: Entry, cruds: GenerateCrudResult[]): Promise<void> {
        for (let crud of cruds) {
            this.createCrud(mod, crud);
        }
    }

    async createCrud(mod: Entry, crud: GenerateCrudResult): Promise<void> {
		// create service
		await this.createService(mod, crud.serviceName, 'crud');
        // object
        await util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'object.json'), crud.object);
        // query
        await util.writeSqlFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'query.sql'), crud.crudQuery);
        // input bindings
        await util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'input-bindings.json'), crud.inputBindings);       
        // output bindings
        await util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'output-bindings.json'), crud.outputBindings);
        // table
		await this.createTables(vscode.Uri.joinPath(mod.uri, crud.serviceName), crud.tables);
		// reveal table
		const service = {
			uri: vscode.Uri.joinPath(mod.uri, crud.serviceName),
			type: EntryType.CrudService,
			fileType: vscode.FileType.Directory,
			parent: mod
		} as Entry;
		this.treeView.reveal(service, {expand: 3, select: true});
    }
    
    async createTables(serviceUri: vscode.Uri, tables: Table[]): Promise<void> {
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
			await util.writeJsonFile(vscode.Uri.joinPath(serviceUri, 'write', columnFileName), table.columns);
		}
		const tablesUri = vscode.Uri.joinPath(serviceUri, 'write', 'tables.json');
		await util.writeJsonFile(tablesUri, tableContent);
    }

}


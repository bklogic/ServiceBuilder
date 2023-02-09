import * as vscode from 'vscode';
import * as util from '../../core/util';
import {ApplicationDataProvider} from './applicationDataProvider';
import {ServiceHandlerService} from "./serviceHandlerService";
import {Entry, EntryType} from './applicationModel';
import {
	BindCrudQueryRequest,
	BindCrudTableRequest,
	BindQueryRequest,
	BindQueryResult,
	BindSqlsRequest,
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
} from '../../backend/builder/builderModel';
import { ViewColumn } from 'vscode';
import { BuilderClient } from '../../backend/builder/builderClient';
import { BuilderService } from '../../backend/builder/builderService';


export class ServiceHandler {
	private dataProvider: ApplicationDataProvider;
	private treeView: vscode.TreeView<Entry>;
	private handlerService: ServiceHandlerService;
	private builderService: BuilderService;
	private doubleClick = new util.DoubleClick();

	constructor(builderClient: BuilderClient, dataProvider: ApplicationDataProvider, treeView: vscode.TreeView<Entry>) {
		this.dataProvider = dataProvider;
		this.treeView = treeView;
		this.handlerService = new ServiceHandlerService();
		this.builderService = builderClient.builderService;
		vscode.commands.registerCommand('servicebuilderExplorer.openWithJsonViewer', (resource) => this.openWithJsonViewer(resource));
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

	async openWithJsonViewer(resource: Entry): Promise<void> {
		await vscode.window.showTextDocument(resource.uri);
		await vscode.commands.executeCommand('vscode.openWith', resource.uri, 'jsonGridViewer.json', {viewColumn: ViewColumn.Beside, preserveFocus: true});
		vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
	}

	onCreateService(mod: Entry, serviceType: string): void {
		vscode.window.showInputBox({ignoreFocusOut: true, placeHolder: `${serviceType} service name`, prompt: "must be an alphanumberic"})
			.then( name => {
				if (name) {
					this.createService(mod, name, serviceType);
				}
			});
	}

	async createService(mod: Entry, name: string, type: string): Promise<void> {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'creating service'
			}, async (progress) => {
				try {
					// clear status message
					vscode.window.setStatusBarMessage('');
					// create service
					const service = await this.handlerService.createService(mod, name, type);
					this.dataProvider.fire(mod);
					this.treeView.reveal(service, {expand: 2, focus: true, select: true});	
					// inform user
					vscode.window.setStatusBarMessage('service is created.');
				} catch (error: any) {
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
			});		
	}

	async deployService(service: Entry): Promise<void> {
		try {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'deploying service'
			}, async (progress) => {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip 
				const appUri = await util.applicationUriForService(service.uri.path);
				const modName = service.parent?.name || 'modName';  // service.parent never be null
				const archive = await util.getArchive(service.uri.fsPath);
				// call service
				const result = await this.builderService.deployService(appUri, modName, service.name, archive);
				// inform user
				vscode.window.setStatusBarMessage( result.valid ? 'service is deployed.' : result.reason);
			});		
		} catch (error: any) {
			console.error('Error in deploying service', error);
			vscode.window.setStatusBarMessage('Failed to deploy service: ' + error.message);
		}
	}

	async undeployService(service: Entry): Promise<void> {
		try {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'undeploying service'
			}, async (progress) => {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip 
				const appUri = await util.applicationUriForService(service.uri.path);
				const modName = service.parent?.name || 'modName';  // service.parent never be null
				// call service
				await this.builderService.undeployService(appUri, modName, service.name);
				// inform user
				vscode.window.setStatusBarMessage('service is undeployed.');
			});		
		} catch (error: any) {
			console.error('Error in undeploying service', error);
			vscode.window.setStatusBarMessage('Failed to undeploy service: ' + error.message);
		}
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
			const conventions = ['Camel', 'None'];
			if (tbls && tbls.length > 0) {
				// display name convention
				vscode.window.showQuickPick(conventions, {ignoreFocusOut: true, placeHolder: "name conventions", canPickMany: false}).then( (convn) => {
					if (convn) {
						let cvn: NameConvention;
						switch (convn) {
							case 'Camel':
								cvn = NameConvention.CAMEL;
								break;
							case 'None':
								cvn = NameConvention.NONE;
								break;
							default:
								cvn = NameConvention.CAMEL;
						}
						const options: GenerateCrudOptions = { whereClause: WhereClauseType.keys, fieldNameConvention: cvn };
						this.generateCrud(module, applicationUri, tbls, options);
					} else {
						vscode.window.setStatusBarMessage('No name convention selected');
					}
				});
			} else {
				vscode.window.setStatusBarMessage('No table selected');
			}
		});
	}

	async generateCrud(module: Entry, applicationUri: string, tableNames: string[], options: GenerateCrudOptions) {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'generating crud services'
		}, async (progress) => {
			try {
				// prepare request
				const request: GenerateCrudRequest = {
					applicationUri, tableNames, options
				};
				// call service
				const results: GenerateCrudResult[] = await this.builderService.genCruds(request);
				// process result
				const services = await this.createCruds(module, results);
				// deploy services
				for (let service of services) {
					this.deployService(service);
				}
				// inform user
				vscode.window.setStatusBarMessage('CRUD services are generated');
			} catch (error: any) {
				console.error('Error in generating crud services', error);
				vscode.window.setStatusBarMessage('Failed to generate crud services: ' + error.message);
			}
		});
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
			// vscode.window.showTextDocument(outputUri, {preview: false});
			// inform user
			vscode.window.setStatusBarMessage('input and output are generated');
		} catch (error: any) {
			console.error('Error in generating query input and output', error);
			vscode.window.setStatusBarMessage('Failed to generate query input and output: ' + error.message);
		}
	}

	async genQueryInputOutputBindings(service: Entry) {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'generating input and output bindings'
		}, async (progress) => {
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
				// inform user
				vscode.window.setStatusBarMessage('input and output bindings are generated');
			} catch (error: any) {
				console.error('Error in generating query input and output bindings', error);
				vscode.window.setStatusBarMessage('Failed to generate query input and output bindings: ' + error.message);
			}
		});
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
			vscode.window.showTextDocument(inputUri, {preview: true});
			// vscode.window.showTextDocument(outputUri, {preview: true});
			// inform user
			vscode.window.setStatusBarMessage('input and output are generated');
		} catch (error: any) {
			console.error('Error in generating sql input and output', error);
			vscode.window.setStatusBarMessage('Failed to generate sql input and output: ' + error.message);
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
			// inform user
			vscode.window.setStatusBarMessage('input and output bindings are generated');
		} catch (error: any) {
			console.error('Error in generating sqls input and output bindings', error);
			vscode.window.setStatusBarMessage('Failed to generate sqls input and output bindings: ' + error.message);
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
			const inputUri = vscode.Uri.joinPath(service.uri, 'read', 'input.json');
			await util.writeJsonFile(objectUri, result.object);
			await util.writeJsonFile(inputUri, result.input);
			vscode.window.showTextDocument(objectUri, {preview: false});
			// vscode.window.showTextDocument(inputUri, {preview: false});
			// inform user
			vscode.window.setStatusBarMessage('object is generated');
		} catch (error: any) {
			console.error('Error in generating crud object', error);
			vscode.window.setStatusBarMessage('Failed to generate crud object: ' + error.message);
		}
	}

	async genCrudInputOutputBindings(read: Entry): Promise<void> {
		const service = read.parent;
		if (!service) { // never happen
			return;
		}
		try {
			// prepare request
			const [object, query, input] = await Promise.all([
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'object.json')),
				util.readSqlFile(vscode.Uri.joinPath(service.uri, 'read', 'query.sql')),
				util.readJsonFile(vscode.Uri.joinPath(service.uri, 'read', 'input.json')),
			]);
			const request: BindCrudQueryRequest = {
				applicationUri: await util.applicationUriForService(service.uri.path),
				object, queryString: query, input
			};
			// call service
			const result = await this.builderService.bindCrudQuery(request);
			// process result
			const inputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'input-bindings.json');
			const outputBidningsUri = vscode.Uri.joinPath(service.uri, 'read', 'output-bindings.json');
			await util.writeJsonFile(inputBidningsUri, result.inputBindings);
			await util.writeJsonFile(outputBidningsUri, result.outputBindings);
			// inform user
			vscode.window.setStatusBarMessage('input and output bindings are generated');
		} catch (error: any) {
			console.error('Error in generating crud input and output bindings', error);
			vscode.window.setStatusBarMessage('Failed to generate crud input and output bindings: ' + error.message);
		}
	}

	async genCrudTableBindings(write: Entry): Promise<void> {
		const service = write.parent;
		if (!service) { // never happen
			return;
		}
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
			// clean up current binding fiels
			const files = await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(service.uri, 'write'));
			files.forEach( async ([name, type]) => {
				if (name !== 'tables.json') {
					await vscode.workspace.fs.delete(vscode.Uri.joinPath(service.uri, 'write', name));
				}
			});
			// process result
			const tableContent = [];
			for (let table of tables) {
				// table
				tableContent.push({
					"name": table.table,
					"alias": table.alias,
					"object": table.object,
					"rootTable": table.rootTable,
					"mainTable": table.mainTable,
					"operationIndicator": table.operationIndicator,
					"columns": `./${table.table}.columns.json`
				});
				// columns
				let columnFileName = `${table.table}.columns.json`;
				await util.writeJsonFile(vscode.Uri.joinPath(service.uri, 'write', columnFileName), table.columns);
			}
			const tablesUri = vscode.Uri.joinPath(service.uri, 'write', 'tables.json');
			await util.writeJsonFile(tablesUri, tableContent);
			this.dataProvider.fire(service);
			this.revealTables(service);
			// inform user
			vscode.window.setStatusBarMessage('table bindings are generated');
		} catch (error: any) {
			console.error('Error in generating crud tables bindings', error);
			vscode.window.setStatusBarMessage('Failed to generate crud table bindings: ' + error.message);
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
		const serviceType = testFolder.parent?.serviceType;
		if (!serviceType) { // never happen
			return;
		}

		// get operation if crud service
		let testTypes: string [] = [];
		if (serviceType === 'crud') {
			await vscode.window.showQuickPick(['all', 'read', 'create', 'update', 'delete', 'save'], {ignoreFocusOut: true, placeHolder: "select an operation", 
					canPickMany: false}).then( (operation) => {
				if (operation) {
					testTypes = (operation==='all') ? ['read', 'create', 'update', 'delete', 'save'] : [operation];		
				} else {
					vscode.window.setStatusBarMessage("No operation selected.");
					return;
				}
			});
		} else {
			testTypes = [serviceType];
		}

		// add tests
		try {
			let testFile;
			const tests = testTypes.length;
			for (let testType of testTypes) {
				testFile = await this.handlerService.addTest(testFolder, testType);				
				this.dataProvider.fire(testFolder);
				this.treeView.reveal(testFile, {focus: true, select: false});
				if (tests === 1) {
					vscode.window.showTextDocument(testFile.uri, {preview: false});
				}
			}
		} catch(error: any){
			vscode.window.setStatusBarMessage('Failed to add test: ' + error.message);
		}
	}

	async duplicateTest(test: Entry): Promise<void> {
		try {
			const testFile = await this.handlerService.duplicateTest(test);
			if (!testFile.parent) {
				return;
			}
			this.dataProvider.fire(testFile.parent);
			this.treeView.reveal(testFile, {focus: true, select: false});
			vscode.window.showTextDocument(testFile.uri, {preview: true});
		} catch(error: any){
			vscode.window.setStatusBarMessage('Failed to duplicate test: ' + error.message);
		}
	}

    async createCruds(mod: Entry, cruds: GenerateCrudResult[]): Promise<Entry[]> {
		const services: Entry[] = [];
        for (let crud of cruds) {
            const service = await this.createCrud(mod, crud);
			services.push(service);
        }
		return services;
    }

    async createCrud(mod: Entry, crud: GenerateCrudResult): Promise<Entry> {
		// create service
		await this.handlerService.createService(mod, crud.serviceName, 'crud');

		// add contents

        // object
        await util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'object.json'), crud.object);
        // input
        await util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'input.json'), crud.input);
        // query
        await util.writeSqlFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'query.sql'), crud.crudQuery);
        // input bindings
        await util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'input-bindings.json'), crud.inputBindings);       
        // output bindings
        await util.writeJsonFile(vscode.Uri.joinPath(mod.uri, crud.serviceName, 'read', 'output-bindings.json'), crud.outputBindings);
        // table
		await this.createTables(vscode.Uri.joinPath(mod.uri, crud.serviceName), crud.tables);

		// reveal service
		const service = {
			uri: vscode.Uri.joinPath(mod.uri, crud.serviceName),
			type: EntryType.CrudService,
			name: crud.serviceName,
			fileType: vscode.FileType.Directory,
			parent: mod
		} as Entry;
		this.dataProvider.fire(mod);
		this.treeView.reveal(service, {expand: 3, select: true});
		return service;
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
				"mainTable": table.mainTable,
				"operationIndicator": table.operationIndicator,
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


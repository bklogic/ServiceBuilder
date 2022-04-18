import * as vscode from 'vscode';
import * as path from 'path';
import * as URL from 'url';
import * as util from '../core/util';
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
	Versions,
	DataSource,
	TestDataSourceRequest
} from '../core/builderService';
import { Application, Module, Service } from '../core/deployService';


export class ApplicationExplorer {
	private context: vscode.ExtensionContext;
	private dataProvider: ApplicationDataProvider;
	private treeView: vscode.TreeView<Entry>;
	private appService: ApplicationService;
	private builderService: BuilderService;
	private doubleClick = new util.DoubleClick();

	constructor(context: vscode.ExtensionContext, appService: ApplicationService, builderService: BuilderService) {
		this.context = context;
		this.appService = appService;
		this.builderService = builderService;
		this.dataProvider = new ApplicationDataProvider(this.appService);
		this.treeView = vscode.window.createTreeView('servicebuilderExplorer', { treeDataProvider: this.dataProvider, showCollapseAll: true });
		context.subscriptions.push(this.treeView);
		vscode.commands.registerCommand('servicebuilderExplorer.openResource', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.openWelcome', () => this.openWelcome());
		vscode.commands.registerCommand('servicebuilderExplorer.openTutorial', () => this.openTutorial());
		vscode.commands.registerCommand('servicebuilderExplorer.refresh', () => this.refresh());
		vscode.commands.registerCommand('servicebuilderExplorer.rename', (resource) => this.onRename(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.delete', (resource) => this.delete(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.copy', (resource) => this.copy(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.paste', (resource) => this.paste(resource));
		vscode.commands.registerCommand('servicebuilderExplorer.createApplication', () => this.onCreateApplication());
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
		vscode.commands.registerCommand('servicebuilderExplorer.addReadTest', (resource) => this.addTest(resource, 'read'));
		vscode.commands.registerCommand('servicebuilderExplorer.addWriteTest', (resource) => this.addTest(resource, 'write'));
		vscode.commands.registerCommand('servicebuilderExplorer.duplicateTest', (resource) => this.duplicateTest(resource));
	}

	openResource(resource: Entry): void {
		vscode.window.showTextDocument(resource.uri, {preview: !this.doubleClick.check(resource)});
	}

	refresh(): void {
		this.dataProvider.refresh();
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
							vscode.window.setStatusBarMessage("No database type selected.");
						}
					});
				} else {
					vscode.window.setStatusBarMessage("No application name specified.");
				}
			});
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

	// async createApplication(appName: string, dbType: string): Promise<Entry|void> {
	// 	try {
	// 		vscode.window.withProgress({
	// 			location: vscode.ProgressLocation.Window,
	// 			cancellable: false,
	// 			title: 'Creating application'
	// 		}, async (progress) => {
	// 			// clear status message
	// 			vscode.window.setStatusBarMessage('');

	// 			// create application
	// 			const versions = await this.builderService.getBuilderVersions();
	// 			const app = await this.appService.createApplication(this.dataProvider.workfolder, appName, dbType, versions);

	// 			// reveal
	// 			this.refresh();
	// 			this.treeView.reveal(app, {expand: 2, focus: true, select: true});

	// 			// deploy application
	// 			await this.deployApplication(app); 

	// 			// inform user
	// 			vscode.window.setStatusBarMessage('application is created.');

	// 			return app;
	// 		});		
	// } catch (error: any) {
	// 		let message: string;
	// 		switch (error.code) {
	// 			case 'FileExists':
	// 				message = 'Application name exists.';
	// 				break;
	// 			default:
	// 				message = error.message;
	// 		}
	// 		vscode.window.showErrorMessage(message);
	// 	}
	// }

	async createApplication(appName: string, dbType: string): Promise<Entry|void> {
		try {
			// clear status message
			vscode.window.setStatusBarMessage('');

			// create application
			const versions = await this.builderService.getBuilderVersions();
			const app = await this.appService.createApplication(this.dataProvider.workfolder, appName, dbType, versions);

			// reveal
			this.refresh();
			this.treeView.reveal(app, {expand: 2, focus: true, select: true});

			// deploy application
			await this.deployApplication(app); 

			// inform user
			vscode.window.setStatusBarMessage('application is created.');

			return app;
	} catch (error: any) {
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
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'deploying application'
			}, async (progress) => {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip application
				const appUri = await util.applicationUriForApplication(app.uri.path);
				const archive = await util.getApplicationArchive(app.uri, this.context);
				// call service
				await this.builderService.deployApplication(appUri, archive);
				// inform user
				vscode.window.setStatusBarMessage('application is deployed.');
			});		
		} catch (error: any) {
			console.error('Error in deploying application', error);
			vscode.window.setStatusBarMessage('Failed to deploy application: ' + error.message);
		}
	}

	async undeployApplication(app: Entry): Promise<void> {
		try {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'undeploying application'
			}, async (progress) => {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip application
				const appUri = await util.applicationUriForApplication(app.uri.path);
				// call service
				await this.builderService.undeployApplication(appUri);
				// inform user
				vscode.window.setStatusBarMessage('application is undeployed.');
			});		
		} catch (error: any) {
			console.error('Error in undeploying application', error);
			vscode.window.setStatusBarMessage('Failed to undeploy application: ' + error.message);
		}
	}


	// async createModule(app: Entry, modName: string): Promise<void> {
	// 	vscode.window.withProgress({
	// 		location: vscode.ProgressLocation.Window,
	// 		cancellable: false,
	// 		title: 'Creating module'
	// 	}, async (progress) => {
	// 		try {
	// 			// clear status message
	// 			vscode.window.setStatusBarMessage('');
	// 			// create module
	// 			const mod = await this.appService.createModule(app, modName);
	// 			// reveal
	// 			this.dataProvider.fire(app);
	// 			this.treeView.reveal(mod, {expand: 2, focus: true, select: true});	
	// 			// deploy module
	// 			this.deployModule(mod);
	// 			// inform user
	// 			vscode.window.setStatusBarMessage('Module is created.');
	// 		} catch (error: any) {
	// 			let message: string;
	// 			switch (error.code) {
	// 				case 'FileExists':
	// 					message = 'Module name exists.';
	// 					break;
	// 				default:
	// 					message = error.message;
	// 			}
	// 			vscode.window.showErrorMessage(message);
	// 		}
	// 	});		
	// }

	async createModule(app: Entry, modName: string): Promise<void> {
		try {
			// clear status message
			vscode.window.setStatusBarMessage('');
			// create module
			const mod = await this.appService.createModule(app, modName);
			// reveal
			this.dataProvider.fire(app);
			this.treeView.reveal(mod, {expand: 2, focus: true, select: true});	
			// deploy module
			await this.deployModule(mod);
			// inform user
			vscode.window.setStatusBarMessage('Module is created.');
		} catch (error: any) {
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
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'deploying module'
			}, async (progress) => {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip module
				const appUri = await util.applicationUriForModule(mod.uri.path);
				const archive = await util.getArchive(mod.uri.fsPath);
				// call service
				await this.builderService.deployModule(appUri, mod.name, archive);
				// inform user
				vscode.window.setStatusBarMessage('module is deployed.');
			});		
		} catch (error: any) {
			console.error('Error in deploying module', error);
			vscode.window.setStatusBarMessage('Failed to deploy module: ' + error.message);
		}
	}

	async undeployModule(mod: Entry): Promise<void> {
		try {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'undeploying module'
			}, async (progress) => {
				// clear status message
				vscode.window.setStatusBarMessage('');
				// zip module
				const appUri = await util.applicationUriForModule(mod.uri.path);
				// call service
				await this.builderService.undeployModule(appUri, mod.name);
				// inform user
				vscode.window.setStatusBarMessage('module is undeployed.');
			});		
		} catch (error: any) {
			console.error('Error in undeploying module', error);
			vscode.window.setStatusBarMessage('Failed to undeploy module: ' + error.message);
		}
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
					const service = await this.appService.createService(mod, name, type);
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
				await this.builderService.deployService(appUri, modName, service.name, archive);
				// inform user
				vscode.window.setStatusBarMessage('service is deployed.');
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

	async delete(entry: Entry): Promise<void> {
		try {
			await this.appService.delete(entry.uri);
			if (entry.parent) {
				const parent = (entry.parent.name === 'src') ? entry.parent.parent : entry.parent;
				if (parent === null) { 
					vscode.window.showErrorMessage("Parent is null. Should never happen.");
					return;
				}; 
				this.dataProvider.fire(parent);
				this.treeView.reveal(parent, {focus: true, select: true});
			} else {
				this.refresh();
			}	
		} catch (error: any) {
			vscode.window.setStatusBarMessage('Failed to delete item: ' + error.message);
		}
	}

	private onRename(entry: Entry): void {
		this.treeView.reveal(entry, {select: true});
		vscode.window.showInputBox({
			ignoreFocusOut: true, placeHolder: `new ${entry.type} name`, value: entry.name, prompt: "must be an alphanumberic"
		})
			.then( name => {
				if (name) {
					this.rename(entry, name);
				}
			});
	}

	async rename(entry: Entry, name: string): Promise<void> {
		// get target uri
		let targetUri: vscode.Uri;
		if (entry.parent) {
			targetUri = vscode.Uri.joinPath(entry.parent.uri, name);
		} else { // application
			targetUri = vscode.Uri.joinPath(this.dataProvider.workfolder.uri, name);
		}

		// check target exists
		if (await this.appService.fileExists(targetUri)) {
			vscode.window.setStatusBarMessage('target name exists');
			return;
		}

		// rename
		try {
			await this.appService.rename(entry.uri, targetUri);
		} catch (error: any) {
			vscode.window.setStatusBarMessage('Failed to rename item: ' + error.message);
			return;
		}

		// redeploy
		const newEntry = {
			uri: targetUri,
			name: name,
			type: entry.type,
			fileType: entry.fileType,
			parent: entry.parent
		} as Entry;
		await this.redeploy(entry, newEntry);

		// show
		if (!entry.parent) {
			this.dataProvider.refresh();
		}
		else if (entry.parent.name === 'src') {
			this.dataProvider.fire(entry.parent.parent || entry.parent);
		} else {
			this.dataProvider.fire(entry.parent);
		}

		// try {
		// 	let newEntry: Entry;
		// 	if (entry.parent) { 
		// 		await this.appService.rename(entry.uri, vscode.Uri.joinPath(entry.parent.uri, name));
		// 		const parent = (entry.parent.name === 'src') ? entry.parent.parent : entry.parent;
		// 		if (parent === null) { 
		// 			vscode.window.showErrorMessage("Parent is null. Should never happen.");
		// 			return;
		// 		}; 
		// 		this.dataProvider.fire(parent);
		// 		newEntry = this.appService.defaultEntry(name, entry.fileType, entry.parent);
		// 	} else {
		// 		await this.appService.rename(entry.uri, vscode.Uri.joinPath(this.dataProvider.workfolder.uri, name));
		// 		this.refresh();
		// 		newEntry = this.appService.defaultEntry(name, entry.fileType, this.dataProvider.workfolder);
		// 		newEntry.parent = null;
		// 	}
		// 	this.treeView.reveal(newEntry, {focus: true});	
		// } catch (error: any) {
		// 	let message: string;
		// 	switch (error.code) {
		// 		case 'FileExists':
		// 			message = 'Name exists.';
		// 			break;
		// 		default:
		// 			message = error.message;
		// 	}
		// 	vscode.window.showErrorMessage(message);
		// }
	}

	async redeploy(entry: Entry, newEntry: Entry) {
		switch (entry.type) {
			case EntryType.Application:
				const appUri = vscode.Uri.joinPath(newEntry.uri, 'src', 'application.json');
				const app = await util.readJsonFile(appUri) as Application;
				app.name = newEntry.name;
				await util.writeJsonFile(appUri, app);
				await this.resavePassword(entry, newEntry);
				await this.undeployApplication(entry);
				await this.deployApplication(newEntry);
				await this.testDataSource(newEntry);
				break;
			case EntryType.Module:
				const modUri = vscode.Uri.joinPath(newEntry.uri, 'module.json');
				const mod = await util.readJsonFile(modUri) as Module;
				mod.name = newEntry.name;
				await util.writeJsonFile(modUri, mod);
				await this.undeployModule(entry);
				await this.deployModule(newEntry);
				break;
			case EntryType.QueryService: case EntryType.SqlService: case EntryType.CrudService:
				const serviceUri = vscode.Uri.joinPath(newEntry.uri, 'service.json');
				const service = await util.readJsonFile(serviceUri) as Service;
				service.name = newEntry.name;
				await util.writeJsonFile(serviceUri, service);
				await this.undeployService(entry);
				await this.deployService(newEntry);
				break;
		}
	}

	private async testDataSource(app: Entry) {
        const dataSourceUri = vscode.Uri.joinPath(app.uri, 'src', 'datasource.json');
		const dataSource = await util.readJsonFile(dataSourceUri) as DataSource;
		const testReq: TestDataSourceRequest =  {
			applicationUri: await util.applicationUriForApplication(app.uri.path),
			dbType: dataSource.dbType,
			host: dataSource.host,
			port: dataSource.port,
			database: dataSource.database,
			username: dataSource.username,
			password: await util.retrievePassword(this.context, dataSourceUri.path)
		 } ;
		this.builderService.testDataSource(testReq);
	}

	private async resavePassword(app: Entry, newApp: Entry): Promise<void> {
        const dataSourceUri = vscode.Uri.joinPath(app.uri, 'src', 'datasource.json');
        const newDataSourceUri = vscode.Uri.joinPath(newApp.uri, 'src', 'datasource.json');
		const password = await util.retrievePassword(this.context, dataSourceUri.path);
		util.storePassword(this.context, newDataSourceUri.path, password);
	}

	private copy(entry: Entry) {
		vscode.env.clipboard.writeText(JSON.stringify(entry));
	}

	private async paste(target: Entry) {
		// retrieve source
		const text = await vscode.env.clipboard.readText();
		if (!text) {
			vscode.window.setStatusBarMessage('Nothing to paste.');
			return;
		}
		let source: Entry;
		try {
			source = JSON.parse(text) as Entry;
		} catch (error: any) {
			vscode.window.setStatusBarMessage('No entry to paste');
			return;
		}
		// copy target
		let targetUri: vscode.Uri;
		if (source.type === EntryType.Application && target.type === EntryType.Application) {
			targetUri = await this.appService.getCopyTarget(source.name, this.dataProvider.workfolder.uri);
			await this.appService.copy(source.uri, targetUri);
			this.dataProvider.refresh();
		} 
		else if (source.type === EntryType.Module && target.type === EntryType.Application) {
			targetUri = await this.appService.getCopyTarget(source.name, vscode.Uri.joinPath(target.uri, 'src'));
			await this.appService.copy(source.uri, targetUri);
			this.dataProvider.fire(target);
		} 
		else if (( source.type === EntryType.QueryService 
					|| source.type === EntryType.SqlService 
					|| source.type === EntryType.CrudService 
				) && target.type === EntryType.Module ) {
			targetUri = await this.appService.getCopyTarget(source.name, target.uri);
			await this.appService.copy(source.uri, targetUri);
			this.dataProvider.fire(target);
		} else {
			vscode.window.setStatusBarMessage('Not right target to paste');
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
				this.createCruds(module, results);
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
			vscode.window.showTextDocument(outputUri, {preview: false});
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
			title: 'generating crud services'
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
				vscode.window.showTextDocument(inputBidningsUri, {preview: false});
				vscode.window.showTextDocument(outputBidningsUri, {preview: false});
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
			vscode.window.showTextDocument(inputUri, {preview: false});
			vscode.window.showTextDocument(outputUri, {preview: false});
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
			vscode.window.showTextDocument(inputBidningsUri, {preview: false});
			vscode.window.showTextDocument(outputBidningsUri, {preview: false});
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
			vscode.window.showTextDocument(inputUri, {preview: false});
			// inform user
			vscode.window.setStatusBarMessage('object is generated');
		} catch (error: any) {
			console.error('Error in generating crud object', error);
			vscode.window.setStatusBarMessage('Failed to generate crud object: ' + error.message);
		}
	}

	async genCrudInputOutputBindings(service: Entry): Promise<void> {
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
			vscode.window.showTextDocument(inputBidningsUri, {preview: false});
			vscode.window.showTextDocument(outputBidningsUri, {preview: false});
			// inform user
			vscode.window.setStatusBarMessage('input and output bindings are generated');
		} catch (error: any) {
			console.error('Error in generating crud input and output bindings', error);
			vscode.window.setStatusBarMessage('Failed to generate crud input and output bindings: ' + error.message);
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
					"mainTable": table.mainTable,
					"columns": `./${table.table}.columns.json`
				});
				// columns
				let columnFileName = `${table.table}.columns.json`;
				await util.writeJsonFile(vscode.Uri.joinPath(service.uri, 'write', columnFileName), table.columns);
			}
			const tablesUri = vscode.Uri.joinPath(service.uri, 'write', 'tables.json');
			await util.writeJsonFile(tablesUri, tableContent);
			vscode.window.showTextDocument(tablesUri, {preview: false});
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

	async addTest(testFolder: Entry, testType?: string): Promise<void> {
		try {
			const testFile = await this.appService.addTest(testFolder, testType);
			this.dataProvider.fire(testFolder);
			this.treeView.reveal(testFile, {focus: true, select: false});
			vscode.window.showTextDocument(testFile.uri, {preview: false});
		} catch(error: any){
			vscode.window.setStatusBarMessage('Failed to add test: ' + error.message);
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
		} catch(error: any){
			vscode.window.setStatusBarMessage('Failed to duplicate test: ' + error.message);
		}
	}

    async createCruds(mod: Entry, cruds: GenerateCrudResult[]): Promise<void> {
        for (let crud of cruds) {
            this.createCrud(mod, crud);
        }
    }

    async createCrud(mod: Entry, crud: GenerateCrudResult): Promise<void> {
		// create service
		await this.appService.createService(mod, crud.serviceName, 'crud');

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
			fileType: vscode.FileType.Directory,
			parent: mod
		} as Entry;
		this.dataProvider.fire(mod);
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
				"mainTable": table.mainTable,
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


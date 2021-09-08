import * as vscode from 'vscode';
import * as util from '../core/util';
import {Item, ItemType} from './deploymentModel';
import {
    DeployService, Application, ApplicationAggregate, Module, Service, Test
} from '../core/deployService';


export class DeploymentService {

    private context: vscode.ExtensionContext;
    private deployService: DeployService;

    constructor(context: vscode.ExtensionContext, deployService: DeployService) {
        this.context = context;
        this.deployService = deployService;
    }

    async refreshAppList(): Promise<void> {
        // get local workfolder
        const workfolder = util.getWorkFolder();
        if (!workfolder) {
            return;
        }
        // get remote workspace
        const workspace = await this.context.secrets.get('servicebuilder.workspace');
        if (!workspace) {
            console.warn('Not connected to workspace.');
            return;
        }
        // fresh deployment folder
        const deployFolder = await this.refreshDeployFolder(workfolder.uri);
        // get applicationas
        const apps = await this.deployService.getApplications(workspace);
        // write app list
        await this.writeAppList(deployFolder, apps);
    }

    async refreshDeployFolder(workFolder: vscode.Uri): Promise<vscode.Uri> {
        const deployFolder = vscode.Uri.joinPath(workFolder, '.deployments');
        if (await util.fileExists(deployFolder)) {
            vscode.workspace.fs.delete(deployFolder, {recursive: true});
        }
        await vscode.workspace.fs.createDirectory(deployFolder);
        return deployFolder;
    }

    async writeAppList(deployFolder: vscode.Uri, apps: Application[]): Promise<void> {
        for (let app of apps) {
            vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(deployFolder, app.name));
            util.writeJsonFile(vscode.Uri.joinPath(deployFolder, app.name, 'application'), app);
        }
    }

    async refreshApp(app: Item): Promise<void> {
        // refresh application folder
        await this.refreshAppFolder(app.fileUri);
        // get application aggregate
        const application = await this.deployService.getApplicationAggregate(app.uri);
        // write application
        this.writeAppAggreagte(application, app.fileUri);
    }

    async refreshAppFolder(appFolder: vscode.Uri): Promise<void> {
        vscode.workspace.fs.delete(appFolder, {recursive: true});
        await vscode.workspace.fs.createDirectory(appFolder);
    }

    async writeAppAggreagte(app: ApplicationAggregate, appUri: vscode.Uri): Promise<void> {
        // application file
        util.writeJsonFile(vscode.Uri.joinPath(appUri, 'application'), app.application);
        // write modules
        for (let mod of app.modules) {
            // write module file
            const modUri = vscode.Uri.joinPath(appUri, mod.module.name);
            vscode.workspace.fs.createDirectory(modUri);
            util.writeJsonFile(vscode.Uri.joinPath(modUri, 'module'), mod.module);

            // write services
            for (let service of mod.services) {
                const splits = service.uri.split('/');
                const serviceName = splits[splits.length-1];
                const serviceUri = vscode.Uri.joinPath(modUri, serviceName);
                vscode.workspace.fs.createDirectory(serviceUri);
                util.writeJsonFile(vscode.Uri.joinPath(serviceUri, 'service'), service);    
            }
        }
    }

    async reloadTests(service: Item): Promise<void> {
        // get builder url
        const builderUrl = await this.context.secrets.get('servicebuilder.url');
        const token = await this.context.secrets.get('servicebuilder.token');
        if (!builderUrl) {
            throw new Error('Not connected to workspace');
        }

        // get tests
        const tests = await this.deployService.getTests(service.uri);

        // build tests contents
        let content : string[] = ['', '## Tests to run with REST Client for Visual Studio Code', ''];
        for (let test of tests) {
            content = content.concat( this.writeTest(test, builderUrl, token, service.type));
        }

        // write tests file
        const str = content.join('\n');
        vscode.workspace.fs.writeFile(vscode.Uri.joinPath(service.fileUri, 'tests.http'),  util.strToBuffer(str));
    }

    writeTest(test: Test, builderUrl: string, token: string | undefined, serviceType: ItemType): string[] {
        const content : string[] = []; 
        content.push(`### ${test.testId} - ${test.name}`); 
        if (serviceType === ItemType.CrudService) {
            content.push(`POST ${builderUrl}/service/${test.serviceUri}/${test.operation}`);     
        } else {
            content.push(`POST ${builderUrl}/service/${test.serviceUri}`);     
        }
        content.push('Content-Type: application/json');       
        content.push(`Authorization: Bearer ${token}`);       
        content.push('');       
        content.push( JSON.stringify(test.input, null, 4) );    
        content.push('');       
        content.push('');       
        return content;   
    }

    async getChildren(item?: Item): Promise<Item[]> {
        if (!item) {
            return this.getApplicationItems();
        } 
        else if (item.type === ItemType.Application) {
            return this.getModuleItems(item);
        }
        else if (item.type === ItemType.Module) {
            return this.getServiceItems(item);
        }
        else if (item.type === ItemType.QueryService || item.type === ItemType.SqlService || item.type === ItemType.CrudService) {
            return this.getTestItems(item);
        }
        else {
            throw new Error('Never happen.');
        }
    }

    async getApplicationItems(): Promise<Item[]> {
        // get workfolder
        const workfolder = util.getWorkFolder();
        if (!workfolder) {
            return [];
        }

        // check deployment folder
        const deployFolder = vscode.Uri.joinPath(workfolder.uri, '.deployments');
        const exists = await util.fileExists(deployFolder);
        if (!exists) {
            return [];
        }

        // get applications
        const children = await vscode.workspace.fs.readDirectory(deployFolder);

        const items = await Promise.all( 
            children.filter(async ([name, fileType]) => {
                return (fileType === vscode.FileType.Directory)
                    && await util.fileExists(vscode.Uri.joinPath(deployFolder , name, 'application'));
            }).map(async ([name, fileType]) => {
                let app: Application = await util.readJsonFile(vscode.Uri.joinPath(deployFolder, name, 'application'));
                return {
                    uri: app.uri,
                    type: ItemType.Application,
                    name: name,
                    fileType: vscode.FileType.Directory,
                    fileUri: vscode.Uri.joinPath(deployFolder, name),
                    parent: null
                } as Item;
            })
        );

        // return
        return items;
    }

    async getModuleItems(app: Item): Promise<Item[]> {
        try {
            // get children
            const children = await vscode.workspace.fs.readDirectory(app.fileUri);

            // get modules
            const mods = children.filter( ([name, fileType]) => {
                return (fileType === vscode.FileType.Directory);
                    // && util.fileExists(vscode.Uri.joinPath(app.fileUri , name, 'module'));
            });
            const items = await Promise.all( 
                mods.map(async ([name, fileType]) => {
                    let mod: Module = await util.readJsonFile(vscode.Uri.joinPath(app.fileUri, name, 'module'));
                    return {
                        uri: mod.uri,
                        type: ItemType.Module,
                        name: name,
                        fileType: vscode.FileType.Directory,
                        fileUri: vscode.Uri.joinPath(app.fileUri, name),
                        parent: app
                    } as Item;
                }) 
            );    
            // return item list
            return items;
        } catch (error) {
            console.error(error);
            throw new Error('Error to load modules');
        }
    }

    async getServiceItems(mod: Item): Promise<Item[]> {
        // get children
        const children = await vscode.workspace.fs.readDirectory(mod.fileUri);

        // get services
        const services = children.filter( ([name, fileType]) => {
            return (fileType === vscode.FileType.Directory);
        });
        const items = await Promise.all( 
            services.map(async ([name, fileType]) => {
                let service: Service = await util.readJsonFile(vscode.Uri.joinPath(mod.fileUri, name, 'service'));
                return {
                    uri: service.uri,
                    type: this.itemType(service.serviceType),
                    name: name,
                    fileType: vscode.FileType.Directory,
                    fileUri: vscode.Uri.joinPath(mod.fileUri, name),
                    parent: mod
                } as Item;
            }) 
        );

        // return item list
        return items;
    }    

    async getTestItems(service: Item): Promise<Item[]> {
        // get children
        const children = await vscode.workspace.fs.readDirectory(service.fileUri);

        // get tests
        const items = await Promise.all( 
            children.filter( ([name, fileType]) => {
                return (fileType === vscode.FileType.File) && (name === 'tests.http');
            }).map(async ([name, fileType]) => {
                return {
                    type: ItemType.Tests,
                    name: name,
                    fileType: vscode.FileType.File,
                    fileUri: vscode.Uri.joinPath(service.fileUri, name),
                    parent: service
                } as Item;
            }) 
        );

        // return item list
        return items;
    }    

	itemType(serviceType: string): ItemType {
		switch(serviceType) {
			case 'query':
				return ItemType.QueryService;
			case 'sql':
				return ItemType.SqlService;
			case 'crud':
				return ItemType.CrudService;
			default:
				return ItemType.Other;	
		}
	}

    async loadTests(service: Item): Promise<void> {
        // get tests
        const tests = await this.deployService.getTests(service.uri);
    }

    async loadDataSource(app: Item): Promise<vscode.Uri> {
        // get data source
        const datasource = await this.deployService.getDataSource(app.uri);
        // write data source
        const docUri = vscode.Uri.joinPath(app.fileUri, '.datasource');
        await util.writeJsonFile(docUri, datasource);
        // return
        return docUri;
    }

    async loadService(service: Item): Promise<vscode.Uri> {
        // get data source
        const spec = await this.deployService.getService(service.uri);
        // write data source
        const docUri = vscode.Uri.joinPath(service.fileUri, '.service');
        await util.writeJsonFile(docUri, spec);
        // return
        return docUri;
    }

}


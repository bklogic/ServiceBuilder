import * as vscode from 'vscode';
import * as util from '../../core/util';
import {Item, ItemType} from './deploymentModel';
import {DataSource, Application, Module, Service} from '../../backend/deployService';


export class DeploymentDataService {

    constructor() {}

    async getChildren(item?: Item): Promise<Item[]> {
        if (!item) {
            return this.getTopItems();
        } 
        else if (item.type === ItemType.DataSources) {
            return this.getDataSourceItems(item);
        }
        else if (item.type === ItemType.Applications) {
            return this.getApplicationItems(item);
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
            return [];
        } 
    }


    async getTopItems(): Promise<Item[]> {
        // get workfolder
        const workfolder = util.getWorkFolder();
        if (!workfolder) {
            return [];
        }
        // data sources item
        const datasources = {
            uri: 'datasources',
            type: ItemType.DataSources,
            name: 'Data Sources',
            fileType: vscode.FileType.Directory,
            fileUri: vscode.Uri.joinPath(workfolder.uri, '.devtime', 'datasources'),
            parent: null,
            seqNo: 1
        } as Item;
        // applications item
        const applications = {
            uri: 'applications',
            type: ItemType.Applications,
            name: 'Applications',
            fileType: vscode.FileType.Directory,
            fileUri: vscode.Uri.joinPath(workfolder.uri, '.devtime', 'applications'),
            parent: null,
            seqNo: 2
        } as Item;

        return [datasources, applications];
    }

    async getDataSourceItems(item: Item): Promise<Item[]> {
        // check data sources folder
        const exists = await util.fileExists(item.fileUri);
        if (!exists) {
            return [];
        }

        // get data sources
        const children = await vscode.workspace.fs.readDirectory(item.fileUri);
        const items = await Promise.all( 
            children.filter(async ([name, fileType]) => {
                return (fileType === vscode.FileType.File);
            }).map(async ([name, fileType]) => {
                let ds: DataSource = await util.readJsonFile(vscode.Uri.joinPath(item.fileUri, name));
                return {
                    uri: ds.uri,
                    type: ItemType.DataSource,
                    name: name,
                    fileType: vscode.FileType.File,
                    fileUri: vscode.Uri.joinPath(item.fileUri, name),
                    parent: item
                } as Item;
            })
        );

        // return
        return items;
    }    

    async getApplicationItems(item: Item): Promise<Item[]> {
        // check applications folder
        const exists = await util.fileExists(item.fileUri);
        if (!exists) {
            return [];
        }

        // get applications
        const children = await vscode.workspace.fs.readDirectory(item.fileUri);

        const items = await Promise.all( 
            children.filter(async ([name, fileType]) => {
                return (fileType === vscode.FileType.Directory)
                    && await util.fileExists(vscode.Uri.joinPath(item.fileUri , name, 'application'));
            }).map(async ([name, fileType]) => {
                let app: Application = await util.readJsonFile(vscode.Uri.joinPath(item.fileUri, name, 'application'));
                return {
                    uri: app.uri,
                    type: ItemType.Application,
                    name: name,
                    fileType: vscode.FileType.Directory,
                    fileUri: vscode.Uri.joinPath(item.fileUri, name),
                    parent: item
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
        } catch (error: any) {
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
                    state: service.state,
                    fileType: (service.state === 'valid') ? vscode.FileType.Directory : vscode.FileType.File,
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

}

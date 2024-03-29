import * as vscode from 'vscode';
import * as util from '../../core/util';
import {Item, ItemType} from './deploymentModel';
import {
    Application, ApplicationAggregate, Service, Test, DataSource
} from '../../backend/builder/deployModel';
import {DeployService} from '../../backend/builder/deployService';
import { BuilderClient } from '../../backend/builder/builderClient';
import { Workspace } from '../../backend/builder/builderModel';


export class DeploymentExplorerService {

    private context: vscode.ExtensionContext;
    private deployService: DeployService;

    constructor(context: vscode.ExtensionContext, builderClient: BuilderClient) {
        this.context = context;
        this.deployService = builderClient.deployService;
    }

    async refreshDataSourceList(): Promise<void> {
        // get local workfolder
        const workfolder = util.getWorkFolder();
        if (!workfolder) {
            return;
        }
        // get data source list
        const dataSources = await this.deployService.getDataSources();
        // write app list
        await this.writeDataSourceList(util.devtimeDsUri(), dataSources);
    }

    async refreshDataSource(item: Item): Promise<void> {
        // get data source
        const dataSource = await this.deployService.getDataSource(item.uri);
        // write data source
        await util.writeJsonFile(item.fileUri, dataSource);
    }

    async cleanDataSource(item: Item): Promise<void> {
        // clean deployed data source
        await this.deployService.cleanDataSource(item.uri);
        // clean local copy
        await vscode.workspace.fs.delete(item.fileUri);
    }

    async testDataSource(dataSource: Item): Promise<string|null> {
        const result = await this.deployService.testDeployedDataSource(dataSource.uri);
        return (result.succeed) ? null : result.message;
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
            vscode.window.setStatusBarMessage('Not connected to workspace.');
            return;
        }
        // get applicationas
        const apps = await this.deployService.getApplications();
        // write app list
        await this.writeAppList(util.devtimeAppUri(), apps);
    }

    async refreshDeployFolder(deployFolder: vscode.Uri): Promise<void> {
        if (await util.fileExists(deployFolder)) {
            await vscode.workspace.fs.delete(deployFolder, {recursive: true});
        }
        await vscode.workspace.fs.createDirectory(deployFolder);
    }

    async writeAppList(appsFolder: vscode.Uri, apps: Application[]): Promise<void> {
        // refresh applications folder
        await this.refreshDeployFolder(appsFolder);
        // write applications
        for (let app of apps) {
            util.writeJsonFile(vscode.Uri.joinPath(appsFolder, app.name, 'application'), app);
        }
    }

    async writeDataSourceList(dataSourcesFolder: vscode.Uri, dataSources: DataSource[]): Promise<void> {
        // fresh deployment folder
        await this.refreshDeployFolder(dataSourcesFolder);
        // write data sources
        for (let datasource of dataSources) {
            const name = util.dataSourceNameFromUri(datasource.uri);
            util.writeJsonFile(vscode.Uri.joinPath(dataSourcesFolder, name), datasource);
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
        // get workspace
        const workspace = await util.readWorkspace(this.context) as Workspace;
        if (!workspace) {
            throw new Error('No workspace connection.');
        }

        // get tests
        const tests = await this.deployService.getTests(service.uri);

        // build tests contents
        let content : string[] = ['', '## Tests to run with REST Client for Visual Studio Code', ''];
        for (let test of tests) {
            content = content.concat( this.writeTest(test, workspace.serviceEndpoint, workspace.token?.token, service.type));
        }

        // write tests file
        const str = content.join('\n');
        vscode.workspace.fs.writeFile(vscode.Uri.joinPath(service.fileUri, 'tests.http'),  util.strToBuffer(str));
    }

    writeTest(test: Test, devtimeUrl: string, token: string | undefined, serviceType: ItemType): string[] {

        const content : string[] = []; 
        const modifiedUri = util.modifiedUri(test.serviceUri);
        content.push(`### ${test.testId}`); 
        if (serviceType === ItemType.CrudService) {
            content.push(`POST ${devtimeUrl}/${modifiedUri}/${test.operation}`);     
        } else {
            content.push(`POST ${devtimeUrl}/${modifiedUri}`);     
        }
        content.push('Content-Type: application/json'); 
        if (token) {
            content.push(`Authorization: Bearer ${token}`);       
        }     
        content.push('');       
        content.push( JSON.stringify(test.input, null, 4) );    
        content.push('');       
        content.push('');       
        return content;   
    }

    async loadTests(service: Item): Promise<void> {
        // get tests
        const tests = await this.deployService.getTests(service.uri);
    }

    async loadDataSource(app: Item): Promise<vscode.Uri> {
        // get data source
        const datasource = await this.deployService.getDataSourceForApplication(app.uri);
        // write data source
        const docUri = vscode.Uri.joinPath(app.fileUri, '.datasource');
        await util.writeJsonFile(docUri, datasource);
        // return
        return docUri;
    }

    async cleanApplication(app: Item): Promise<void> {
        this.deployService.cleanApplication(app.uri);
        vscode.workspace.fs.delete(app.fileUri, {recursive: true});
    }

    async cleanWorkspace(): Promise<void> {
        this.deployService.cleanWorkspace();
        vscode.workspace.fs.delete(util.devtimeAppUri(), {recursive: true});
        vscode.workspace.fs.delete(util.devtimeDsUri(), {recursive: true});
    }

    async loadService(service: Item): Promise<vscode.Uri> {
        // get service
        const spec = await this.deployService.getService(service.uri);
        // write service
        const docUri = vscode.Uri.joinPath(service.fileUri, '.service');
        await util.writeJsonFile(docUri, spec);
        // return
        return docUri;
    }

    async getInvalidatedReason(item: Item): Promise<string> {
        const service = await util.readJsonFile(vscode.Uri.joinPath(item.fileUri, 'service')) as Service;
        return service.reason;
    }
    
}


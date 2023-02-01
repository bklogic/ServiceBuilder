import * as vscode from 'vscode';
import * as util from '../core/util';
import {Item, ItemType} from './deploymentModel';
import {
    DeployService, Application, ApplicationAggregate, Module, Service, Test, DataSource
} from '../services/deployService';
import { TestService } from '../services/testService';


export class DeploymentExplorerService {

    private context: vscode.ExtensionContext;
    private deployService: DeployService;
    private testService: TestService;

    constructor(context: vscode.ExtensionContext, deployService: DeployService, testService: TestService) {
        this.context = context;
        this.deployService = deployService;
        this.testService = testService;
    }

    async refreshDataSourceList(item: Item): Promise<void> {
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
        // get data source list
        const dataSources = await this.deployService.getDataSources(workspace);
        // fresh deployment folder
        const dataSourcesFolder = vscode.Uri.joinPath(workfolder.uri, '.devtime', 'datasources');
        await this.refreshDeployFolder(dataSourcesFolder);
        // write app list
        await this.writeDataSourceList(dataSourcesFolder, dataSources);
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

    async testDataSource(item: Item): Promise<string|null> {
        const result = await this.testService.testDeployedDataSource(item.uri);
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
        const apps = await this.deployService.getApplications(workspace);
        // write app list
        // refresh deployment folder
        const appsFolder = vscode.Uri.joinPath(workfolder.uri, '.devtime', 'applications');
        await this.refreshDeployFolder(appsFolder);
        await this.writeAppList(appsFolder, apps);
    }

    async refreshDeployFolder(deployFolder: vscode.Uri): Promise<void> {
        if (await util.fileExists(deployFolder)) {
            await vscode.workspace.fs.delete(deployFolder, {recursive: true});
        }
        await vscode.workspace.fs.createDirectory(deployFolder);
    }

    async writeAppList(deployFolder: vscode.Uri, apps: Application[]): Promise<void> {
        for (let app of apps) {
            vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(deployFolder, app.name));
            util.writeJsonFile(vscode.Uri.joinPath(deployFolder, app.name, 'application'), app);
        }
    }

    async writeDataSourceList(deployFolder: vscode.Uri, dataSources: DataSource[]): Promise<void> {
        for (let datasource of dataSources) {
            const name = util.dataSourceNameFromUri(datasource.uri);
            util.writeJsonFile(vscode.Uri.joinPath(deployFolder, name), datasource);
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
        content.push(`### ${test.testId}`); 
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

    async loadService(service: Item): Promise<vscode.Uri> {
        // get service
        const spec = await this.deployService.getService(service.uri);
        // write service
        const docUri = vscode.Uri.joinPath(service.fileUri, '.service');
        await util.writeJsonFile(docUri, spec);
        // return
        return docUri;
    }

}


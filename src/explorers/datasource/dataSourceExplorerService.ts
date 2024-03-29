
import * as vscode from 'vscode';
import * as util from '../../core/util';
import { BuilderService } from '../../backend/builder/builderService';
import { DataSourceContentService } from './dataSourceContentService';
import {DataSourceItem, DataSource} from './dataSourceDataModel';
import {DeployDataSourceRequest, TestDataSourceRequest} from '../../backend/builder/builderModel';
import { BuilderClient } from '../../backend/builder/builderClient';


export class DataSourceExplorerService {

    private context : vscode.ExtensionContext;
    private builderService: BuilderService;
    private contentService: DataSourceContentService;

    constructor(context: vscode.ExtensionContext, builderClient: BuilderClient) {
        this.context = context;
        this.builderService = builderClient.builderService;
        this.contentService = new DataSourceContentService();
    }

    async createDataSource(dataSourceName: string, dbType: string): Promise<void> {
        // initialize data source
        const dataSource = this.contentService.initializeDataSource(dbType);

        // write data source file
        const uri = util.dataSourceFileUri(dataSourceName);
        await util.writeJsonFile(uri, dataSource);
    }

	async deleteDataSource(dataSource: DataSourceItem): Promise<void> {
		await vscode.workspace.fs.delete(dataSource.fileUri);
	}

	async renameDataSource(dataSource: DataSourceItem, newName: string): Promise<void> {
        const oldUri = dataSource.fileUri;
        const newUri = util.dataSourceFileUri(newName);
		await vscode.workspace.fs.rename(oldUri, newUri);
	}

	async testDataSource(dataSourceItem: DataSourceItem): Promise<string|null> {
        // get data source config
        const ds = await util.readJsonFile(dataSourceItem.fileUri) as DataSource;    
        
        // get password
        let password = ds.password;
        if (password === util.passwordMask) {
            password = await util.retrievePassword(this.context, dataSourceItem.name);
            if (!password) {
                return "Please enter a valid password.";
            }
        }
        
        // test data source
        const testRequest: TestDataSourceRequest = {
            dbType: ds.dbType,
            host: ds.host,
            port: ds.port,
            database: ds.database,
            username: ds.username,
            password: password,
            ssl: ds.ssl
        };
        const result = await this.builderService.testDataSource(testRequest);

        // store and mask password in file if successful
        if (result.succeed && ds.password !== util.passwordMask) {
            util.storePassword(this.context, dataSourceItem.name,  ds.password);
            ds.password = util.passwordMask;
            util.writeJsonFile(dataSourceItem.fileUri, ds);
        }
        return (result.succeed) ? null : `Data source test failed: ${result.message}` ;
	}

    async deployDataSource(dataSourceItem: DataSourceItem): Promise<void> {
        // get data source config
        const ds = await util.readJsonFile(dataSourceItem.fileUri) as DataSource;
        // deploy data source
        const password = await util.retrievePassword(this.context, dataSourceItem.name);
        if (!password) {
            throw new Error("No password is stored. Test data source first.");
        }
        const deployRequest: DeployDataSourceRequest = {
            uri: await util.dataSourceUriForName(dataSourceItem.name),
            dbType: ds.dbType,
            host: ds.host,
            port: ds.port,
            database: ds.database,
            username: ds.username,
            password: password,
            ssl: ds.ssl
        };
        const result = await this.builderService.deployDataSource(deployRequest);
    }

}

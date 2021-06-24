import * as vscode from 'vscode';
import * as util from './util';
import * as model from './model';


export class ServiceReader {

    constructor() {}

	async getService(serviceUri: vscode.Uri): Promise<model.ServiceSpec> {
		// read service file
        const file = await util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'service.json'));

        // get spec
        let spec;
        const serviceType = file['type'];
        switch (serviceType) {
            case 'query':
                spec = await this.getQueryServiceSpec(serviceUri, file['dynamic']);
                break;
            case 'sql':
                spec = await this.getSqlServiceSpec(serviceUri);
                break;
            case 'crud':
                spec = await this.getCrudServiceSpec(serviceUri);
                break;
        }

        // return service 
        const service = {
            uri: util.serviceUriForService(serviceUri.path),
            serviceType: serviceType,
            dbType: await this.getDbType(serviceUri),
            spec: spec
        } as model.ServiceSpec;
        return service;
	}


    async getQueryServiceSpec(serviceUri: vscode.Uri, dynamic: boolean): Promise<model.QueryServiceSpecification> {
        const service = {dynamic} as model.QueryServiceSpecification;
        [service.input, service.output, service.query, service.inputBindings, service.outputBindings] = await Promise.all([
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'input.json')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'output.json')),
            util.readSqlFile(vscode.Uri.joinPath(serviceUri, 'query.sql')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'input-bindings.json')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'output-bindings.json'))
        ]);
        return service;
    }

    async getSqlServiceSpec(serviceUri: vscode.Uri): Promise<model.SqlServiceSpecification> {
        const service = {} as model.SqlServiceSpecification;
        [service.input, service.output, service.sqls, service.query, service.inputBindings, service.outputBindings] = await Promise.all([
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'input.json')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'output.json')),
            util.readSqlFile(vscode.Uri.joinPath(serviceUri, 'query.sql')),
            util.readSqlFile(vscode.Uri.joinPath(serviceUri, 'query.sql')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'input-bindings.json')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'output-bindings.json'))
        ]);
        return service;
    }

    async getCrudServiceSpec(serviceUri: vscode.Uri): Promise<model.CrudServiceSpecification> {
        const service = { read: {} as model.Read, write: {} as model.Write } as model.CrudServiceSpecification;
        [service.object, service.read.query, service.read.inputBindings, service.read.outputBindings, service.write] = await Promise.all([
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'object.json')),
            util.readSqlFile(vscode.Uri.joinPath(serviceUri, 'read', 'query.sql')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'read', 'input-bindings.json')),
            util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'read', 'output-bindings.json')),
            this.getWrite(serviceUri)
        ]);


        return service;
    }

    async getWrite(serviceUri: vscode.Uri): Promise<model.Write> {
        // read tables
        const tableDefs: TableDefinition[] = await util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'write', 'tables.json'));
        
        // initiate write
        const write: model.Write = {
            tables: [], rootTableAlias: ''
        };
        // populate write
        for (let tableDef of tableDefs) {
            let table: model.Table = {
                table: tableDef.name,
                alias: tableDef.alias,
                object: tableDef.object,
                rootTable: tableDef.rootTable,
                columns: await this.getColumns(serviceUri, tableDef.name)
            };
            write.tables.push(table);
            if (table.rootTable) {
                write.rootTableAlias = table.alias;
            }
        }
        return write;
    }

    async getColumns(serviceUri: vscode.Uri, tableName: string): Promise<model.Column[]> {
        const columns: model.Column[] = await util.readJsonFile(vscode.Uri.joinPath(serviceUri, 'write', tableName + '.columns.json'));
        return columns;
    }


    async getModule(modUri: vscode.Uri): Promise<model.Module> {
        // read module file
        const module: model.Module = await util.readJsonFile(vscode.Uri.joinPath(modUri, 'module.json'));
        // get module uri
        module.uri = util.moduleUriForModule(modUri.path);
        return module;
    }

    async getApplication(appUri: vscode.Uri): Promise<model.Application> {
        // read application file
        const application: model.Application = await util.readJsonFile(vscode.Uri.joinPath(appUri, 'src', 'application.json'));
        // get application uri
        application.uri = util.applicationUriForApplication(appUri.path);
        return application;
    }

    async getDbType(serviceUri: vscode.Uri): Promise<string> {
        const servicePath = serviceUri.path;
        const appPath = servicePath.substr(0, servicePath.indexOf('/src'));
        const appUri = vscode.Uri.file(appPath);
        const application: model.Application = await this.getApplication(appUri);
        return application.dbType;
    }

}

interface TableDefinition {
    name: string;
    alias: string;
    object: string;
    rootTable: boolean;
    columns: string;
}
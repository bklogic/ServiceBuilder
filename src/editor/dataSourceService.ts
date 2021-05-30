import * as vscode from 'vscode';

export class DataSourceService {
    construct() {}

    testDataSource(dataSource: DataSource): Promise<string> {
        return Promise.resolve('success');
    }

    async deployDataSource(dataSource: DataSource): Promise<void> {
        return Promise.resolve();
    }

}

export interface DataSource {
    dbType: string;
    url: string;
    username: string;
    password: string;
}

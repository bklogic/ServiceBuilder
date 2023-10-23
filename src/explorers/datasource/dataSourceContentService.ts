import {DataSource} from './dataSourceDataModel';

export class DataSourceContentService {

    initializeDataSource(dbType: string): DataSource {
        let datasource: DataSource;
        switch (dbType) {
            case 'mysql':
                datasource = this.initializeMySQLDataSource();
                break;
            case 'postgresql':
                datasource = this.initializePostgreSQLDataSource();
                break;
            default:
                datasource = this.initializeMySQLDataSource();
        }
        return datasource;
    }

    initializeMySQLDataSource(): DataSource {
        let datasource: DataSource;
        datasource = {
            dbType: 'mysql', 
            host: 'localhost', 
            port: 3306, 
            database: '', 
            username: '', password: '',
            ssl: false,
            comments: "Complete host, port, database, username and password. Test data source using TEST button."
        } as DataSource;
        return datasource;
    }

    initializePostgreSQLDataSource(): DataSource {
        let datasource: DataSource;
        datasource = {
            dbType: 'postgresql', 
            host: 'localhost', 
            port: 5432, 
            database: '', 
            username: '', password: '',
            ssl: false,
            comments: "Complete host, port, database, username and password. Test data source using TEST button."
        } as DataSource;
        return datasource;
    }

}
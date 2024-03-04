"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceContentService = void 0;
class DataSourceContentService {
    initializeDataSource(dbType) {
        let datasource;
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
    initializeMySQLDataSource() {
        let datasource;
        datasource = {
            dbType: 'mysql',
            host: 'localhost',
            port: 3306,
            database: '',
            username: '', password: '',
            ssl: false,
            comments: "Complete host, port, database, username and password. Test data source using TEST button."
        };
        return datasource;
    }
    initializePostgreSQLDataSource() {
        let datasource;
        datasource = {
            dbType: 'postgresql',
            host: 'localhost',
            port: 5432,
            database: '',
            username: '', password: '',
            ssl: false,
            comments: "Complete host, port, database, username and password. Test data source using TEST button."
        };
        return datasource;
    }
}
exports.DataSourceContentService = DataSourceContentService;
//# sourceMappingURL=dataSourceContentService.js.map
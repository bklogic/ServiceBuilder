export interface Application {
    uri: string;
    name: string;
}

export interface Module {
    uri: string;
    name: string;
}

export interface Service {
    uri: string;
    name: string;
    serviceType: string;
    state: string;
    reason: string;
}

export interface DataSource {
	uri: string;
    dbType: string;
    host: string;
	port: number;
	database: string;
    username: string;
    password: string;
}

export interface TestDataSourceResult {
	succeed: boolean;
	message: string;
}

export interface Test {
    serviceUri: string;
    testId: string;
    name: string
    operation: string;
    input: any;
}

export interface ModuleAggregate {
    module: Module;
    services: Service[];
}

export interface ApplicationAggregate {
    application: Application;
    modules: ModuleAggregate[];
}

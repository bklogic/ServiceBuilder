import {HttpService} from './httpService';

export class DeployService {

	private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	async getApplications(workspace: string): Promise<Application[]> {
		const url = '/deploy/getApplications/' + workspace;
		const apps = await this.http.get(url);
		return apps;
	}

	async getApplicationAggregate(appUri: string): Promise<ApplicationAggregate> {
		const url = '/deploy/getApplicationAggregate/' + appUri;
		const app = await this.http.get(url);
		return app;
	}

	async getTests(serviceUri: string): Promise<Test[]> {
		const url = '/deploy/getTests/' + serviceUri;
		const tests = await this.http.get(url);
		return tests;
	}

	async getDataSource(appUri: string): Promise<DataSource> {
		const url = '/deploy/getDataSource/' + appUri;
		const dataSource = await this.http.get(url);
		return dataSource;
	}

	async getService(serviceUri: string): Promise<DataSource> {
		const url = '/deploy/getService/' + serviceUri;
		const service = await this.http.get(url);
		return service;
	}

}

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
    dbType: string;
    jbdcUrl: string;
    username: string;
    password: string;
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

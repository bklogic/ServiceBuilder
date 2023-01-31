import {HttpService} from '../core/httpService';

export class DeployService {

	private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	async getApplications(workspace: string): Promise<Application[]> {
		const url = '/deploy/getApplications/' + workspace;
		const apps = await this.http.builderGet(url);
		return apps;
	}

	async getApplicationAggregate(appUri: string): Promise<ApplicationAggregate> {
		const url = '/deploy/getApplicationAggregate/' + appUri;
		const app = await this.http.builderGet(url);
		return app;
	}

	async getTests(serviceUri: string): Promise<Test[]> {
		const url = '/deploy/getTests/' + serviceUri;
		const tests = await this.http.builderGet(url);
		return tests;
	}

	async getDataSourceForApplication(appUri: string): Promise<DataSource> {
		const url = '/deploy/getDataSourceForApplication/' + appUri;
		const dataSource = await this.http.builderGet(url);
		return dataSource;
	}

	async cleanApplication(appUri: string): Promise<void> {
		const url = '/deploy/cleanApplication/' + appUri;
		this.http.builderPost(url, {});
	}

	async getService(serviceUri: string): Promise<Service> {
		const url = '/deploy/getService/' + serviceUri;
		const service = await this.http.builderGet(url);
		return service;
	}

	async cleanWorkspace(workspace: string): Promise<void> {
		const url = '/deploy/cleanWorkspace/' + workspace;
		const result = await this.http.builderPost(url, {});
		return result;
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
    host: string;
	port: number;
	database: string;
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

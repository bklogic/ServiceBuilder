import {HttpService} from '../../core/httpService';
import {DataSource, Application, ApplicationAggregate, Service, Test} from './deployModel';

export class DeployService {

	private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	async getDataSources(workspace: string): Promise<DataSource[]> {
		const url = '/deploy/getDataSources/' + workspace;
		const apps = await this.http.builderGet(url);
		return apps;
	}

	async getDataSource(dataSourceUri: string): Promise<DataSource> {
		const url = '/deploy/getDataSource/' + dataSourceUri;
		const apps = await this.http.builderGet(url);
		return apps;
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

	async cleanDataSource(dataSourceUri: string): Promise<void> {
		const url = '/deploy/cleanDataSource/' + dataSourceUri;
		this.http.builderPost(url, {});
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

import {HttpService} from '../../core/httpService';
import {DataSource, Application, ApplicationAggregate, Service, Test} from './deployModel';

export class DeployService {

	private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	async getDataSources(): Promise<DataSource[]> {
		const url = '/inspect/getDataSources';
		const apps = await this.http.builderGet(url);
		return apps;
	}

	async getDataSource(dataSourceUri: string): Promise<DataSource> {
		const url = '/inspect/getDataSource/' + dataSourceUri;
		const apps = await this.http.builderGet(url);
		return apps;
	}

	async getApplications(workspace: string): Promise<Application[]> {
		const url = '/inspect/getApplications';
		const apps = await this.http.builderGet(url);
		return apps;
	}

	async getApplicationAggregate(appUri: string): Promise<ApplicationAggregate> {
		const url = '/inspect/getApplicationAggregate/' + appUri;
		const app = await this.http.builderGet(url);
		return app;
	}

	async getService(serviceUri: string): Promise<Service> {
		const url = '/inspect/getService/' + serviceUri;
		const service = await this.http.builderGet(url);
		return service;
	}

	async getTests(serviceUri: string): Promise<Test[]> {
		const url = '/inspect/getTests/' + serviceUri;
		const tests = await this.http.builderGet(url);
		return tests;
	}

	async getDataSourceForApplication(appUri: string): Promise<DataSource> {
		const url = '/inspect/getDataSourceForApplication/' + appUri;
		const dataSource = await this.http.builderGet(url);
		return dataSource;
	}

	async cleanDataSource(dataSourceUri: string): Promise<void> {
		const url = '/inspect/cleanDataSource/' + dataSourceUri;
		this.http.builderPost(url, {});
	}

	async cleanApplication(appUri: string): Promise<void> {
		const url = '/inspect/cleanApplication/' + appUri;
		this.http.builderPost(url, {});
	}

	async cleanWorkspace(workspace: string): Promise<void> {
		const url = '/inspect/cleanWorkspace';
		const result = await this.http.builderPost(url, {});
		return result;
	}

}

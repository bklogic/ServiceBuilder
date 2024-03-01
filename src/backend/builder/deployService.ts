import * as util from '../../core/util';
import {HttpService} from '../../core/httpService';
import {DataSource, TestDataSourceResult, Application, ApplicationAggregate, Service, Test} from './deployModel';

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
		const url = '/inspect/getDataSource/' + util.modifiedUri(dataSourceUri);
		const apps = await this.http.builderGet(url);
		return apps;
	}

	async testDeployedDataSource(dataSourceUri: string): Promise<TestDataSourceResult> {
		const url = `/test/testDeployedDataSource/${util.modifiedUri(dataSourceUri)}`;
		const result = await this.http.builderPost(url, {});
		return result;
	}

	async getApplications(): Promise<Application[]> {
		const url = '/inspect/getApplications';
		const apps = await this.http.builderGet(url);
		return apps;
	}

	async getApplicationAggregate(appUri: string): Promise<ApplicationAggregate> {
		const url = '/inspect/getApplicationAggregate/' + util.modifiedUri(appUri);
		const app = await this.http.builderGet(url);
		return app;
	}

	async getService(serviceUri: string): Promise<Service> {
		const url = '/inspect/getService/' + util.modifiedUri(serviceUri);
		const service = await this.http.builderGet(url);
		return service;
	}

	async getTests(serviceUri: string): Promise<Test[]> {
		const url = '/inspect/getTests/' + util.modifiedUri(serviceUri);
		const tests = await this.http.builderGet(url);
		return tests;
	}

	async getDataSourceForApplication(appUri: string): Promise<DataSource> {
		const url = '/inspect/getDataSourceForApplication/' + util.modifiedUri(appUri);;
		const dataSource = await this.http.builderGet(url);
		return dataSource;
	}

	async cleanDataSource(dataSourceUri: string): Promise<void> {
		const url = '/inspect/cleanDataSource/' + util.modifiedUri(dataSourceUri);
		this.http.builderPost(url, {});
	}

	async cleanApplication(appUri: string): Promise<void> {
		const url = '/inspect/cleanApplication/' + util.modifiedUri(appUri);
		this.http.builderPost(url, {});
	}

	async cleanWorkspace(): Promise<void> {
		const url = '/inspect/cleanWorkspace';
		const result = await this.http.builderPost(url, {});
		return result;
	}

}

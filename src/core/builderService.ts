
import {HttpService} from './httpService';

export class BuilderService {
	private http: HttpService;

	constructor() {
		this.http = new HttpService();
	}

	/**
	 * builder versions
	 */
	async getBuilderVersions(): Promise<Versions> {
		const url = '/builder/getVersions';
		const versions = await this.http.get(url);
		return versions;
	}
	
	/**
	 * Data Source
	 */
	async testDataSource(request: TestDataSourceRequest): Promise<TestDataSourceResult> {
		const url = '/test/testDataSource';
		const result = await this.http.post(url, request);
		return result;
	}

	async deployDataSource(dataSourceConfig: DataSourceConfig): Promise<DeployResult> {
		const url = '/deploy/deployDataSource';
		const result = await this.http.post(url, dataSourceConfig);
		return result;
	}

	/**
	 * Test
	 */
	async testService(request: TestServiceRequest): Promise<TestDataSourceResult> {
		const url = '/test/testDataSource';
		const result = await this.http.post(url, request);
		return result;
	}
		
	/**
	 * Explorer
	 */


}


// data model
export interface Versions {
	specification: string; 
	engine: string; 
	builder: string
}

export interface TestDataSourceRequest {
	dbType: string;
	jdbcUrl: string;
	username: string;
	password: string;
}

export interface TestDataSourceResult {
	succeed: boolean;
	message: string;
}

export interface DataSourceConfig {
	applicationUri: string;
	dbType: string;
	jdbcUrl: string;
	username: string;
	password: string;	
}

export interface DeployResult {
	succeed: boolean
}

export interface TestServiceRequest {
	applicationUri: string;
	moduleName: string;
	serviceName: string;
	input: any;
	operation: string;
	withCommit: boolean;
}

export interface TestServiceResult {
	succeed: boolean;
	output: any;
	exception: TestException
}

export interface TestException {
	name: string;
	type: string;
	message: string;
}
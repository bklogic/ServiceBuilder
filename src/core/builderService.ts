
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
	async testService(request: TestServiceRequest): Promise<TestServiceResult> {
		const url = '/test/testService';
		const result = await this.http.post(url, request);
		return result;
	}
		
	/**
	 * Explorer
	 */
	async bindQuery(request: BindQueryRequest): Promise<BindQueryResult> {
		const url = '/bind/bindQuery';
		const result = await this.http.post(url, request);
		return result;
	}

	async bindSql(request: BindSqlsRequest): Promise<BindSqlsResult> {
		const url = '/bind/bindSqls';
		const result = await this.http.post(url, request);
		return result;
	}

	async bindCrudQuery(request: BindCrudQueryRequest): Promise<BindCrudQueryResult> {
		const url = '/bind/bindCrudQuery';
		const result = await this.http.post(url, request);
		return result;
	}

	async bindCrudTable(request: BindCrudTableRequest): Promise<Table[]> {
		const url = '/bind/bindCrudTable';
		const result = await this.http.post(url, request);
		return result;
	}

	async deployApplication(request: DeployRequest): Promise<DeployResult> {
		const url = '/deploy/deployApplication';
		const result = await this.http.post(url, request);
		return result;
	}

	async deployModule(request: DeployRequest): Promise<DeployResult> {
		const url = '/deploy/deployModule';
		const result = await this.http.post(url, request);
		return result;
	}

	async deployService(request: DeployRequest): Promise<DeployResult> {
		const url = '/deploy/deployService';
		const result = await this.http.post(url, request);
		return result;
	}

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

export interface BindQueryRequest {
	applicationUri: string;
	queryString: string [];
	input: any;
	output: any
}

export interface BindQueryResult {
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
}

export interface InputBinding {
	parameter: string;
	field: string;
}

export interface OutputBinding {
	column: string;
	field: string;
}

export interface BindSqlsRequest {
	applicationUri: string;
	sqlsString: string [];
	queryString: string [];
	input: any;
	output: any
}

export interface BindSqlsResult {
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
}

export interface BindCrudQueryRequest {
	applicationUri: string;
	queryString: string [];
	object: any
}

export interface BindCrudQueryResult {
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
}

export interface BindCrudTableRequest {
	applicationUri: string;
	crudQueryString: string[];
	outputBindings: OutputBinding[];
}

export interface Table {
	table: string;
	alias: string;
	object: string;
	operationIndicator: string;
	columns: Column[];
	rootTable: boolean;
}

export interface Column {
	column: string;
	field: string;
	position: number;
	dataType: string;
	insertValue: string;
	updateValue: string;
	key: boolean;
	autoGenerate: boolean;
	notNull: boolean;
	version: boolean;
	softDelete: boolean;
	keyEligible: boolean;
	versionEligible: boolean;
	softDeleteEligible: boolean;
}

export interface DeployRequest {
	deployType: string;
	applicationUri: string;
	moduleName: string;
	serviceName: string;
}

export interface DeployResult {
	succeed: boolean
}

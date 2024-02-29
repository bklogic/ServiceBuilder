
import {HttpService} from '../../core/httpService';
import { 
	Versions,
	BindCrudQueryRequest,
	BindCrudQueryResult,
	BindCrudTableRequest,
	BindQueryRequest,
	BindQueryResult,
	BindSqlsRequest,
	BindSqlsResult,
	DeployDataSourceRequest,
	DeployResult,
	DeployServiceResult,
	GenerateCrudRequest,
	GenerateCrudResult,
	GenerateInputOutputRequest,
	GenerateInputOutputResult,
	GenerateObjectRequest,
	GenerateObjectResult,
	GetTableListRequest,
	Table,
	TestDataSourceRequest, TestDataSourceResult, TestServiceRequest, TestServiceResult, 
	ConnectRequest, Workspace, RefreshTokenRequest, AccessToken, 
} from './builderModel';

export class BuilderService {

	private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	/**
	 * workspace
	 */
	async register(builderEndpoint: string): Promise<Workspace> {
		const url = '/builder/register';
		const config = this.http.httpConfig(builderEndpoint);
		const workspace = await this.http.post(url, {}, config);
		return workspace;
	}

	async connect(builderEndpoint: string, request: ConnectRequest): Promise<Workspace> {
		const url = '/builder/connect';
		const config = this.http.httpConfig(builderEndpoint);
		const workspace = await this.http.post(url, request, config);
		workspace.accessKey = request.accessKey;
		return workspace;
	}
	
	async refreshToken(builderEndpoint: string, request: RefreshTokenRequest): Promise<AccessToken> {
		const url = '/builder/refreshToken';
		const config = this.http.httpConfig(builderEndpoint);
		const token = await this.http.post(url, request, config);
		return token;
	}
	
	async getVersions(builderEndpoint: string): Promise<Versions> {
		const url = '/builder/getVersions';
		const config = this.http.httpConfig(builderEndpoint);
		const versions = await this.http.get(url, config);
		return versions;
	}

	/**
	 * Data Source
	 */
	async testDataSource(request: TestDataSourceRequest): Promise<TestDataSourceResult> {
		const url = '/test/testDataSource';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async deployDataSource(request: DeployDataSourceRequest): Promise<DeployResult> {
		const url = '/deploy/deployDataSource';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	/**
	 * Test
	 */
	async testService(request: TestServiceRequest, archive: Buffer): Promise<TestServiceResult> {
		const url = '/test/testService';
		const result = await this.http.postArchive(url, request, archive);
		return result;
	}
		
	/**
	 * Explorer
	 */
	async bindQuery(request: BindQueryRequest): Promise<BindQueryResult> {
		const url = '/bind/bindQuery';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async bindSql(request: BindSqlsRequest): Promise<BindSqlsResult> {
		const url = '/bind/bindSqls';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async bindCrudQuery(request: BindCrudQueryRequest): Promise<BindCrudQueryResult> {
		const url = '/bind/bindCrudQuery';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async bindCrudTable(request: BindCrudTableRequest): Promise<Table[]> {
		const url = '/bind/bindCrudTable';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async genQueryInputOutput(request: GenerateInputOutputRequest): Promise<GenerateInputOutputResult> {
		const url = '/gen/generateQueryInputOutput';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async genSqlInputOutput(request: GenerateInputOutputRequest): Promise<GenerateInputOutputResult> {
		const url = '/gen/generateSqlInputOutput';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async genCrudObject(request: GenerateObjectRequest): Promise<GenerateObjectResult> {
		const url = '/gen/generateCrudObject';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async getTableList(request: GetTableListRequest): Promise<string[]> {
		const url = '/sql/getTableList';
		const tables = await this.http.builderPost(url, request);
		return tables;
	}

	async genCruds(request: GenerateCrudRequest): Promise<GenerateCrudResult[]> {
		const url = '/gen/generateCruds';
		const result = await this.http.builderPost(url, request);
		return result;
	}

	async deployApplication(appUri: string, archive: Buffer): Promise<DeployResult> {
		const url = '/deploy/deployApplication';
		const result = await this.http.postArchive(url, {appUri}, archive, 60000);
		return result;
	}

	async deployModule(appUri: string, modName: string, archive: Buffer): Promise<DeployResult> {
		const url = '/deploy/deployModule';
		const result = await this.http.postArchive(url, {appUri, modName}, archive, 30000);
		return result;
	}

	async deployService(appUri: string, modName: string, serviceName: string, archive: Buffer): Promise<DeployServiceResult> {
		const url = '/deploy/deployService';
		const result = await this.http.postArchive(url, {appUri, modName, serviceName}, archive, 10000);
		return result;
	}

	async undeployApplication(appUri: string): Promise<DeployResult> {
		const url = '/deploy/undeployApplication';
		const result = await this.http.builderPost(url, {appUri});
		return result;
	}

	async undeployModule(appUri: string, modName: string): Promise<DeployResult> {
		const url = '/deploy/undeployModule';
		const result = await this.http.builderPost(url, {appUri, modName});
		return result;
	}

	async undeployService(appUri: string, modName: string, serviceName: string): Promise<DeployResult> {
		const url = '/deploy/undeployService';
		const result = await this.http.builderPost(url, {appUri, modName, serviceName});
		return result;
	}

}


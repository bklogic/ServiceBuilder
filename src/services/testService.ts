import { HttpService } from "../core/httpService";
import { TestDataSourceResult } from "../model/builder";


export class TestService {

    private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	async testDeployedDataSource(dataSourceUri: string): Promise<TestDataSourceResult> {
		const url = '/test/testDeployedDataSource';
        const request = {dataSourceUri};
		const result = await this.http.builderPost(url, request);
		return result;
	}
    
}

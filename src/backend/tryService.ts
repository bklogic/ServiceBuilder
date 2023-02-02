import {HttpService} from '../core/httpService';

export class TryService {

	private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	async requestWorkspace(userEmail: string, reqType: string, addToMailingList: string): Promise<void> {
		const url = '/try/requestWorkspace';
		return await this.http.tryPost(url, {userEmail, reqType, addToMailingList}, 15000);
	}

	async requestAccessToken(workspaceUrl: string, accessKey: string): Promise<string> {
		const url = '/try/requestAccessToken';
		return await this.http.tryPost(url, {workspaceUrl, accessKey});
	}

}

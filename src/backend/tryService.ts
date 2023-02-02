import {HttpService} from '../core/httpService';
import { AccessTokenRequest, WorkspaceRequest } from './tryModel';

export class TryService {

	private http: HttpService;

	constructor(http: HttpService) {
		this.http = http;
	}

	async requestWorkspace(userEmail: string, reqType: string, addToMailingList: string): Promise<boolean> {
		const url = '/try/requestWorkspace';
		const req: WorkspaceRequest = {userEmail, reqType, addToMailingList};
		return await this.http.tryPost(url, req, 15000);
	}

	async requestAccessToken(workspaceUrl: string, accessKey: string): Promise<string> {
		const url = '/try/requestAccessToken';
		const req: AccessTokenRequest = {workspaceUrl, accessKey};
		return await this.http.tryPost(url, req);
	}

}

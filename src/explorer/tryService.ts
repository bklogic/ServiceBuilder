import {HttpService} from '../core/httpService';
import { WorkspaceAuthentication } from '../model/workspace';
import {TryWorkspace, TrySession} from './tryModel';

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

	async requestTryWorkspace(email: string | null): Promise<TryWorkspace | null> {
		const url = '/try/requestWorkspace';
		return await this.http.tryPost(url, {email}, 15000);
	}

	async startTrySession(workspaceId: number, accessCode: string): Promise<TrySession> {
		const url = '/try/startSession';
		const data = {workspaceId, accessCode};
		const session = await this.http.tryPost(url, data);
		return session;
	}

}

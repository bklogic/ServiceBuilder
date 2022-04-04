import {TryHttpService} from '../core/tryHttpService';
import {TryWorkspace, TrySession} from './tryModel';

export class TryService {

	private http: TryHttpService;

	constructor(http: TryHttpService) {
		this.http = http;
	}

	async requestTryWorkspace(): Promise<TryWorkspace | null> {
		const url = '/try/requestWorkspace';
		const workspace = await this.http.get(url);
		return workspace;
	}

	async createTrySession(requestId: number, workspaceId: number): Promise<TrySession> {
		const url = '/try/createTrySession';
		// const session = await this.http.get(url);
		const session = {
			workspaceName: "quert01",
			workspaceUrl: "http://localhost:8080",
			accessToken: "abcdefg"
		} as TrySession;
		return session;
	}

}

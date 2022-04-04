
export interface TryWorkspace {
    workspaceId: number;
    requestId: number;
    workspaceName: string;
    workspaceUrl: string;
    accessToken: string;
}

export interface TrySession {
    sessionId: Number;
    workspaceName: string;
    workspaceUrl: string;
    accessToken: string;
    expireAt: Date;
}

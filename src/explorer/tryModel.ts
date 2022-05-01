
export interface TryWorkspace {
    workspaceId: number;
    requestId: number;
    workspaceName: string;
    workspaceUrl: string;
    accessCode: string;
    durationInMinutes: number;
}

export interface TryDataSource {
    dbType: string;
    host: string;
    port: string;
    dbName: string;
    username: string;
    password: string;
}

export interface TrySession {
    sessionId: Number;
    workspaceName: string;
    workspaceUrl: string;
    accessToken: string;
    expireAt: Date;
    dataSource: TryDataSource;
}


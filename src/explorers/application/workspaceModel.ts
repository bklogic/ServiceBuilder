export interface Workspace {
	name: string | undefined,
	url: string | undefined,
	accessToken: string | undefined,
	connectionIssue: string | null | undefined
}

export interface WorkspaceAuthentication {
    workspaceUrl: string,
    workspaceName: string,
    jwtAccessToken: string
}

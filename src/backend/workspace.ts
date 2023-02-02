export interface Versions {
	engine: string; 
	deployer: string; 
	builder: string
}

export interface Workspace {
	name: string | undefined,
	url: string | undefined,
	accessToken: string | undefined,
	versions: Versions | undefined,
	connectionIssue: string | null | undefined
}

export interface WorkspaceAuthentication {
    workspaceUrl: string,
    workspaceName: string,
    jwtAccessToken: string
}

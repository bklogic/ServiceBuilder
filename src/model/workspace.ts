export interface Versions {
	engine: string; 
	deployer: string; 
	builder: string
}

export interface Workspace {
	name: string | undefined,
	accessToken: string | undefined,
	versions: Versions | undefined,
	connectionIssue: string | null | undefined
}

export interface WorkspaceAuthentication {
    workspaceName: string,
    jwtAccessToken: string
}

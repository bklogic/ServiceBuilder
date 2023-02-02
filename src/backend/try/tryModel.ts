
export interface WorkspaceRequest {
    userEmail: string;
    reqType: string;
    addToMailingList: string;    
}

export interface AccessTokenRequest {
    workspaceUrl: string; 
    accessKey: string;
}
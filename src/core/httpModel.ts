
import * as https from 'https';

export interface HttpConfig {
    baseURL: string,
    timeout: number,
    headers: { [key: string]: string }, 
    httpsAgent: https.Agent  
}

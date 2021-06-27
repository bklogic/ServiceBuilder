import * as vscode from 'vscode';

const axios = require('axios');

export class HttpService {

    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async httpConfig(timeout?: number): Promise<HttpConfig> {
        // get connection data
        let [url, token] = await Promise.all([
            this.context.secrets.get('servicebuilder.url'),
            this.context.secrets.get('servicebuilder.token')    
        ]);
        url = (url) ? url : 'http://localhost:8080';

        // create and return config
        const config: HttpConfig = {
            baseURL: url,
            timeout: (timeout) ? timeout : 5000,
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Authorization': 'Bearer ' + token
            }              
        };  
        return config; 
    }

    async get(url: string, timeout?: number): Promise<any> {
        const config = await this.httpConfig(timeout);
        try {           
            const response = await axios.get(url, config);
            return response.data;
        } catch (error) {
            console.error('http get error: ', error.response.data.message, '\n',  'url: ', config.baseURL + url, '\n', error);
            error.message = error.message + ' | ' + error.response.data.message;
            throw error;
        }    
    }
    
    async post(url: string, data: any, timeout?: number): Promise<any> {
        const config = await this.httpConfig(timeout);
        try {
            const response = await axios.post(url, data, config);
            return response.data;
          } catch (error) {
            console.error('http post error: ', error.message || error.response.data.message, '\n',  'url: ', config.baseURL + url);
            console.error('Data: ');
            console.info(data);
            console.error(error);
            error.message = error.message + ' | ' + error.message || error.response.data.message;
            throw error;
          }    
    }

}

export interface HttpConfig {
    baseURL: string,
    timeout: number,
    headers: { [key: string]: string }      
}
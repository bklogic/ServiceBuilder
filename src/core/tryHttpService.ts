import * as vscode from 'vscode';
import * as https from 'https';
import {HttpConfig} from './httpModel';

const axios = require('axios');

export class TryHttpService {

    private context: vscode.ExtensionContext;
    private rejectUnauthorized = true;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        if (process.env.IGNORE_SSL) {
            this.rejectUnauthorized = false;
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
    }

    async httpConfig(timeout?: number): Promise<HttpConfig> {
        // get try service endpoint
        const url = vscode.workspace.getConfiguration('servicebuilder').get('tryServiceEndpoint') as string;
        const token = vscode.workspace.getConfiguration('servicebuilder').get('tryServiceApiToken') as string;

        // create and return config
        const config: HttpConfig = {
            baseURL: url,
            timeout: (timeout) ? timeout : 5000,
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Authorization': 'Bearer ' + token
            },
            httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: this.rejectUnauthorized })
        };  
        return config; 
    }


    async get(url: string, timeout?: number): Promise<any> {
        const config = await this.httpConfig(timeout);
        try {           
            const response = await axios.get(url, config);
            return response.data;
        } catch (error: any) {
            console.error('http get error: ', error.response?.data?.message, '\n',  'url: ', config.baseURL + url, '\n', error);
            error.message = error.message + ' | ' + error.response?.data?.message;
            throw error;
        }    
    }
    
    async post(url: string, data: any, timeout?: number): Promise<any> {
        const config = await this.httpConfig(timeout);
        try {
            const response = await axios.post(url, data, config);
            return response.data;
          } catch (error: any) {
            console.error('http post error: ', error.message || error.response.data.message, '\n',  'url: ', config.baseURL + url);
            console.info('Data: ');
            console.info(data);
            console.error(error);
            error.message = error.message + ' | ' + error.message || error.response.data.message;
            throw error;
          }    
    }

}

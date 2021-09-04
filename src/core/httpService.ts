import * as vscode from 'vscode';
import * as https from 'https';

const axios = require('axios');
const formData = require('form-data');

export class HttpService {

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
        } catch (error) {
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
          } catch (error) {
            console.error('http post error: ', error.message || error.response.data.message, '\n',  'url: ', config.baseURL + url);
            console.info('Data: ');
            console.info(data);
            console.error(error);
            error.message = error.message + ' | ' + error.message || error.response.data.message;
            throw error;
          }    
    }

    async postArchive(url: string, data: any, archive: Buffer, timeout?: number): Promise<any> {
        const config = await this.httpConfig(timeout);
        try {
            // construct form
            const form = new formData();
            for (const key in data) {
                form.append(key, data[key]);
            }
            form.append('archive', archive, 'archive.zip');
            config.headers = form.getHeaders();
            // post form
            const response = await axios.post(config.baseURL + url, form, {"headers": config.headers} );
            return response.data;
          } catch (error) {
            console.error('http post archive error: ', error.message || error.response.data.message, '\n',  'url: ', config.baseURL + url);
            console.info('Data: ');
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
    headers: { [key: string]: string }, 
    httpsAgent: https.Agent  
}
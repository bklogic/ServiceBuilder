import * as vscode from 'vscode';
import * as https from 'https';
import * as util from './util';
import {HttpConfig} from './httpModel';
import { Workspace } from '../backend/builder/builderModel';

const axios = require('axios');
const formData = require('form-data');

export class HttpService {

    private context: vscode.ExtensionContext;
    private rejectUnauthorized = true;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async get(url: string, config: HttpConfig): Promise<any> {
        try {           
            const response = await axios.get(url, config);
            return response.data;
        } catch (error: any) {
            console.error('http GET error for url: ', config.baseURL + url);
            this.handleError(error);
        }    
    }
    
    async post(url: string, data: any, config: HttpConfig): Promise<any> {
        try {
            const response = await axios.post(url, data, config);
            return response.data;
        } catch (error: any) {
            console.error('http POST error for url: ', config.baseURL + url);
            console.info('Data: ', data);
            this.handleError(error);
        }    
    }

    async postArchive(url: string, data: any, archive: Buffer, timeout?: number): Promise<any> {
        const config = await this.builderHttpConfig(timeout);
        try {
            // construct form
            const form = new formData();
            for (const key in data) {
                form.append(key, data[key]);
            }
            form.append('archive', archive, 'archive.zip');
            const headers = form.getHeaders();
            headers['Authorization'] = config.headers['Authorization'];
            config.headers = headers;
            // post form
            const response = await axios.post(config.baseURL + url, form, {"headers": config.headers} );
            return response.data;
          } catch (error: any) {
            console.error('http archive POST error for url: ', config.baseURL + url);
            console.info('Data: ', data);
            this.handleError(error);
          }    
    }

    async builderGet(url: string, timeout?: number): Promise<any> {
        const config = await this.builderHttpConfig(timeout);
        return this.get(url, config);
    }

    async builderPost(url: string, data: any, timeout?: number): Promise<any> {
        const config = await this.builderHttpConfig(timeout);
        return this.post(url, data, config);
    }

    async builderHttpConfig(timeout?: number): Promise<HttpConfig> {
        // get connection data
        const workspace = await util.readWorkspace(this.context) as Workspace;
        if (!workspace?.url) {
            throw new Error("No workspace connection.");
        }

        // create and return config
        const config: HttpConfig = {
            baseURL: workspace.url,
            timeout: (timeout) ? timeout : 5000,
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: this.rejectUnauthorized })
        };  

        // token
        if (workspace.token?.token) {
            config.headers['Authorization'] = 'Bearer ' + workspace.token.token;
        }

        return config; 
    }

    httpConfig(url: string, timeout?: number): HttpConfig {
        // create and return config
        const config: HttpConfig = {
            baseURL: url,
            timeout: (timeout) ? timeout : 5000,
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json'
            },
            httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: this.rejectUnauthorized })
        };  
        return config; 
    }


    handleError(error: any): void {
        if (!error.response) {
            error.message = 'Cannot connect to server.';
            throw error;    
        } else {
            switch(error.response.status) {
                case 404:
                    error.message = "404 backend API not found";
                    break;
                case 403:
                    error.message = "403 backend API not authorized";
                    break;
                case 500:
                    error.message = "500 backend server issue";
                    break;
                default:
                    error.message = error.response?.data?.message;                    
            }
            throw error;
        }
    }

}
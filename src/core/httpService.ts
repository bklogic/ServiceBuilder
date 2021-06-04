const axios = require('axios');

export class HttpService {
    private config: HttpConfig;

    constructor(baseURL?: string, timeout?: number) {
        this.config = {
            baseURL: (baseURL) ? baseURL : 'http://localhost:8080/',
            timeout: (timeout) ? timeout : 5000,
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json'
            }              
        };
    }

    async get(url: string): Promise<any> {
        try {
            const response = await axios.get(url, this.config);
            return response.data;
          } catch (error) {
            console.error(error);
            throw error;
          }    
    }
    
    async post(url: string, data: any): Promise<any> {
        try {
            const response = await axios.post(url, data, this.config);
            return response.data;
          } catch (error) {
            console.error(error);
          }    
    }

}

export interface HttpConfig {
    baseURL: string,
    timeout: number,
    headers: { [key: string]: string }      
}
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const https = require("https");
const util = require("./util");
const axios = require('axios');
const formData = require('form-data');
class HttpService {
    constructor(context) {
        this.rejectUnauthorized = true;
        this.context = context;
    }
    get(url, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios.get(url, config);
                return response.data;
            }
            catch (error) {
                console.error('http GET error for url: ', config.baseURL + url);
                this.handleError(error);
            }
        });
    }
    post(url, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios.post(url, data, config);
                return response.data;
            }
            catch (error) {
                console.error('http POST error for url: ', config.baseURL + url);
                console.info('Data: ', data);
                this.handleError(error);
            }
        });
    }
    postArchive(url, data, archive, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.builderHttpConfig(timeout);
            try {
                // construct form
                const form = new formData();
                for (const key in data) {
                    form.append(key, data[key]);
                }
                form.append('archive', archive, 'archive.zip');
                // const headers = form.getHeaders();
                // headers['Authorization'] = config.headers['Authorization'];
                config.headers['Content-Type'] = form.getHeaders()['content-type'];
                // post form
                const response = yield axios.post(config.baseURL + url, form, { "headers": config.headers });
                return response.data;
            }
            catch (error) {
                console.error('http archive POST error for url: ', config.baseURL + url);
                console.info('Data: ', data);
                this.handleError(error);
            }
        });
    }
    builderGet(url, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.builderHttpConfig(timeout);
            return this.get(url, config);
        });
    }
    builderPost(url, data, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.builderHttpConfig(timeout);
            const result = this.post(url, data, config);
            return result;
        });
    }
    builderHttpConfig(timeout) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // get connection data
            const workspace = yield util.readWorkspace(this.context);
            if (!(workspace === null || workspace === void 0 ? void 0 : workspace.url)) {
                throw new Error("No workspace connection.");
            }
            // create and return config
            const config = {
                baseURL: workspace.url,
                timeout: (timeout) ? timeout : 5000,
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'Content-Type': 'application/json',
                },
                httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: this.rejectUnauthorized })
            };
            // token
            if ((_a = workspace.token) === null || _a === void 0 ? void 0 : _a.token) {
                config.headers['Authorization'] = 'Bearer ' + workspace.token.token;
            }
            return config;
        });
    }
    httpConfig(url, timeout) {
        // create and return config
        const config = {
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
    handleError(error) {
        var _a, _b;
        if (!error.response) {
            error.message = 'Cannot connect to server.';
            throw error;
        }
        else {
            switch (error.response.status) {
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
                    error.message = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message;
            }
            throw error;
        }
    }
}
exports.HttpService = HttpService;
//# sourceMappingURL=httpService.js.map
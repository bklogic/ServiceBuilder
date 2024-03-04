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
exports.DeployService = void 0;
const util = require("../../core/util");
class DeployService {
    constructor(http) {
        this.http = http;
    }
    getDataSources() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/getDataSources';
            const apps = yield this.http.builderGet(url);
            return apps;
        });
    }
    getDataSource(dataSourceUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/getDataSource/' + util.modifiedUri(dataSourceUri);
            const apps = yield this.http.builderGet(url);
            return apps;
        });
    }
    testDeployedDataSource(dataSourceUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `/test/testDeployedDataSource/${util.modifiedUri(dataSourceUri)}`;
            const result = yield this.http.builderPost(url, {});
            return result;
        });
    }
    getApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/getApplications';
            const apps = yield this.http.builderGet(url);
            return apps;
        });
    }
    getApplicationAggregate(appUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/getApplicationAggregate/' + util.modifiedUri(appUri);
            const app = yield this.http.builderGet(url);
            return app;
        });
    }
    getService(serviceUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/getService/' + util.modifiedUri(serviceUri);
            const service = yield this.http.builderGet(url);
            return service;
        });
    }
    getTests(serviceUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/getTests/' + util.modifiedUri(serviceUri);
            const tests = yield this.http.builderGet(url);
            return tests;
        });
    }
    getDataSourceForApplication(appUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/getDataSourceForApplication/' + util.modifiedUri(appUri);
            ;
            const dataSource = yield this.http.builderGet(url);
            return dataSource;
        });
    }
    cleanDataSource(dataSourceUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/cleanDataSource/' + util.modifiedUri(dataSourceUri);
            this.http.builderPost(url, {});
        });
    }
    cleanApplication(appUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/cleanApplication/' + util.modifiedUri(appUri);
            this.http.builderPost(url, {});
        });
    }
    cleanWorkspace() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/inspect/cleanWorkspace';
            const result = yield this.http.builderPost(url, {});
            return result;
        });
    }
}
exports.DeployService = DeployService;
//# sourceMappingURL=deployService.js.map
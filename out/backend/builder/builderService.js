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
exports.BuilderService = void 0;
class BuilderService {
    constructor(http) {
        this.http = http;
    }
    /**
     * workspace
     */
    register(builderEndpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/builder/register';
            const config = this.http.httpConfig(builderEndpoint);
            const workspace = yield this.http.post(url, {}, config);
            return workspace;
        });
    }
    connect(builderEndpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/builder/connect';
            const config = this.http.httpConfig(builderEndpoint);
            const workspace = yield this.http.post(url, request, config);
            workspace.accessKey = request.accessKey;
            return workspace;
        });
    }
    refreshToken(builderEndpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/builder/refreshToken';
            const config = this.http.httpConfig(builderEndpoint);
            const token = yield this.http.post(url, request, config);
            return token;
        });
    }
    getVersions(builderEndpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/builder/getVersions';
            const config = this.http.httpConfig(builderEndpoint);
            const versions = yield this.http.get(url, config);
            return versions;
        });
    }
    /**
     * Data Source
     */
    testDataSource(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/test/testDataSource';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    deployDataSource(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/deploy/deployDataSource';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    /**
     * Test
     */
    testService(request, archive) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/test/testService';
            const result = yield this.http.postArchive(url, request, archive);
            return result;
        });
    }
    /**
     * Explorer
     */
    bindQuery(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/bind/bindQuery';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    bindSql(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/bind/bindSqls';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    bindCrudQuery(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/bind/bindCrudQuery';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    bindCrudTable(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/bind/bindCrudTable';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    genQueryInputOutput(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/gen/generateQueryInputOutput';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    genSqlInputOutput(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/gen/generateSqlInputOutput';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    genCrudObject(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/gen/generateCrudObject';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    getTableList(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/sql/getTableList';
            const tables = yield this.http.builderPost(url, request);
            return tables;
        });
    }
    genCruds(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/gen/generateCruds';
            const result = yield this.http.builderPost(url, request);
            return result;
        });
    }
    deployApplication(appUri, archive) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/deploy/deployApplication';
            const result = yield this.http.postArchive(url, { appUri }, archive, 60000);
            return result;
        });
    }
    deployModule(appUri, modName, archive) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/deploy/deployModule';
            const result = yield this.http.postArchive(url, { appUri, modName }, archive, 30000);
            return result;
        });
    }
    deployService(appUri, modName, serviceName, archive) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/deploy/deployService';
            const result = yield this.http.postArchive(url, { appUri, modName, serviceName }, archive, 10000);
            return result;
        });
    }
    undeployApplication(appUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/deploy/undeployApplication';
            const result = yield this.http.builderPost(url, { appUri });
            return result;
        });
    }
    undeployModule(appUri, modName) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/deploy/undeployModule';
            const result = yield this.http.builderPost(url, { appUri, modName });
            return result;
        });
    }
    undeployService(appUri, modName, serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = '/deploy/undeployService';
            const result = yield this.http.builderPost(url, { appUri, modName, serviceName });
            return result;
        });
    }
}
exports.BuilderService = BuilderService;
//# sourceMappingURL=builderService.js.map
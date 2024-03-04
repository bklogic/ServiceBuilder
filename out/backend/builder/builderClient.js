"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderClient = void 0;
const builderService_1 = require("./builderService");
const deployService_1 = require("./deployService");
class BuilderClient {
    constructor(httpService) {
        this.builderService = new builderService_1.BuilderService(httpService);
        this.deployService = new deployService_1.DeployService(httpService);
    }
}
exports.BuilderClient = BuilderClient;
//# sourceMappingURL=builderClient.js.map
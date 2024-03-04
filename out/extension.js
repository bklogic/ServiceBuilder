"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const util = require("./core/util");
const applicationExplorer_1 = require("./explorers/application/applicationExplorer");
const testEditor_1 = require("./editors/testEditor");
const deploymentExplorer_1 = require("./explorers/deployment/deploymentExplorer");
const httpService_1 = require("./core/httpService");
const dataSourceExplorer_1 = require("./explorers/datasource/dataSourceExplorer");
const builderClient_1 = require("./backend/builder/builderClient");
// this method is called when your extension is activated
function activate(context) {
    // initiate util
    util.createGetWorkspaceUtil(context);
    // construct client services
    const httpService = new httpService_1.HttpService(context);
    const builderClient = new builderClient_1.BuilderClient(httpService);
    // explorer
    new applicationExplorer_1.ApplicationExplorer(context, builderClient);
    new deploymentExplorer_1.DeploymentExplorer(context, builderClient);
    new dataSourceExplorer_1.DataSourceExplorer(context, builderClient);
    // editors
    new testEditor_1.TestEditor(context, builderClient);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testFile = exports.tablesFile = exports.crudServiceFile = exports.sqlServiceFile = exports.queryServiceFile = exports.moduleFile = exports.applicationFile = void 0;
const util = require("../../core/util");
function applicationFile(applicationName, dbType) {
    const content = {
        "name": applicationName,
        "description": "application. Specify data source and optionally schema name.",
        "dbType": dbType,
        "dataSource": "",
        "schema": ""
    };
    return util.toUint8Array(content);
}
exports.applicationFile = applicationFile;
function moduleFile(moduleName) {
    const content = {
        "name": moduleName,
        "description": "module. Don't modify this file!"
    };
    return util.toUint8Array(content);
}
exports.moduleFile = moduleFile;
function queryServiceFile(serviceName) {
    const content = {
        "name": serviceName,
        "type": "query",
        "description": "query service. Don't modify this file except the dynamic field!",
        "input": "./input.json",
        "output": "./output.json",
        "query": "./query.sql",
        "dynamic": false,
        "inputBindings": "./input-bindings.json",
        "outputBindings": "./output-bindings.json"
    };
    return util.toUint8Array(content);
}
exports.queryServiceFile = queryServiceFile;
function sqlServiceFile(serviceName) {
    const content = {
        "name": serviceName,
        "type": "sql",
        "description": "sql service. Don't modify this file!",
        "input": "./input.json",
        "output": "./output.json",
        "sqls": "./sqls.sql",
        "variableLength": 0,
        "query": "./query.sql",
        "inputBindings": "./input-bindings.json",
        "outputBindings": "./output-bindings.json"
    };
    return util.toUint8Array(content);
}
exports.sqlServiceFile = sqlServiceFile;
function crudServiceFile(serviceName) {
    const content = {
        "name": serviceName,
        "type": "crud",
        "description": "crud service. Don't modify this file!",
        "object": "./object.json",
        "read": {
            "input": "./read/input.json",
            "query": "./read/query.sql",
            "inputBinding": "./read/input-binding.json",
            "outputBinding": "./read/output-binding.json"
        },
        "write": {
            "tables": "./write/tables.json"
        }
    };
    return util.toUint8Array(content);
}
exports.crudServiceFile = crudServiceFile;
function tablesFile() {
    const content = {};
    return util.toUint8Array(content);
}
exports.tablesFile = tablesFile;
function testFile(input, testName, testType) {
    let content;
    switch (testType) {
        case 'read':
        case 'create':
        case 'update':
        case 'delete':
        case 'save':
            content = {
                name: testName,
                input: input,
                operation: testType,
                comments: 'Modify the example test name and input.'
            };
            break;
        default:
            content = {
                name: testName,
                input: input,
                comments: 'Modify the example test name and input.'
            };
    }
    return util.toUint8Array(content);
}
exports.testFile = testFile;
//# sourceMappingURL=contentService.js.map
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
exports.DataSourceDataService = void 0;
const vscode = require("vscode");
const util = require("../../core/util");
class DataSourceDataService {
    getDataSourceItems() {
        return __awaiter(this, void 0, void 0, function* () {
            // get workfolder
            const workfolder = util.getWorkFolder();
            if (!workfolder) {
                return [];
            }
            // check data source folder  
            const dsFolder = util.localDsUri();
            const exists = yield util.fileExists(dsFolder);
            if (!exists) {
                yield vscode.workspace.fs.createDirectory(dsFolder);
            }
            // get applications
            const children = yield vscode.workspace.fs.readDirectory(dsFolder);
            const items = yield Promise.all(children.filter(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                return (fileType === vscode.FileType.File);
            })).map(([name, fileType]) => __awaiter(this, void 0, void 0, function* () {
                return {
                    uri: vscode.Uri.joinPath(dsFolder, name),
                    name: name.replace('.json', ''),
                    fileType: fileType,
                    fileUri: vscode.Uri.joinPath(dsFolder, name),
                    parent: null
                };
            })));
            // return
            return items;
        });
    }
    isDataSourceFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
}
exports.DataSourceDataService = DataSourceDataService;
//# sourceMappingURL=dataSourceDataService.js.map
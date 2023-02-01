import * as vscode from 'vscode';
import * as util from '../../core/util';
import {DataSourceItem} from './dataSourceDataModel';

export class DataSourceDataService {

    async getDataSourceItems(): Promise<DataSourceItem[]> {
        // get workfolder
        const workfolder = util.getWorkFolder();
        if (!workfolder) {
            return [];
        }

        // check data source folder  
        const dsFolder = vscode.Uri.joinPath(workfolder.uri, '.datasource');
        const exists = await util.fileExists(dsFolder);
        if (!exists) {
            await vscode.workspace.fs.createDirectory(dsFolder);
        }

        // get applications
        const children = await vscode.workspace.fs.readDirectory(dsFolder);

        const items = await Promise.all( 
            children.filter(async ([name, fileType]) => {
                return (fileType === vscode.FileType.File);
            }).map(async ([name, fileType]) => {
                return {
                    uri: vscode.Uri.joinPath(dsFolder, name),
                    name: name.replace('.json', ''),
                    fileType: fileType,
                    fileUri: vscode.Uri.joinPath(dsFolder, name),
                    parent: null
                } as DataSourceItem;
            })
        );

        // return
        return items;
    }

    async isDataSourceFile(file: vscode.Uri): Promise<boolean> {
        return true;
    }

}
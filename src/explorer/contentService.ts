
import { ServiceType } from "./applicationService";
import * as bs from "./builderService"


export function applicationFile(applicationName: string, dbType: string): Uint8Array {		
	const content = {
		"name": applicationName,
		"description": "application. Don't modify this file!",
		"dbType": dbType,
		"versions": bs.getBuilderVersions()
	}
	return toUint8Array(content);
}

export function dataSourceFile(dbType: string): Uint8Array {		
	const content = {
		"dbType": dbType,
		"url": "mysql://host:port/database",
		"username": "",
		"password": "",
		"comments": "Complete url, username and password. Save the file to test database connection. Password will be encrypted on the server."
	}
	return toUint8Array(content);
}

export function moduleFile(moduleName: string): Uint8Array {		
	const content = {
		"name": moduleName,
		"description": "module. Don't modify this file!"
	}
	return toUint8Array(content);
}

export function queryServiceFile(serviceName: string): Uint8Array {		
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
	}
	return toUint8Array(content);
}

export function sqlServiceFile(serviceName: string): Uint8Array {		
	const content = {
		"name": serviceName,
		"type": "sql",
		"description": "sql service. Don't modify this file!",
		"input": "./input.json",
		"output": "./output.json",
		"sqls": "./sqls.sql",
		"query": "./query.sql",
		"inputBindings": "./input-bindings.json",
		"outputBindings": "./output-bindings.json"
	}
	return toUint8Array(content);
}

export function crudServiceFile(serviceName: string): Uint8Array {		
	const content = {
		"name": serviceName,
		"type": "crud",  
		"description": "crud service. Don't modify this file!",
		"object": "./object.json",  
		"read": {
			"query": "./read/query.sql",
			"inputBinding": "./read/input-binding.json",  
			"outputBinding": "./read/output-binding.json"
		},
		"write": {
			"tables": "./write/tables.json"
		}
	} 
	return toUint8Array(content);
}

export function tablesFile(): Uint8Array {		
	const content = {
	}
	return toUint8Array(content);
}

function toUint8Array(content: any): Uint8Array {
	return Buffer.from(JSON.stringify(content, null, 4), 'utf8');
}

export interface ServiceDefintion {
	name: string;
	type: string;
	description: string;
}

export interface QueryServiceDefintion extends ServiceDefintion {

}


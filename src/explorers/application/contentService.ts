
import * as util from '../../core/util';

export function applicationFile(applicationName: string, dbType: string): Uint8Array {		
	const content = {
		"name": applicationName,
		"description": "application. Specify data source and optionally schema name.",
		"dbType": dbType,
		"dataSource": "",
		"schema": ""
	};
	return util.toUint8Array(content);
}


export function moduleFile(moduleName: string): Uint8Array {		
	const content = {
		"name": moduleName,
		"description": "module. Don't modify this file!"
	};
	return util.toUint8Array(content);
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
	};
	return util.toUint8Array(content);
}

export function sqlServiceFile(serviceName: string): Uint8Array {		
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

export function crudServiceFile(serviceName: string): Uint8Array {		
	const content = {
		"name": serviceName,
		"type": "crud",  
		"description": "crud/repository service. Don't modify this file!",
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
	} ;
	return util.toUint8Array(content);
}

export function tablesFile(): Uint8Array {		
	const content = {
	};
	return util.toUint8Array(content);
}

export function testFile(input: any, testName: string, testType: string | undefined): Uint8Array {
	let content;
	switch (testType) {
		case 'read': case 'create': case 'update': case 'delete': case 'save':
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

export interface ServiceDefintion {
	name: string;
	type: string;
	description: string;
}

export interface QueryServiceDefintion extends ServiceDefintion {

}

export interface TestInput {
	name: string;
	input: any;
	operation: string
}

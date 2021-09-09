
import * as util from '../core/util';

export function applicationFile(applicationName: string, dbType: string, versions: any): Uint8Array {		
	const content = {
		"name": applicationName,
		"description": "application. Don't modify this file!",
		"dbType": dbType,
		"versions": versions
	};
	return util.toUint8Array(content);
}

export function dataSourceFile(dbType: string): Uint8Array {		
	let url;
	switch(dbType) {
		case 'mysql':
			url = "mysql://{host}:{port}/{database}";
			break;
		default:
			url = "jdbcUrl for " + dbType + " database";
	}
	const content = {
		"dbType": dbType,
		"url": url,
		"username": "",
		"password": "",
		"comments": "Complete url, username and password. Test data source using the TEST editor button."
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
	} ;
	return util.toUint8Array(content);
}

export function tablesFile(): Uint8Array {		
	const content = {
	};
	return util.toUint8Array(content);
}

export function testFile(input: any, serviceType: string, testType: string | undefined): Uint8Array {
	let content;
	switch (testType) {
		case 'read':
			content = {
				name: 'ReadCustomerById',
				input: input,
				operation: 'read',
				comments: 'Modify the example test name and input'
			};	
			break;
		case 'write':
			content = {
				name: 'CreateCustomer',
				input: input,
				operation: 'create',
				comments: 'Modify the example test name, input and operation. Valid operations: create, delete, update, merge, save.'
			};	
			break;
		default:
			content = {
				name: 'QueryCustomerById',
				input: input,
				comments: 'Modify the example test name and input'
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

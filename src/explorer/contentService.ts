
import { ServiceType } from "./applicationService";
import * as bs from "./builderService"


export function applicationFile(applicationName: string): Uint8Array {		
	const content = {
		applicationName: applicationName,
		versions: bs.getBuilderVersions()
	}
	return Buffer.from(JSON.stringify(content), 'utf8');
}

export function moduleFile(moduleName: string): Uint8Array {		
	const content = {
		moduleName: moduleName
	}
	return Buffer.from(JSON.stringify(content), 'utf8');
}

export function queryServiceFile(serviceName: string): Uint8Array {		
	const content = {
		serviceName: serviceName,
		type: 'query'
	}
	return Buffer.from(JSON.stringify(content), 'utf8');
}

export function sqlServiceFile(serviceName: string): Uint8Array {		
	const content = {
		serviceName: serviceName,
		type: 'sql'
	}
	return Buffer.from(JSON.stringify(content), 'utf8');
}

export function crudServiceFile(serviceName: string): Uint8Array {		
	const content = {
		serviceName: serviceName,
		type: 'crud'
	}
	return Buffer.from(JSON.stringify(content), 'utf8');
}

export function tablesFile(): Uint8Array {		
	const content = {
	}
	return Buffer.from(JSON.stringify(content), 'utf8');
}


export interface ServiceDefintion {
	name: string;
	type: string;
	description: string;
}

export interface QueryServiceDefintion extends ServiceDefintion {

}

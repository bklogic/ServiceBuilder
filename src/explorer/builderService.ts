
export function getBuilderVersions(): Versions {
    return {
        specification: '0.0.0', engine: '0.0.0', builder: '0.0.0'
    };
}


export interface Versions {
	specification: string; 
	engine: string; 
	builder: string
}


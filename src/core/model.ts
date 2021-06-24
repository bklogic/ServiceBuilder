export interface ServiceSpec {
    uri: string;
    spec: QueryServiceSpecification | SqlServiceSpecification | CrudServiceSpecification;
}

export interface Module {
	uri: string;
	name: string; 
	description: string;
}

export interface Application {
	uri: string;
	name: string; 
	description: string;
    dbType: string;
}

export interface ModuleAggregate {
    module: Module;
    services: ServiceSpec[];
}

export interface ApplicationAggregate {
    application: Application;
    modules: ModuleAggregate[];
}

export interface InputBinding {
    parameter: string;
    field: string;
}

export interface OutputBinding {
    column: string;
    field: string;
}

export interface QueryServiceSpecification {
    input: any;
    output: any;
    query: string[];
    dynamic: boolean;
    inputBindings: InputBinding[];
    outputBindings: OutputBinding[];
}

export interface SqlServiceSpecification {
    input: any;
    output: any;
    sqls: string[];
    query: string[];
    inputBindings: InputBinding[];
    outputBindings: OutputBinding[];
}

export interface Column {
	// column name
	column: string;
	// field path
	field: string;
	// column position
	position: number;
	// column data type
	dataType: string;
	// insert default
	insertValue: string;
	//update default
	updateValue: string;
	// whether a key column
	key: false;
	// whether auto generate column
	autoGenerate: false;
	// whether a not null column
	notNull: false;
	// whether version control column. Must be an integer or timestamp column
	version: false;
	// whether soft delete column. Must be a string type column and will be updated to Y when delete
	softDelete: false;
	// whether eligible to be a key column
	keyEligible: false;
	// whether eligible to be a verison column
	versionEligible: false;
	// whether eligible to be a soft-delete column
	softDeleteEligible: false;    
}

export interface Table {
	//table name, maybe qualified with schema
	table: string;	
	//table alias in Read query, needed for SQL construction
	alias: string;	
	//object path mapped to the table
	object: string;	
	//field path of operation indicator for the table
	operationIndicator?: string;	
	//column specifications
	columns: Column[];	
	// whether the ROOT table of the aggregate
	rootTable: boolean;
}

export interface Read {
	query: string[];
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
}

export interface Write {
	tables: Table[];
	rootTableAlias: string;
}

export interface CrudServiceSpecification {
    object: any;
    read: Read;
    write: Write;
}
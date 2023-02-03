
export interface Versions {
	engine: string; 
	deployer: string; 
	builder: string
}

// data model
export interface DataSource {
    dbType: string;
    host: string;
    port: number;
    database: string
    username: string;
    password: string;
}

export interface DeployDataSourceRequest {
	uri: string;
	dbType: string;
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
}

export interface TestDataSourceRequest {
	dbType: string;
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
}

export interface TestDataSourceResult {
	succeed: boolean;
	message: string;
}

export interface TestServiceRequest {
	applicationUri: string;
	moduleName: string;
	serviceName: string;
	input: string;  // json string
	operation: string | null;   
	withCommit: string | null;  // boolean string
}

export interface TestServiceResult {
	succeed: boolean;
	output: any;
	exception: TestException
}

export interface TestException {
	name: string;
	type: string;
	message: string;
}

export interface BindQueryRequest {
	applicationUri: string;
	queryString: string [];
	input: any;
	output: any
}

export interface BindQueryResult {
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
}

export interface InputBinding {
	parameter: string;
	field: string;
}

export interface OutputBinding {
	column: string;
	field: string;
}

export interface BindSqlsRequest {
	applicationUri: string;
	sqlsString: string [];
	queryString: string [];
	input: any;
	output: any
}

export interface BindSqlsResult {
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
}

export interface BindCrudQueryRequest {
	applicationUri: string;
	queryString: string [];
	object: any,
	input: any
}

export interface BindCrudQueryResult {
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
}

export interface BindCrudTableRequest {
	applicationUri: string;
	crudQueryString: string[];
	outputBindings: OutputBinding[];
}

export interface Table {
	table: string;
	alias: string;
	object: string;
	columns: Column[];
	rootTable: boolean;
	mainTable: boolean;
	operationIndicator: string;
}

export interface Column {
	position: number;
	column: string;
	field: string;
	key: boolean;
	autoGenerate: boolean;
	inputField: string;
	insertValue: string;
	updateValue: string;
	version: boolean;
	softDelete: boolean;
	dataType: string;
	notNull: boolean;
	keyEligible: boolean;
	versionEligible: boolean;
	softDeleteEligible: boolean;
}

export interface GenerateInputOutputRequest {
	applicationUri: string;
	queryString: string [];
	sqlsString: string [];
	nameConvention: NameConvention;
}

export interface GenerateInputOutputResult {
	input: any;
	output: any;
}

export interface GenerateObjectRequest {
	applicationUri: string;
	queryString: string [];
	nameConvention: NameConvention;
}

export interface GenerateObjectResult {
	object: any;
	input: any;
}

export interface GetTableListRequest {
	applicationUri: string;
}

export interface GenerateCrudRequest {
	applicationUri: string;
	tableNames: string[];
	options: GenerateCrudOptions;
}

export interface GenerateCrudResult {
	object: any;
	input: any;
	crudQuery: string[];
	inputBindings: InputBinding[];
	outputBindings: OutputBinding[];
	tables: Table[];
	serviceName: string;
}

export interface GenerateCrudOptions {
	whereClause: WhereClauseType;
	fieldNameConvention: NameConvention;
}

export enum NameConvention {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	NONE = 'NONE',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	CAMEL = 'CAMEL'
}

export enum WhereClauseType {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	keys = 'keys',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	all = 'all'
}

export interface DeployRequest {
	deployType: string;
	applicationUri: string;
	moduleName: string;
	serviceName: string;
}

export interface DeployResult {
	succeed: boolean
}

export interface DeployServiceResult {
	valid: boolean,
	reason: string
}

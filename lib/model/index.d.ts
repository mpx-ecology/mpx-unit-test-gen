import * as ts from 'typescript';
export interface ParsedClass {
    name: ts.__String | string;
    methods: ParsedMethod[];
    isDefaultExport: boolean;
}
export interface ParsedMethod {
    methodName: ts.__String | string;
    isAsync: boolean;
    params: ts.__String[];
}
export interface ParsedFunction {
    name: ts.__String | string;
    isAsync: boolean;
    isDefaultExport: boolean;
}
export interface ParsedPojo {
    name: ts.__String | string;
    methods: ParsedMethod[];
    isDefaultExport: boolean;
}
export declare enum DataType {
    METHOD = "methods",
    DATA = "datas",
    COMPUTED = "computeds",
    PROPERTY = "properties",
    WATCH = "watchs"
}
export interface ParsedClassDependency {
    name: string;
    type?: string;
    token?: string;
}
export interface ParsedImport {
    path: string;
    names: string[];
    importText: string;
}
export interface ParsedSourceFile {
    datas: Array<string>;
    properties: Array<string>;
    computeds: Array<string>;
    watchs: Array<string>;
    methods: Array<string>;
    usingComponents: Object;
    imports: ParsedImport[];
    allKeys: Object;
    exportFunctions: ParsedFunction[];
    exportPojos: ParsedPojo[];
    exportClass?: ParsedClass;
    classes: ParsedClass[];
    functions: ParsedFunction[];
    pojos: ParsedPojo[];
}
export interface ClassOptions {
    declarations: {
        name: string;
        type: string;
    }[];
    initializers: {
        name?: string;
        value: string;
    }[];
    dependencies: {
        name: string;
        token: string;
    }[];
    imports: ParsedImport[];
}
export interface TemplateOptions {
    instanceVariableName: string;
    templateType: string;
    templatePath: string;
}
export interface DependencyHandlerOptions {
    variableName: string;
    injectionToken?: string;
    sourceCode: string;
    allImports: ParsedImport[];
    quoteSymbol: string;
}
export interface DependencyHandler {
    run(result: ClassOptions, dep: ParsedClassDependency, options: DependencyHandlerOptions): void;
    test(dep: ParsedClassDependency): boolean;
}

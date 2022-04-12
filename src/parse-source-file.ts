import * as ts from 'typescript';
// @ts-ignore
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ParsedSourceFile, ParsedClass, ParsedPojo, DataType } from './model';
import { genKeyName } from './utils/gen-name';

export function parseSourceFile(file: any): ParsedSourceFile {
    const result: ParsedSourceFile = {
        datas: [],
        properties: [],
        computeds: [],
        watchs: [],
        methods: [],
        imports: [],
        allKeys: {},
        usingComponents: {},
        exportFunctions: [],
        exportPojos: [],
        exportClass: undefined,
        classes: [],
        functions: [],
        pojos: [],
    };
    traverse(file, {
        enter(path: any) {
            if (path.node.type === 'CallExpression') {
                if (path.node.callee.name === 'createComponent' || path.node.callee.name === 'createPage') {
                    handleCallExpression(path.node)
                }
            }
        },
        exit(path: any) {
            if (path.node.type === 'ThisExpression') {
                const scopeNode = path?.scope?.path?.node
                if (scopeNode?.type === 'ObjectMethod') {
                    const pathKeyName = genKeyName(scopeNode.key.name, scopeNode.key.start, scopeNode.key.end)
                    const depNode = path.context.parentPath.node.property
                    const depNodeKeyName = genKeyName(depNode.name, depNode.start, depNode.end)
                    // @ts-ignore
                    if (result.allKeys[pathKeyName]) {
                        // 获取当前依赖的data的所属类型
                        // 先判断当前的this.xxx 是调用方法还是属性
                        // 方法明和属性名能重名吗？
                        let type = getThisExpressNodeDepNodeType(path, depNode.name)
                        // @ts-ignore
                        result.allKeys[pathKeyName].deps[depNode.name] = {
                            name: depNodeKeyName,
                            type
                        }
                    }
                }
            }
        }
    });
    function handleCallExpression(node: t.CallExpression) {
        const args = node.arguments
        if (args.length === 1 && args[0].type === 'ObjectExpression') {
            const ObjectExpression = args[0]
            const properties  = ObjectExpression.properties as Array<t.ObjectProperty>
            properties.forEach((item) => {
                if ((item.key as t.Identifier).name === 'data') {
                    handlePropertyData(item, 'datas')
                }
                if ((item.key as t.Identifier).name === 'computed') {
                    handlePropertyData(item, 'computeds')
                }
                if ((item.key as t.Identifier).name === 'properties') {
                    handlePropertyData(item, 'properties')
                }
                if ((item.key as t.Identifier).name === 'watch') {
                    handlePropertyData(item, 'watchs')
                }
                if ((item.key as t.Identifier).name === 'methods') {
                    handlePropertyData(item, 'methods')
                }
            })
        }
    }

    function getThisExpressNodeDepNodeType (path:any, name: string) {
        let type: DataType | null = null
        if (path.parentPath.parent.type === 'CallExpression') {
            type = DataType.METHOD
        } else {
            if (result.datas.map(item => item.split('_')[0]).includes(name)) {
                type = DataType.DATA
            } else if (result.properties.map(item => item.split('_')[0]).includes(name)) {
                type = DataType.PROPERTY
            } else if (result.computeds.map(item => item.split('_')[0]).includes(name)) {
                type = DataType.COMPUTED
            }
        }
        return type
    }
    function handlePropertyData(dataProperty: t.ObjectProperty, type: string) {
        const propertyValue = dataProperty.value as t.ObjectExpression
        if (propertyValue && propertyValue.properties) {
            const properties = propertyValue.properties as Array<t.ObjectProperty>
            properties.forEach((item) => {
                // 属性通过 Store Map 语法加入组件
                // @ts-ignore
                if (item.type === 'SpreadElement') {
                    handleComponentMapProperty(item, type)
                } else if (item.key) {
                    // @ts-ignore
                    addPropertyToResult(item.key.name, item.key.start, item.key.end, type)
                }
            })
        }
    }

    function handleComponentMapProperty(item: any, type: string) {
        if (item.argument && item.argument.type === 'CallExpression') {
            const callExpItem = item.argument
            const callExparguments = callExpItem.arguments
            const mapPropertys = callExparguments[0]
            if (mapPropertys.type === 'ObjectExpression') {
                const eleProperties = mapPropertys.properties
                eleProperties.forEach((eleProp:any) => {
                    if(eleProp.type === 'ObjectProperty' && eleProp.value === 'StringLiteral') {
                        addPropertyToResult(eleProp.value.value, eleProp.value.start, eleProp.value.end, type)
                    }
                })

            } else if (mapPropertys.type === 'ArrayExpression') {
                const elements = mapPropertys.elements
                elements.forEach((ele:any) => {
                    // map[{}] 这种形式
                    if (ele.type === 'ObjectExpression') {
                        const eleProperties = ele.properties
                        eleProperties.forEach((eleProp:any) => {
                            if(eleProp.type === 'ObjectProperty' && eleProp.value === 'StringLiteral') {
                                addPropertyToResult(eleProp.value.value, eleProp.value.start, eleProp.value.end, type)
                            }
                        });
                    }
                    if (ele.type === 'StringLiteral') {
                        addPropertyToResult(ele.value, ele.start, ele.end, type)
                    }
                });
            }
        }
    }

    function addPropertyToResult(itemName: string, start: number, end: number, type:string) {
        const keyName = genKeyName(itemName, start, end)
        // @ts-ignore
        result[type].push(keyName)
        // @ts-ignore
        result['allKeys'][keyName] = {
            name: keyName,
            type,
            deps: {}
        }
    }

    // @ts-ignore
    function walker(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                importsWalker(node as ts.ImportDeclaration);
                break;
            case ts.SyntaxKind.ClassDeclaration:
                classWalker(node as ts.ClassDeclaration);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                functionDeclarationWalker(node as ts.FunctionDeclaration);
                break;
            case ts.SyntaxKind.VariableStatement:
                variableStatementWalker(node as ts.VariableStatement);
                break;
            case ts.SyntaxKind.ExportDeclaration:
                exportDeclarationWalker(node as ts.ExportDeclaration);
                break;
            case ts.SyntaxKind.ExportAssignment:
                exportAssignementWalker(node as ts.ExportAssignment);
                break;
            default:
                ts.forEachChild(node, walker);
        }
    }
    function hasAsyncModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration |  ts.FunctionExpression | ts.MethodDeclaration) {
        return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword): false;
    }
    function hasExportModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement) {
        return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword): false;
    }
    function hasDefaultModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration | ts.FunctionExpression | ts.VariableStatement) {
        return node.modifiers ? node.modifiers.some(mode => mode.kind === ts.SyntaxKind.DefaultKeyword): false;
    }
    function classWalker(node: ts.ClassDeclaration) {
        const klass: ParsedClass = {
            name: node.name && node.name.escapedText as any,
            methods: [],
            isDefaultExport: hasDefaultModifier(node),
        };
        ts.forEachChild(node, (child) => {
            if (child.kind === ts.SyntaxKind.MethodDeclaration){
                const methodChild = child as ts.MethodDeclaration;
                const methodName = methodChild.name ? (methodChild.name as ts.Identifier).escapedText : '';
                klass.methods.push({
                    methodName,
                    params: methodChild.parameters.map(param => (param.name as ts.Identifier).escapedText),
                    isAsync: hasAsyncModifier(methodChild)
                })
            }
        });
        result.classes.push(klass)
        if (hasExportModifier(node)) {
            result.exportClass = klass;
        }
    }

    function importsWalker(node: ts.ImportDeclaration) {
        const names: string[] = [];
        let importText: string = '';
        if (node.importClause) {
            importText = node.getText();
            ts.forEachChild(node.importClause, (child) => {
                ts.forEachChild(child, (element) => {
                    names.push(element.getText());
                });
            });
        }
        result.imports.push({
            path: node.moduleSpecifier.getText(),
            names,
            importText,
        });
    }

    function functionDeclarationWalker(node: ts.FunctionDeclaration){
        const parsedFunction = {
            name: node.name ? node.name.escapedText: '',
            params: node.parameters.map(param => (param.name as ts.Identifier).escapedText),
            isAsync: hasAsyncModifier(node),
            isDefaultExport: hasDefaultModifier(node)
        };
        if(hasExportModifier(node)){
            result.exportFunctions.push(parsedFunction);
        } else {
            result.functions.push(parsedFunction);
        }
    }

    function variableStatementWalker(node: ts.VariableStatement){
        // check only exported variable statements.
        if(node.declarationList){
            node.declarationList.forEachChild((child) => {
                //handle arrow function declaration
                const varChild = child as ts.VariableDeclaration;
                if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ArrowFunction){
                    const parsedFunction = {
                        name: (varChild.name as ts.Identifier).escapedText,
                        params: (varChild.initializer as ts.FunctionExpression).parameters.map(param => (param.name as ts.Identifier).escapedText),
                        isAsync: hasAsyncModifier(varChild.initializer as ts.FunctionExpression),
                        isDefaultExport: hasDefaultModifier(varChild.initializer as ts.FunctionExpression),
                    };
                    if(hasExportModifier(node)) {
                        result.exportFunctions.push(parsedFunction);
                    } else {
                        result.functions.push(parsedFunction);
                    }
                }
                //handle exported pojo with callable methods
                if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression){
                    const parsedPojo: ParsedPojo = {
                        name: varChild.name && (varChild.name as ts.Identifier).escapedText,
                        isDefaultExport: hasDefaultModifier(varChild.initializer as ts.FunctionExpression),
                        methods: [],
                    };
                    (varChild.initializer as ts.ObjectLiteralExpression).properties.forEach((propNode: ts.Node) => {
                        if (propNode.kind === ts.SyntaxKind.MethodDeclaration){
                            const methodNode = propNode as ts.MethodDeclaration;
                            const methodName = methodNode.name ? (methodNode.name as ts.Identifier).escapedText : '';
                            parsedPojo.methods.push({
                                methodName,
                                params: methodNode.parameters.map(param => (param.name as ts.Identifier).escapedText),
                                isAsync: hasAsyncModifier(methodNode)
                            })
                        }
                    });
                    if(hasExportModifier(node)) {
                        result.exportPojos.push(parsedPojo);
                    } else {
                        result.pojos.push(parsedPojo);
                    }
                }
                if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ClassExpression){
                    const klassExp: ParsedClass = {
                        name: varChild.name && (varChild.name as ts.Identifier).escapedText,
                        methods: [],
                        isDefaultExport: false,
                    };
                    ts.forEachChild(varChild.initializer, (child) => {
                        const methodChild = child as ts.MethodDeclaration;
                        if (child.kind === ts.SyntaxKind.MethodDeclaration){
                            const methodName = methodChild.name ? (methodChild.name as ts.Identifier).escapedText : '';
                            klassExp.methods.push({
                                methodName,
                                params: (child as ts.MethodDeclaration).parameters.map(param => (param.name as ts.Identifier).escapedText),
                                isAsync: hasAsyncModifier(child as ts.MethodDeclaration)
                            })
                        }
                    });
                    result.classes.push(klassExp);
                    result.exportClass = klassExp;
                }
            })
        }
    }

    function exportDeclarationWalker(node: ts.ExportDeclaration){
        node.exportClause && (node.exportClause as ts.NamedExports).elements.forEach(identifier => {
            const idName = identifier.name.escapedText;
            const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
            if(foundClassByIdentifier) {
                result.exportClass = foundClassByIdentifier;
            }
            const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
            if(foundFunctionByIdentifier){
                result.exportFunctions.push(foundFunctionByIdentifier);
            }
            const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
            if(foundPojoByIdentifier){
                result.exportPojos.push(foundPojoByIdentifier);
            }
        });
    }

    function exportAssignementWalker(node: ts.ExportAssignment){
        const idName = (node.expression as ts.Identifier).escapedText;
        const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
        if(foundClassByIdentifier) {
            result.exportClass = {
                ...foundClassByIdentifier,
                isDefaultExport: true,
            };
        }
        const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
        if(foundFunctionByIdentifier){
            result.exportFunctions.push({
                ...foundFunctionByIdentifier,
                isDefaultExport: true,
            });
        }
        const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
        if(foundPojoByIdentifier){
            result.exportPojos.push({
                ...foundPojoByIdentifier,
                isDefaultExport: true,
            })
        }
    }

    return result;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSourceFile = void 0;
const ts = require("typescript");
// @ts-ignore
const traverse_1 = require("@babel/traverse");
const model_1 = require("./model");
const gen_name_1 = require("./utils/gen-name");
function parseSourceFile(file) {
    const result = {
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
    (0, traverse_1.default)(file, {
        enter(path) {
            if (path.node.type === 'CallExpression') {
                if (path.node.callee.name === 'createComponent' || path.node.callee.name === 'createPage') {
                    handleCallExpression(path.node);
                }
            }
        },
        exit(path) {
            var _a, _b;
            if (path.node.type === 'ThisExpression') {
                const scopeNode = (_b = (_a = path === null || path === void 0 ? void 0 : path.scope) === null || _a === void 0 ? void 0 : _a.path) === null || _b === void 0 ? void 0 : _b.node;
                if ((scopeNode === null || scopeNode === void 0 ? void 0 : scopeNode.type) === 'ObjectMethod') {
                    const pathKeyName = (0, gen_name_1.genKeyName)(scopeNode.key.name, scopeNode.key.start, scopeNode.key.end);
                    const depNode = path.context.parentPath.node.property;
                    const depNodeKeyName = (0, gen_name_1.genKeyName)(depNode.name, depNode.start, depNode.end);
                    // @ts-ignore
                    if (result.allKeys[pathKeyName]) {
                        // 获取当前依赖的data的所属类型
                        // 先判断当前的this.xxx 是调用方法还是属性
                        // 方法明和属性名能重名吗？
                        let type = getThisExpressNodeDepNodeType(path, depNode.name);
                        // @ts-ignore
                        result.allKeys[pathKeyName].deps[depNode.name] = {
                            name: depNodeKeyName,
                            type
                        };
                    }
                }
            }
        }
    });
    function handleCallExpression(node) {
        const args = node.arguments;
        if (args.length === 1 && args[0].type === 'ObjectExpression') {
            const ObjectExpression = args[0];
            const properties = ObjectExpression.properties;
            properties.forEach((item) => {
                if (item.key.name === 'data') {
                    handlePropertyData(item, 'datas');
                }
                if (item.key.name === 'computed') {
                    handlePropertyData(item, 'computeds');
                }
                if (item.key.name === 'properties') {
                    handlePropertyData(item, 'properties');
                }
                if (item.key.name === 'watch') {
                    handlePropertyData(item, 'watchs');
                }
                if (item.key.name === 'methods') {
                    handlePropertyData(item, 'methods');
                }
            });
        }
    }
    function getThisExpressNodeDepNodeType(path, name) {
        let type = null;
        if (path.parentPath.parent.type === 'CallExpression') {
            type = model_1.DataType.METHOD;
        }
        else {
            if (result.datas.map(item => item.split('_')[0]).includes(name)) {
                type = model_1.DataType.DATA;
            }
            else if (result.properties.map(item => item.split('_')[0]).includes(name)) {
                type = model_1.DataType.PROPERTY;
            }
            else if (result.computeds.map(item => item.split('_')[0]).includes(name)) {
                type = model_1.DataType.COMPUTED;
            }
        }
        return type;
    }
    function handlePropertyData(dataProperty, type) {
        const propertyValue = dataProperty.value;
        if (propertyValue && propertyValue.properties) {
            const properties = propertyValue.properties;
            properties.forEach((item) => {
                if (item.key) {
                    // @ts-ignore
                    const keyName = (0, gen_name_1.genKeyName)(item.key.name, item.key.start, item.key.end);
                    // @ts-ignore
                    result[type].push(keyName);
                    // @ts-ignore
                    result['allKeys'][keyName] = {
                        name: keyName,
                        type,
                        deps: {}
                    };
                }
            });
        }
    }
    // @ts-ignore
    function walker(node) {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                importsWalker(node);
                break;
            case ts.SyntaxKind.ClassDeclaration:
                classWalker(node);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                functionDeclarationWalker(node);
                break;
            case ts.SyntaxKind.VariableStatement:
                variableStatementWalker(node);
                break;
            case ts.SyntaxKind.ExportDeclaration:
                exportDeclarationWalker(node);
                break;
            case ts.SyntaxKind.ExportAssignment:
                exportAssignementWalker(node);
                break;
            default:
                ts.forEachChild(node, walker);
        }
    }
    function hasAsyncModifier(node) {
        return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) : false;
    }
    function hasExportModifier(node) {
        return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) : false;
    }
    function hasDefaultModifier(node) {
        return node.modifiers ? node.modifiers.some(mode => mode.kind === ts.SyntaxKind.DefaultKeyword) : false;
    }
    function classWalker(node) {
        const klass = {
            name: node.name && node.name.escapedText,
            methods: [],
            isDefaultExport: hasDefaultModifier(node),
        };
        ts.forEachChild(node, (child) => {
            if (child.kind === ts.SyntaxKind.MethodDeclaration) {
                const methodChild = child;
                const methodName = methodChild.name ? methodChild.name.escapedText : '';
                klass.methods.push({
                    methodName,
                    params: methodChild.parameters.map(param => param.name.escapedText),
                    isAsync: hasAsyncModifier(methodChild)
                });
            }
        });
        result.classes.push(klass);
        if (hasExportModifier(node)) {
            result.exportClass = klass;
        }
    }
    function importsWalker(node) {
        const names = [];
        let importText = '';
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
    function functionDeclarationWalker(node) {
        const parsedFunction = {
            name: node.name ? node.name.escapedText : '',
            params: node.parameters.map(param => param.name.escapedText),
            isAsync: hasAsyncModifier(node),
            isDefaultExport: hasDefaultModifier(node)
        };
        if (hasExportModifier(node)) {
            result.exportFunctions.push(parsedFunction);
        }
        else {
            result.functions.push(parsedFunction);
        }
    }
    function variableStatementWalker(node) {
        // check only exported variable statements.
        if (node.declarationList) {
            node.declarationList.forEachChild((child) => {
                //handle arrow function declaration
                const varChild = child;
                if (varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ArrowFunction) {
                    const parsedFunction = {
                        name: varChild.name.escapedText,
                        params: varChild.initializer.parameters.map(param => param.name.escapedText),
                        isAsync: hasAsyncModifier(varChild.initializer),
                        isDefaultExport: hasDefaultModifier(varChild.initializer),
                    };
                    if (hasExportModifier(node)) {
                        result.exportFunctions.push(parsedFunction);
                    }
                    else {
                        result.functions.push(parsedFunction);
                    }
                }
                //handle exported pojo with callable methods
                if (varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                    const parsedPojo = {
                        name: varChild.name && varChild.name.escapedText,
                        isDefaultExport: hasDefaultModifier(varChild.initializer),
                        methods: [],
                    };
                    varChild.initializer.properties.forEach((propNode) => {
                        if (propNode.kind === ts.SyntaxKind.MethodDeclaration) {
                            const methodNode = propNode;
                            const methodName = methodNode.name ? methodNode.name.escapedText : '';
                            parsedPojo.methods.push({
                                methodName,
                                params: methodNode.parameters.map(param => param.name.escapedText),
                                isAsync: hasAsyncModifier(methodNode)
                            });
                        }
                    });
                    if (hasExportModifier(node)) {
                        result.exportPojos.push(parsedPojo);
                    }
                    else {
                        result.pojos.push(parsedPojo);
                    }
                }
                if (varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ClassExpression) {
                    const klassExp = {
                        name: varChild.name && varChild.name.escapedText,
                        methods: [],
                        isDefaultExport: false,
                    };
                    ts.forEachChild(varChild.initializer, (child) => {
                        const methodChild = child;
                        if (child.kind === ts.SyntaxKind.MethodDeclaration) {
                            const methodName = methodChild.name ? methodChild.name.escapedText : '';
                            klassExp.methods.push({
                                methodName,
                                params: child.parameters.map(param => param.name.escapedText),
                                isAsync: hasAsyncModifier(child)
                            });
                        }
                    });
                    result.classes.push(klassExp);
                    result.exportClass = klassExp;
                }
            });
        }
    }
    function exportDeclarationWalker(node) {
        node.exportClause && node.exportClause.elements.forEach(identifier => {
            const idName = identifier.name.escapedText;
            const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
            if (foundClassByIdentifier) {
                result.exportClass = foundClassByIdentifier;
            }
            const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
            if (foundFunctionByIdentifier) {
                result.exportFunctions.push(foundFunctionByIdentifier);
            }
            const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
            if (foundPojoByIdentifier) {
                result.exportPojos.push(foundPojoByIdentifier);
            }
        });
    }
    function exportAssignementWalker(node) {
        const idName = node.expression.escapedText;
        const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
        if (foundClassByIdentifier) {
            result.exportClass = Object.assign(Object.assign({}, foundClassByIdentifier), { isDefaultExport: true });
        }
        const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
        if (foundFunctionByIdentifier) {
            result.exportFunctions.push(Object.assign(Object.assign({}, foundFunctionByIdentifier), { isDefaultExport: true }));
        }
        const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
        if (foundPojoByIdentifier) {
            result.exportPojos.push(Object.assign(Object.assign({}, foundPojoByIdentifier), { isDefaultExport: true }));
        }
    }
    return result;
}
exports.parseSourceFile = parseSourceFile;

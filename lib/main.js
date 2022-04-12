"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
// import * as ts from 'typescript';
const path = require("path");
// @ts-ignore
const fs_1 = require("fs");
// @ts-ignore
const parseComponent = require("@mpxjs/webpack-plugin/lib/parser");
// @ts-ignore
const fixUsingComponent = require("@mpxjs/webpack-plugin/lib/utils/fix-using-component");
const JSON5 = require("json5");
const parser = require("@babel/parser");
const mpx_json_1 = require("./utils/mpx-json");
const parse_source_file_1 = require("./parse-source-file");
const generate_unit_test_1 = require("./generate-unit-test");
// deps.value.name 是无用的，仅作为一个flag
const defs = {
    __mpx_mode__: 'wx',
    __mpx_env__: 'dd',
    __VERSION__: '6.2.5',
    __mpx_test__: true,
    __application_name__: 'some_application',
    __env__: 'test',
    __wxConfig: {},
    __IS_DIDI_WX_APP__: true
};
const mode = 'wx';
function run(params) {
    if (!params.length) {
        console.error('missing path arguments');
        process.exit(1);
    }
    if (params.length > 1 && params[0].indexOf('--require') === 0) {
        require(params[1]);
        params = params.slice(2);
    }
    const inputPath = params[0];
    const inputFilenameNoExt = path.basename(inputPath, path.extname(inputPath));
    const specFileName = path.join(path.dirname(inputPath), `${inputFilenameNoExt}.generated.spec.js`);
    const inputAbsolutePath = path.join(__dirname, inputPath);
    const sourceCode = (0, fs_1.readFileSync)(inputPath).toString();
    const parts = parseComponent(sourceCode, {
        inputPath,
        needMap: false,
        mode,
        defs,
        env: 'test'
    });
    // 处理 Mpx 组件json部分
    let usingComponents = [];
    if (parts.json && parts.json.content) {
        try {
            let ret = {};
            if (parts.json.useJSONJS) {
                const text = (0, mpx_json_1.compileMPXJSONText)({ source: parts.json.content, defs, filePath: inputPath });
                parts.json.content = text;
            }
            ret = JSON5.parse(parts.json.content);
            if (ret.usingComponents) {
                fixUsingComponent(ret.usingComponents, mode);
                usingComponents = ret.usingComponents;
            }
        }
        catch (e) {
            console.log('error:', e);
            return e;
        }
    }
    // 处理Mpx组件script部分
    if (parts.script && parts.script.content) {
        const sourceCode = parser.parse(parts.script.content, {
            sourceType: "module"
        });
        // @ts-ignore
        const parsedResult = (0, parse_source_file_1.parseSourceFile)(sourceCode);
        parsedResult['usingComponents'] = usingComponents;
        // @ts-ignore
        const output = (0, generate_unit_test_1.generateUnitTest)(parsedResult, inputAbsolutePath);
        // @ts-ignore
        (0, fs_1.writeFileSync)(specFileName, output);
    }
}
exports.run = run;

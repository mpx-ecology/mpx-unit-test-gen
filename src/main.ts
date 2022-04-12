// import * as ts from 'typescript';
import * as path from 'path';
// @ts-ignore
import { readFileSync, writeFileSync } from "fs";
// @ts-ignore
import * as parseComponent from '@mpxjs/webpack-plugin/lib/parser';
// @ts-ignore
import * as fixUsingComponent from '@mpxjs/webpack-plugin/lib/utils/fix-using-component';
import * as JSON5 from 'json5';
import * as parser from "@babel/parser";
import { compileMPXJSONText } from './utils/mpx-json'
import { parseSourceFile } from './parse-source-file';
import { generateUnitTest } from './generate-unit-test';
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
}
const mode = 'wx'
export function run(params: string[]) {
    if (!params.length) {
        console.error('missing path arguments')
        process.exit(1)
    }

    if (params.length > 1 && params[0].indexOf('--require') === 0) {
        require(params[1]);
        params = params.slice(2);
    }
    const inputPath = params[0];
    const inputFilenameNoExt = path.basename(inputPath, path.extname(inputPath));
    const specFileName = path.join(path.dirname(inputPath),`${inputFilenameNoExt}.generated.spec.js`);
    const inputAbsolutePath: string = path.join(__dirname, inputPath);
    const sourceCode = readFileSync(inputPath).toString();

    const parts = parseComponent(sourceCode, {
        inputPath,
        needMap: false,
        mode,
        defs,
        env: 'test'
    })
    // 处理 Mpx 组件json部分
    let usingComponents: any[] = []
    if (parts.json && parts.json.content) {
        try {
            let ret: any = {}
            if (parts.json.useJSONJS) {
                const text = compileMPXJSONText({ source: parts.json.content, defs, filePath: inputPath })
                parts.json.content = text
            }
            ret = JSON5.parse(parts.json.content)
            if (ret.usingComponents) {
                fixUsingComponent(ret.usingComponents, mode)
                usingComponents = ret.usingComponents
            }
        } catch (e) {
            console.log('error:', e)
            return e
        }
    }
    // 处理Mpx组件script部分
    if (parts.script && parts.script.content) {
        const sourceCode = parser.parse(parts.script.content, {
            sourceType: "module"
        })
        // @ts-ignore
        const parsedResult = parseSourceFile(sourceCode)
        parsedResult['usingComponents'] = usingComponents
        // @ts-ignore
        const output = generateUnitTest(parsedResult, inputAbsolutePath)
        // @ts-ignore
        writeFileSync(specFileName, output)
    }

}

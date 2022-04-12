"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUnitTest = void 0;
// @ts-ignore
const nunjucks = require("nunjucks");
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'));
env.addFilter('getGenName', (name) => {
    return name.split('_')[0];
});
function generateUnitTest(sourceResult, compPath) {
    if (!sourceResult) {
        console.error('generateUnitTest need source result');
        process.exit(1);
    }
    let unitTestStr = '';
    console.log(sourceResult.usingComponents);
    // @ts-ignore
    const compTempStr = env.render(`component.js`, {
        path: compPath,
        usingComponents: sourceResult.usingComponents
    });
    unitTestStr = unitTestStr + compTempStr + '\n';
    if (sourceResult.datas && sourceResult.datas.length > 0) {
        // @ts-ignore
        const datasStr = env.render(`datas.js`, {
            datas: sourceResult.datas.map((item) => item.split('_')[0])
        });
        unitTestStr = unitTestStr + datasStr + '\n';
    }
    if (sourceResult.properties && sourceResult.properties.length > 0) {
        // @ts-ignore
        const propertiesStr = env.render(`properties.js`, {
            properties: sourceResult.properties.map((item) => item.split('_')[0])
        });
        unitTestStr = unitTestStr + propertiesStr + '\n';
    }
    if (sourceResult.computeds && sourceResult.computeds.length > 0) {
        // @ts-ignore
        const computedsStr = env.render(`computeds.js`, {
            computeds: sourceResult.computeds,
            allKeys: sourceResult.allKeys
        });
        unitTestStr = unitTestStr + computedsStr + '\n';
    }
    if (sourceResult.computeds && sourceResult.computeds.length > 0) {
        const watchsStr = env.render(`watchs.js`, {
            watchs: sourceResult.watchs,
            allKeys: sourceResult.allKeys
        });
        unitTestStr = unitTestStr + watchsStr + '\n';
    }
    return unitTestStr;
}
exports.generateUnitTest = generateUnitTest;

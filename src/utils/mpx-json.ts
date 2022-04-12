import * as path from 'path';

// 将JS生成JSON
export function compileMPXJSON ({ source, defs, filePath }: {source: string, defs: any, filePath: string}) {
    const defKeys = Object.keys(defs)
    const defValues = defKeys.map((key) => {
        return defs[key]
    })
    // eslint-disable-next-line no-new-func
    const func = new Function('exports', 'require', 'module', '__filename', '__dirname', ...defKeys, source)
    // 模拟commonJS执行
    // support exports
    const e = {}
    const m = {
        exports: e
    }
    const dirname = path.dirname(filePath)
    func(e, function (modulePath: string) {
        if (!path.isAbsolute(modulePath)) {
            if (modulePath.indexOf('.') === 0) {
                modulePath = path.resolve(dirname, modulePath)
            }
        }
        return require(modulePath)
    }, m, filePath, dirname, ...defValues)
    return m.exports
}

export function compileMPXJSONText (opts: Object) {
    // @ts-ignore
    return JSON.stringify(compileMPXJSON(opts), null, 2)
}

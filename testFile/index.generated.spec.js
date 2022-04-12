const testUtils = require('@mpxjs/test-utils')

const compPath = '/Users/didi/blackdir/mpx-unit-test-gen/src/testFile/index.mpx'

let comp = null
describe('test component /Users/didi/blackdir/mpx-unit-test-gen/src/testFile/index.mpx', () => {
    beforeEach(() => {
        // 进行usingComponents 组件 mock
        testUtils.mockComponents([
            'mpx-icon','special-text',
        ])
        comp = testUtils.createCompAndAttach(compPath)
    })

})

it('check components instance data', function () {
    const insData = comp.instance.data
    // 预期组件实例初始化时的data是否正确

    testUtils.checkExpectedData(insData, {
        display: 'xxx',rules: 'xxx',amountRules: 'xxx',
    })
    const domHTML = comp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})

it('check components instance properties', function () {
    // 当组件存在父级组件传参时，需要对prop变化时，组件状态进行预期
    // 测试多个状态时需要对组件实例进行重新生成

    const testPropComp = testUtils.createCompAndAttach(compPath, {
        descriptionInfo: 'xxx',estimateTraceId: 'xxx',from: 'xxx',isIphoneX: 'xxx',
    })
    // 可在次补充对模版中有使用到 property 的地方进行状态断言

    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})


// 组件computed属性，对于其他data有依赖，我们需要在所依赖数据改变之后对组件状态进行断言
it('check components computed activityId', async function () {
    
     // 当from 改变时
    
    
    // from 为 properties，如果需要修改需要重新创建挂载组件实例
    
    
    await comp.instance.$nextTick()
    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})
it('check components computed interceptType', async function () {
    
     // 当from 改变时
    
    
    // from 为 properties，如果需要修改需要重新创建挂载组件实例
    
    
    await comp.instance.$nextTick()
    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})
it('check components computed couponInfo', async function () {
    
     // 当descriptionInfo 改变时
    
    
    // descriptionInfo 为 properties，如果需要修改需要重新创建挂载组件实例
    
    
    await comp.instance.$nextTick()
    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})
it('check components computed className', async function () {
    
     // 当display 改变时
    
    comp.instance.data.display = 'xxx'
    
    
    
    await comp.instance.$nextTick()
    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})


// 组件watch属性，我们需要在所监听数据改变之后对组件状态进行断言
it('check components watch activityId_690_700', async function () {
    // 当activityId_690_700 监听触发时，需要做出相应断言
    

    
    // callback 中有 hide 方法的调用
    // 如果需要断言方法是否被调用，可使用下方代码
    const hideSpy = jest.spyOn(comp.instance, 'hide')
    // expect(hideSpy).toHaveBeenCalledTimes(1)
    
    
    await comp.instance.$nextTick()
    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})



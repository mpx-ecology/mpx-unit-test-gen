it('check components instance properties', function () {
    // 当组件存在父级组件传参时，需要对prop变化时，组件状态进行预期
    // 测试多个状态时需要对组件实例进行重新生成

    const testPropComp = testUtils.createCompAndAttach(compPath, {
        {% for item in properties-%}
        {{ item }}: 'xxx',
        {%- endfor %}
    })
    // 可在次补充对模版中有使用到 property 的地方进行状态断言

    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})


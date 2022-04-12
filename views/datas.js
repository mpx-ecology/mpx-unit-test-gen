it('check components instance data', function () {
    const insData = comp.instance.data
    // 预期组件实例初始化时的data是否正确

    testUtils.checkExpectedData(insData, {
        {% for item in datas-%}
        {{ item }}: 'xxx',
        {%- endfor %}
    })
    const domHTML = comp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
})

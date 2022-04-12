// 组件computed属性，对于其他data有依赖，我们需要在所依赖数据改变之后对组件状态进行断言
{% for computed in computeds-%}
it('check components computed {{computed | getGenName}}', async function () {
    {% for depKey, depValue in  allKeys[computed].deps%}
     // 当{{depKey}} 改变时
    {% if depValue.type === 'datas' %}
    comp.instance.data.{{depKey}} = 'xxx'
    {% endif %}
    {% if depValue.type === 'properties' %}
    // {{depKey}} 为 properties，如果需要修改需要重新创建挂载组件实例
    {% endif %}
    {% endfor %}
    await comp.instance.$nextTick()
    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
}){{'\n'}}
{%- endfor %}

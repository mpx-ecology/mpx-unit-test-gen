// 组件watch属性，我们需要在所监听数据改变之后对组件状态进行断言
{% for watch in watchs-%}
it('check components watch {{watch | getGenName}}', async function () {
    // 当{{watch}} 监听触发时，需要做出相应断言
    {% for depKey, depValue in  allKeys[watch].deps %}

    {% if depValue.type === 'methods' %}
    // callback 中有 {{depKey}} 方法的调用
    // 如果需要断言方法是否被调用，可使用下方代码
    const {{depKey}}Spy = jest.spyOn(comp.instance, '{{depKey}}')
    // expect({{depKey}}Spy).toHaveBeenCalledTimes(1)
    {% endif %}
    {% endfor %}
    await comp.instance.$nextTick()
    const domHTML = testPropComp.dom.innerHTML
    expect(domHTML).toMatchSnapshot()
}){{'\n'}}
{%- endfor %}

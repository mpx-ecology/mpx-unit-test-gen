// 组件methods，method可能是其他方法或者watch的依赖，也或者是模版bind事件，可根据组件实际情况进行单测书写
{% for method in methods-%}
it('check components method {{method | getGenName}}', async function () {
    // 事件可以通过组件实例进行手动触发
    // comp.instance.{{method}}(params)
    // 也可以通过选中节点进行绑定事件的触发
    // const childComp = comp.querySelector('.someTimeDeferActionClass')
    // childComp.dispatchEvent('tap')

    // 事件执行后，对组件相应属性或视图变化做对应的预期
}){{'\n'}}
{%- endfor %}



})
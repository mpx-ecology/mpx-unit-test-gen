const testUtils = require('@mpxjs/test-utils')

const compPath = '{{ path }}'

let comp = null
describe('test component {{path}}', () => {
    beforeEach(() => {
        // 进行usingComponents 组件 mock
        testUtils.mockComponents([
            {% for key, value in  usingComponents %}'{{key}}',{% endfor %}
        ])
        comp = testUtils.createCompAndAttach(compPath)
    })

})

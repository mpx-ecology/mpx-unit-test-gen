
let persons = [
    '小鹿^O^ ',
    '伟东 ',
    '薛干',
    '雪松 ',
    '世玉 ',
    '维少 ',
    '张旭 ',
    '金城 ',
    '马克 ',
    '陈哲 ',
    '许天童 ',
    '言涛 ',
    '波 ',
    'hiyuki ',
    '王帅 ',
    '陈哲弟弟 '
]
let len = persons.length - 1
let teamArr = []
while (len >=0) {
    let _index = (Math.random() * len).toFixed()
    teamArr = teamArr.concat(persons.splice(_index, 1))
    len--
    if (teamArr.length === 4) {
        console.log(teamArr.toString())
        teamArr.length = 0
    }
}

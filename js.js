const sleep = (ms) => new Promise((res) => setTimeout(() => res(), ms))    // 等待

/**
 * 获取 main-content 元素
 * @returns {Object}
 */

function getMainContent() {
    return document.getElementById('main-content')
}

function nextLine() {
    let atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 1)
    getMainContent().appendChild(document.createElement('br'))
    if (atBottom){
        window.scrollTo(0, document.body.scrollHeight);
    }
}

/**
 * 把一个文本显示在网页上，并且有动画
 * @param {String} text 要显示的文本
 * @param {Number} interval 显示每个字时间隔的时间
 * @returns {Promise}
 */
function pushText(text, interval = 60){
    var el = document.createElement('p')    // 创建元素
    let atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 1)
    getMainContent().appendChild(el)    // 显示在界面上
    el.textContent += text[0] || ''
    if (atBottom){
        window.scrollTo(0, document.body.scrollHeight);
    }
    return new Promise(async (res) => {    // 返回一个 “承诺”
        let e = el
        let i = 1
        let t = text
        let s = setInterval(() => {
            if (typeof t[i] !== 'string'){
                clearInterval(s)
                res()
                return
            }
            e.textContent += t[i]
            i++
        },interval)    // 每 200 毫秒显示一个字
    })
}

/**
 * 在页面上显示一些按钮
 * @param {Array} answers 按钮
 * @returns {Promise}
 */

function pushQuestion(answers){
    var buttons = []
    answers.forEach(async (s) => {
        let el = document.createElement('button')
        el.textContent = s
        let atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 1)
        getMainContent().appendChild(el)
        if (atBottom){
            window.scrollTo(0, document.body.scrollHeight);
        }
        buttons.push(el)
        nextLine()
        nextLine()
    })
    return new Promise((res) => {
        buttons.forEach((b) => b.onclick = () => res(b.textContent))
    })
}

/**
 * 等待用户点击网页
 * @returns {Promise}
 */

function waitClick() {
    return new Promise((res) => {
        document.onclick = res
    })
}

/**
 * 显示“请单击网页以继续游戏”的信息
 * @param {String} msg 自定义提示
 */

async function pause(msg = '') {
    await pushText(msg || '请单击网页以继续游戏')
    await waitClick()
}

/**
 * 清屏
 */

function clear() {
    document.getElementById('main-content').innerHTML = ''
}

/**
 * 从目标URL获取数据，方式为GET
 * @param {String} url 目标URL
 * @returns {Promise}
 */

function getData(url) {
    return new Promise((res,rej) => {
        let xhr = new XMLHttpRequest()    // 来一个XHR
        xhr.open('GET',url)
        xhr.send()
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    rej(xhr.statusText)
                }else {
                    res(xhr.responseText)
                }
            }
        }
    })
}

/**
 * 解析 .zhang-game 文件
 * @param {String} text 
 */

async function parseZhangGameFile(text) {
    const LINES = text.split('\n')    // 分割
    var i = 0
    for (i in LINES) {    // 循环执行所有指令
        try {
            var code = await parseLine(LINES[i])    // 执行
        }catch (err) {
            // 报错啦
            await pushText('哎呀，该游戏出现了脚本错误，详细信息：')
            await pushText(err.message)
            await pushText('您可以将此问题报告给该游戏的开发者以帮助他改进这个游戏')
            await pushText('游戏已自动结束')
            return ZHANG_GAME_CODES.ERROR
        }
        if (code === ZHANG_GAME_CODES.EXIT) {    // 结束当前脚本运行
            return code
        }
    }
}

/**
 * 加载并执行 zhang-game 脚本
 * @param {String} url zhang-game 脚本地址
 */

async function loadZhangGameFile(url) {
    const CONTENT = await getData(url)    // GET一下
    await parseZhangGameFile(CONTENT)
}

/**
 * 执行 .zhang-game 文件里面的一行
 * @param {String} text 
 */

async function parseLine(text) {
    if (text.endsWith('\r')) {
        text = text.slice(0,text.length - 1)
    }
    if (text.startsWith('\\!')) {    // 如果是被转义的关键字
        await pushText(text.slice(1)) // 再转义一遍
    }else if (!text.startsWith('!')) {    // 如果不是关键字
        await pushText(text)    // 显示文字
    }else {    // 那么这就应该是关键字了
        const COMMAND = text.slice(1).split(' ')[0].toLocaleLowerCase()    // 解析命令名称并转换为小写
        const ARGS = text.slice(1).split(' ').slice(1).join(' ') || ''    // 解析参数
        const ALLOWED_COMMANDS = ['pause','clear','load','exit','wait']    // 允许的命令
        if (!ALLOWED_COMMANDS.includes(COMMAND)) {    // 如果无效
            throw new Error(`zhang-game 脚本配置有误，${COMMAND} 关键字无效。`)    // 抛出异常
        }
        if (COMMAND === 'pause') {    // 暂停命令
            await pause(ARGS)
        }else if (COMMAND === 'clear') {    // 清屏
            clear()
        }else if (COMMAND === 'load') {    // 加载其他的脚本，并终止当前脚本执行
            loadZhangGameFile(ARGS)
            return ZHANG_GAME_CODES.EXIT
        }else if (COMMAND === 'exit') {
            return ZHANG_GAME_CODES.EXIT
        }else if (COMMAND === 'wait') {
            await waitClick()
        }
    }
}

/**
 * 初始化程序
 * 声明一些常量
 */

function init() {
    window.ZHANG_GAME_CODES = {    // 声明 zhang-game 脚本指令码
        EXIT: 0,    // 结束当前 zhang-game 脚本
    }
}

/**
 * 主函数
 */

async function main() {
    pushText('小张游戏正在进行公测中，链接：https://game.zhangsoft.cf/beta')
}

init()
main()    // 正式开始执行脚本
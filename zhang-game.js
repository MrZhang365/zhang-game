/**
 * 等待一下
 * @param {Number} ms 毫秒
 * @returns {Promise}
 */

function sleep(ms) {
    return new Promise((res) => setTimeout(() => res(), ms))
}

/**
 * 获取 main-content 元素
 * @returns {Object}
 */

function getMainContent() {
    return document.getElementById('main-content')
}

/**
 * 换行
 */

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
 * 在页面上显示一张图片
 * @param {String} url 目标图片的地址
 */

function pushImg(url){
    var el = document.createElement('img')    // 创建元素
    let atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 1)
    el.src = url
    getMainContent().appendChild(el)    // 显示在界面上
    if (atBottom){
        window.scrollTo(0, document.body.scrollHeight);
    }
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
 * 解析 .zhang-game 文件（zhang-game 脚本）并执行
 * @param {String} text 
 * @param {Number} lineNumber 从第多少行（0为第一行，1为第二行，以此类推）开始解析
 */

async function parseZhangGameFile(text, lineNumber = 0) {
    const LINES = text.split('\n')    // 分割
    var i = 0
    for (i in LINES) {    // 循环执行所有指令
        if (i < lineNumber) {    // 如果没到达指定的行，则跳过本次循环
            continue
        }
        try {
            localStorageSet('line',String(i))    // 保存当前行号（这玩意会被自动转换为字符串，那咱就将计就计）
            var code = await parseLine(LINES[i])    // 执行
        }catch (err) {
            // 报错啦
            localStorageClear()    // 报错，那就删档
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
 * 从目标URL获取并解析、执行 zhang-game 脚本
 * @param {String} url zhang-game 脚本地址
 */

async function loadZhangGameFile(url) {
    try{
        var CONTENT = await getData(url)    // GET一下
    }catch(err) {
        console.error(`加载游戏脚本时出现异常：${err}`)
        await pushText('哎呀，无法加载游戏脚本，目标URL为：'+url)
        await pushText('报错信息：'+err.message)
        await pushText('您可以将此问题报告给该游戏的开发者以帮助他改进这个游戏')
        await pushText('游戏已自动结束')
        return
    }
    localStorageClear()    // 删存档
    localStorageSet('file-url',url)    // 设置文件名
    localStorageSet('line','0')    // 保存当前行号（这玩意会被自动转换为字符串，那咱就将计就计）
    localStorageSet('file',CONTENT)    // 保存文件，日后对比是否相同。（一个 zhang-game 脚本应该没那么大吧？）
    await parseZhangGameFile(CONTENT)    // 解析文件
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
        const ALLOWED_COMMANDS = ['pause','clear','load','exit','ask','img','reset','clear_record']    // 允许的命令
        if (!ALLOWED_COMMANDS.includes(COMMAND)) {    // 如果无效
            throw new Error(`zhang-game 脚本语法错误，${COMMAND} 关键字无效。`)    // 抛出异常
        }
        if (COMMAND === 'pause') {    // 等待用户点击，并显示提示
            await pause(ARGS)
        }else if (COMMAND === 'clear') {    // 清屏
            clear()
        }else if (COMMAND === 'load') {    // 加载其他的脚本，并终止当前脚本执行
            loadZhangGameFile(ARGS)
            return ZHANG_GAME_CODES.EXIT
        }else if (COMMAND === 'exit') {    // 清空存档并结束当前脚本
            localStorageClear()
            return ZHANG_GAME_CODES.EXIT
        }else if (COMMAND === 'ask') {    // 显示几个选项
            // 语法就像这样：
            // !ask (选项1,选项2,选项N) (脚本1,脚本2,脚本N)
            // 注意，不能随便加空格
            // 如果选择选项1，则加载脚本1并终止当前脚本执行
            // 以此类推
            // PS：这只是个简单的“语言”，所以我...无语
            if (!ARGS) {    // 判断是否有参数
                throw new Error(`zhang-game 脚本语法错误，${COMMAND} 未传递参数`)
            }
            // 由于判断语法是否正常过于繁琐（其实是能力有限），所以这里直接解析
            let temp = ARGS.split(') (')    // 分割
            // 解析
            const OPTIONS = temp[0].slice(1).split(',')    // 选项
            const ACTIONS = temp[1].slice(0,temp[1].length - 1).split(',')    // 响应脚本
            if (OPTIONS.length !== ACTIONS.length) {    // 判断数量是否匹配
                throw new Error(`zhang-game 脚本语法错误，选项数量不等于响应脚本数量`)
            }
            const USER_CHOICE = await pushQuestion(OPTIONS)    // 获取输入
            loadZhangGameFile(ACTIONS[OPTIONS.indexOf(USER_CHOICE)])    // 加载脚本
            return ZHANG_GAME_CODES.EXIT    // 结束当前脚本
        }else if (COMMAND === 'img') {
            if (!ARGS) {
                throw new Error(`zhang-game 脚本语法错误，${COMMAND} 未传递参数`)
            }
            pushImg(ARGS)
        }else if (COMMAND === 'reset') {    // 重置游戏，即清空存档并刷新页面，终止脚本执行
            localStorageClear()    // sudo rm -rf /*
            location.reload()    // 刷新页面
            return ZHANG_GAME_CODES.EXIT    // 终止脚本执行
        }else if (COMMAND === 'clear_record') {    // 清除存档
            localStorageClear()    // sudo rm -rf /*
        }
    }
}

/**
 * 返回 localStorage 中指定的键值
 * @param {String} key 目标键
 * @returns {any}
 */

function localStorageGet(key) {
    return localStorage.getItem(key)
}

/**
 * 修改 localStorage 中指定的键值
 * @param {String} key 目标键
 * @param {any} value 值
 */

function localStorageSet(key,value) {
    localStorage.setItem(key,value)
}

/**
 * 从 localStorage 删除指定的键
 * @param {String} key 键
 */

function localStorageRemove(key) {
    localStorage.removeItem(key)
}

/**
 * 删除 localStorage 里面的所有东西
 */

function localStorageClear() {
    localStorage.clear()
}

/**
 * 加载存档，并自动删除存档（如果存档异常）
 * 异步函数
 * @returns {null|Object}
 */

async function loadRecord() {
    const FILE_URL = localStorageGet('file-url')    // 文件地址
    const FILE = localStorageGet('file')    // 临时保存的内容，用于比对文件是否相同
    const LINE = Number(localStorageGet('line'))    // 行号

    if (!FILE_URL || !FILE || typeof LINE !== 'number' || isNaN(LINE)) {
        // 没有存档内容
        return null    // 返回null
    }

    try {
        var nowFile = await getData(FILE_URL)    // 获取服务器上的文件
    } catch (err) {
        // 如果获取失败，则删除存档并返回 null
        localStorageClear()
        return null
    }

    if (nowFile !== FILE) {
        // 如果和本地存储的文件内容不匹配，则删除存档并返回null
        localStorageClear()
        return null
    }

    return {    // 返回存档信息
        file: FILE,
        line: LINE,
    }
}

/**
 * 初始化程序
 * 声明一些常量和变量，检查浏览器兼容性
 */

function init() {
    // 检查 localStorage 是否被支持
    // 用于存档
    if (!window.localStorage) {
        throw new Error('该浏览器不支持 localStorage。\n请更新浏览器后再试！')    // 抛出异常
    }

    window.ZHANG_GAME_CODES = {    // 声明 zhang-game 脚本指令码
        EXIT: 0,    // 结束当前 zhang-game 脚本
    }
}

/**
 * 主函数
 * PS：在这里面一般只需要调用一个 loadZhangGameFile 函数即可
 * main函数必须是异步执行的，不然会阻塞主线程或里面的await用不了
 */

async function main() {
    // 初始化游戏
    try {
        init()    // 初始化
    } catch (err) {
        alert('抱歉，初始化游戏时出现了致命性错误。\n详细信息：\n'+err.message)    // 直接弹窗提示，为了保险不用 pushText
        return    // 中断执行
    }
    const RECORD = await loadRecord()    // 同步读取存档
    if (RECORD === null) {    // 如果没有存档，则直接加载脚本
        await loadZhangGameFile('game.zhang-game')
    } else {    // 如果有存档，则执行已存档的脚本
        await parseZhangGameFile(RECORD.file,RECORD.line)
    }
}

try{
    // 开始执行
    main()
} catch (err) {
    // 未捕获错误
    console.error('zhang-game脚本解释器出现了致命性错误：')
    console.error(err)
    alert('抱歉，zhang-game脚本解释器出现了致命性错误。\n详细信息：\n'+err.message)
}
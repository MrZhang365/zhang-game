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

/*

async function main() {
    await pause('请单击网页来开始游戏')
    clear()
    await pushText('某天早上，你一觉醒来发现自己变成了另外一个人。')
    await pushText('你读取了一下记忆，发现这个人叫做 张** （MrZhang365：什么？）')
    await pushText('你晕了过去。')
    await pushText('突然，一阵闹钟声把你吵醒，你看了看时间，现在竟然是！')
    await pushText('2022年3月下旬！')
    await pushText('现在正是天津沦陷的时候，学生们都在家里上网课，你也不例外。')
    await pushText('你穿上校服，坐到电脑前，开始一天的网课生活。')
    await pause()
    clear()
    await pushText('现在是上午 8：20。')
    await pushText('第一节课已经上了一半了，老师发的视频也已经看完了，你感到很无聊。')
    await pushText('你决定：')
    const choice1 = await pushQuestion(['在电脑上玩游戏','打开浏览器'])
    clear()
    await pushText(`你决定${choice1}`)
    if (choice1 === '在电脑上玩游戏') {
        await pushText('但是你发现你竟然不会玩游戏？！')
        await pushText('坏结局：《我竟然不会玩游戏》')
        await pause('单击网页以重新开始')
        location.reload()
        return
    }
    await pushText('你突然想起之前听说过一个叫做“一个没用的网站”的网站，于是打算在网上搜搜。')
    await pushText('你搜到了那个网站，同时也无意间看到了一个叫做 Hack.Chat 的国外黑客风格的聊天网站。')
    await pushText('你打算：')
    const choice2 = await pushQuestion(['打开看看','关掉网页，看看班级群'])
    clear()
    await pushText(`你打算${choice1}`)
    if (choice2 === '关掉网页，看看班级群') {
        await pushText('你关掉了网页，回到微信上。')
        await pushText('你向老师提了几个问题，老师直夸你好学')
        await pushText('若1年以后，你放弃了编程。')
        await pushText('你考上了最好的高中，但是自己的爱好却没了')
        await pushText('在选科的时候，你很迷茫；若干年后在选择大学专业的时候，你差点崩溃；大学毕业以后，你不知道自己该找什么工作。')
        await pushText('单击网页以继续游戏')
        await waitClick()
        clear()
        await pushText('坏结局：虽然学有所成，但是自己却没了爱好')
        await pause('单击网页以重新开始')
        location.reload()
        return
    }
    await pushText('你使用了 Xiao_Zhang 这个昵称加入了聊天室')
    await pushText('但是几分钟后，你考虑到这里有外国人，于是改名为 Mr_Zhang')
    await pushText('你对这个聊天室产生了浓厚的兴趣')
    await pushText('你很快就了解了许多关于HC的知识，并且和里面的中国用户们打成一片')
    await pushText('初来乍到，你表现得很有礼貌')
    await pushText('里面的人喜欢开玩笑，例如称你为“张三”，问你是不是真的姓张。')
    await pushText('“如果我不姓张，那么我为什么要起这个名字呢？”你回答道')
    await pause()
    clear()
    await pushText('你看到了一个叫做 notBot 的“用户”，他能在你加入聊天室的时候第一时间报出你的曾用名，你很好奇，于是便追着他问问题。')
    await pushText('你表现得很幼稚')
    await pause()
    clear()
    await pushText('你又去 ?lounge 转一圈，发现那里有个叫“eebot”的机器人，你很感兴趣。')
    await pushText('于是你就趁她的主人ee重启机器人的时候占用了“eebot”这个昵称')
    await pushText('ee：“没事，随便一敲又是一只bot”')
    await pushText('ee的话震惊了你，没想到自己遇到了一位大佬！')
    await pushText('于是你便把昵称还给了eebot')
    await pause()
    clear()
    await pushText('那时候你会一点点的Python，认为自己有能力写bot，于是打算放手一搏。')
    await pushText('你下定决心，编写属于自己的bot')
    await pause()
    clear()
    await pushText('星期五到了，你有了编程的时间了。')
    await pushText('你看着空荡荡的编辑器，不知道该从哪里写起。')
    await pushText('你尝试向ee要eebot的源代码，没想到他居然慷慨地把代码打包发给你了，这给了你极大的动力，https://paperee.tk 便成了你的第一个友联。')
    await pushText('你又在GitHub上翻到了HC的Python库，你瞬间动力满满')
    await pause()
    clear()
    await pushText('代码写完了，你按下了启动按钮，结果却报错了：SSL证书错误')
    await pushText('你认为你自己写的代码有BUG，于是便启动了ee给你的代码。')
    await pushText('依然报错，这个BUG折磨得你掉了114514根头发（MrZhang365：蛤？）')
    await pushText('你便把截图发给了ee，他也很懵')
    await pause()
    await pushText('你灵光一现，觉得这是Windows10的系统版本太高，于是把代码转移到了一台Windows7电脑上。')
    await pushText('“死马当活马医吧”，你心里想。你再次按下了运行。')
    await pause()
    await pushText('这时，你看到聊天室里显示了这个信息：ZhangBot joined')
    await pushText('ZhangBot：Hello World!')
    await pushText('Ohhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh')
    await pushText('你的代码运行成功了')
    await pause()
    clear()
    await pushText('你便在编写HC机器人的道路上走的越来越远，而且有的时候还用机器人伸张正义')
    await pause()
    clear()
    await pushText('某天，你在 ?your-channel 发现一个叫 detele 的人正在辱骂ee。毕竟ee给了你动力，所以你决定搞点事情')
    await pushText('你给 ZhangBot 加上了“夺命连环Call”功能（俗称刷屏），然后使用刷屏这种方式轰炸detele')
    await pushText('不久，你就编写了 ZhangKiller 用来进行刷屏打击用户')
    await pause()
    clear()
    await pushText('一个月后，一个叫做 XBot 的机器人把你引到了 XChat')
    await pushText('你就开始为 XChat 卖命，你给 XChat 写了不少机器人和服务器后端代码。')
    await pause()
    clear()
    await pushText('好景不长。2022年中下旬，由于识别码经济的问题，yc的那群朋友和XC闹掰了。但是由于你为XC付出的太多太多，你离不开XC，因此你选择留在XC。这也增加了你和老朋友们的隔阂。')
    await pushText('你很郁闷')
    await pause('重头戏要来了，单击网页以继续')
    await pushText('12月，fish表示要重写XC，你便接下了这份艰巨的工作')
    await pushText('12月中下旬，你发现fish想要抛弃HC框架。你感到很苦闷')
    await pushText('2023年1月，你把新XC交给了fish，但他除了祝贺你以外就什么都没做')
    await pushText('在你的再三催促下，fish才简单地部署了新XC，然后就什么也没做')
    await pushText('你很生气')
    await pause('前方高能！！！单击网页以继续！！！！！！')
    await pause('不久，你意识到自己成了fish的工具，之前朋友们和你说的都是对的，你确实成了“鱼鱼之吠”')
    await pushText('你为了报复fish，把自己手里的那份新XC改成了小张聊天室')
    await pause('高潮！单击网页以继续！！')
    await pushText('春节期间，一个叫做23的用户来到XC疯狂引战，到处说自己要给HC“测压”，你很愤怒，便禁言了23。')
    await pushText('不久，fish给了23免死金牌，言外之意就是支持23为HC“测压”')
    await pushText('你看透了真相，便以这件事情为由，和XC决裂，回到HC')
    await pause()
    await pushText('fish在微信上假意关心小张软件的发展，问你为什么要离开XC')
    await pushText('你说是因为情怀问题')
    await pushText('但是眼中只有利益的金钱鱼又怎么能理解友谊和情怀呢？')
    await pushText('fish抛弃了你')
    await pause()
    clear()
    await pushText('你吸取了XC早期引流的问题，便只在HC发了一遍小张聊天室的链接（这不知道是第几次建立小张聊天室了），也不抱希望。')
    await pushText('没想到却引来了ee到ZHC挂机。同时你来自XC真爱粉们也去了。')
    await pushText('你很感动')
    await pushText('不久，ZHC便赢得了小小的成功，你非常欣慰。')
    await pause()
    clear()
    await pushText('时光飞逝，日月如梭。很快就到了 2023-3-7 了，距离你的生日还有7天。')
    await pushText('你在ZHC发了这个消息。')
    await pushText('第二天，ee给你发了张图片。')
    await pushText('<img src="important/DSC01959.jpg"></img>')
    getMainContent().lastChild.innerHTML = '<img src="important/DSC01959.jpg"></img>'
    await pushText('这是你在网上第一次收到礼物，你被她感动了')
    await pause()
    clear()
    await pushText('这个游戏由 MrZhang365 制作，目的是纪念他入驻HC一周年，同时提前庆祝自己的生日，以及...')
    await pushText('鸣谢以下用户：')
    await pushText('纸片君ee https://paperee.guru/')
    await pushText('B站的J')
    await pushText('MelonCmd http://cmd1152.ysepan.com/')
    await pushText('a')
    await pushText('感谢以上用户为我提供了技术以及精神上的支持！如果没有他们，我也许就不能走到现在了！')
    await pushText('注：排名不分先后')
    await pause()
    clear()
    await pushText('Game Over')
    await pushText('这个结局很美好，不是吗？')
    await pause('单击网页退出游戏')
    window.close()
    return
}

*/

async function main() {
    loadZhangGameFile('game/1.zhang-game')
}

init()
main()    // 正式开始执行脚本
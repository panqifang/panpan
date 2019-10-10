/**
 * 判断是否是微信浏览器, returning a boolean.
 *
 * @param  int  null       The URL we want to request
 * @return boolean       An object containing either "data" or "err"
 */
export const isWeiXin = function () {
    var ua = window.navigator.userAgent.toLowerCase()
    /* eslint-disable */
    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
        return true
    } else {
        return false
    }
}

/**
 *
 * @desc   判断`obj`是否为空
 * @param  {Object} obj
 * @return {Boolean}
 */

export const isEmptyObject = function (obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return false
    }
    return !Object.keys(obj).length
}

/**
 *
 * @desc   判断是否为邮箱地址
 * @param  {String}  str
 * @return {Boolean}
 */
export const isEmail = function (str) {
    return /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(str)
}

/**
 *
 * @desc  判断是否为身份证号
 * @param  {String|Number} str
 * @return {Boolean}
 */
export const isIdCard = function (str) {
    return /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/.test(str)
}

/**
 *
 * @desc   判断是否为手机号
 * @param  {String|Number} str
 * @return {Boolean}
 */
export const isPhoneNum = function (str) {
    return /^(0|86|17951)?(13[0-9]|15[012356789]|16[0-9]|17[0-9]|18[0-9]|19[0-9]|14[57])[0-9]{8}$/.test(str)
}

/**
 * 时间格式化, returning a staring.
 *
 * @param  {number} date       The URL we want to request
 * @return {string}           An object containing either "data" or "err"
 */
export const formatTime = function (date) {
    typeof date === 'number' && (date = new Date(date * 1000))
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()
    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

/**
 * 时间格式化, returning a staring.
 *
 * @param  {number} date       The URL we want to request
 * @return {string}           An object containing either "data" or "err"
 */
export const formatTimeTs = function (date) {
    typeof date === 'number' && (date = new Date(date * 1000))
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()
    return [month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

/**
 * 日期格式化, returning a staring.
 *
 * @param  {number} date       The URL we want to request
 * @return {string}           An object containing either "data" or "err"
 */
export const formatDate = function (date) {
    typeof date === 'number' && (date = new Date(date * 1000))
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    return [year, month, day].map(formatNumber).join('-')
}

/**
 * 数字格式化, returning a staring.
 *
 * @param  {int} n       The URL we want to request
 * @return {int}           An object containing either "data" or "err"
 */
const formatNumber = function (n) {
    n = n.toString()
    return n[1] ? n : '0' + n
}

/**
 * 四舍五入格式化，取两位小数点, returning a staring.
 *
 * @param  {int} cash      The URL we want to request
 * @return {int}           An object containing either "data" or "err"
 */
export const formatMoney = function (cash) {
    if (typeof cash === 'number') {
        return cash.toFixed(2)
    } else {
        return cash
    }
}

/**
 *
 * @desc 随机生成颜色
 * @return {String}
 */
export const randomColor = function () {
    return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6)
}

/**
 *
 * @desc 生成指定范围随机数
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
export const randomNum = function (min, max) {
    return Math.floor(min + Math.random() * (max - min))
}

/**
 *
 * @desc   url参数转对象
 * @param  {String} url  default: window.location.href
 * @return {Object}
 */
export const parseQueryString = function (url) {
    url = url == null ? window.location.href : url
    var search = url.substring(url.lastIndexOf('?') + 1)
    if (!search) {
        return {}
    }
    return JSON.parse('{"' + decodeURIComponent(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
}

/**
 *
 * @desc   对象序列化
 * @param  {Object} obj
 * @return {String}
 */
export const stringfyQueryString = function (obj) {
    if (!obj) return ''
    var pairs = []
    for (var key in obj) {
        var value = obj[key]
        if (value instanceof Array) {
            for (var i = 0; i < value.length; ++i) {
                pairs.push(encodeURIComponent(key + '[' + i + ']') + '=' + encodeURIComponent(value[i]))
            }
            continue
        }
        pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
    }
    return pairs.join('&')
}

/**
 *
 * @desc   判断是否钱数量
 * @param  {String|Number} str
 * @return {Boolean}
 */
export const isMoneyNum = function (str) {
    let reg = new RegExp('[1-9]([0-9]+)?(\\.[0-9]?[1-9]?)?|0\\.([0-9]?[1-9]?)?|0')
    let res = str.match(reg)
    if (res) {
        return parseFloat(res[0])
    }
    return 0
}

/**
 * @desc   格式化小数，取三位，不做四舍五入
 *
 * @param  {float}  oneNum
 * @return {Boolean}
 */
export const getFloatThree = function (num) {
    return Math.floor(num * 1000) / 1000
}

/**
 * @desc   比较第一个浮点数是否大于第二个 (仅支持 0.001格式)
 *
 * @param  {float} oneNum
 * @return {Boolean}
 */
export const checkTwoFloat = function (oneNum, twoNum) {
    let n = 1000
    return parseFloat(oneNum * n) > parseFloat(twoNum * n)
}

/**
 * @desc  数组去重
 *
 * @param  {arr} arr
 * @return {arr}
 */
export const unique = function (arr) {
    let res = [];
    let json = {};
    for (let i = 0; i < arr.length; i++) {
        if (!json[arr[i]]) {
            res.push(arr[i]);
            json[arr[i]] = 1;
        }
    }
    return res;
}

/**
 * @desc  js 两位 进一位
 *
 * @param  {arr} arr
 * @return {arr}
 */
export const toCeil = function (num) {
    return toTwoNum(Math.ceil(num * 100) / 100)
};

/**
 * @desc  js 两位 进一位
 *
 * @param  {arr} arr
 * @return {arr}
 */
export const toTwoNum = function (num) {
    return Number(num.toString().match(/^\d+(?:\.\d{0,2})?/))
};

import config from '../config'

// 定于服务器地址
const HOST = config.host
// 定义小程序hash
const HASH = config.hash

// 检查请求是否200
function checkStatus(response) {
    if (response.statusCode === 200) {
        return returnJson(response)
    } else {
        wx.showModal({
            title: '提示',
            content: '网络请求失败，请检查网络并重试',
            showCancel: false
        })
    }
}

// 返回数据
function returnJson(response) {
    if (!response.data.success && response.data.code == 10) {
        wx.clearStorageSync()
    }
    return response.data
}

/**
 * get 请求
 *
 * @param  {string} url       请求路径
 * @param  {object} options   请求参数，对象形式
 * @return {object}           返回结果，返回一个promise对象
 */

export const requestGet = function (to, params = {}) {
    return new Promise((resolve) => {
        const url = HOST + to
        const data = Object.assign(params, { hash: HASH })
        const header = { 'content-type': 'application/json' }
        const method = 'GET'
        const success = (res) => resolve(checkStatus(res))
        wx.request({ url, data, header, method, success })
    })
}

/**
 * post 请求
 *
 * @param  {string} url       请求路径
 * @param  {object} options   请求参数，对象形式
 * @return {object}           返回结果，返回一个promise对象
 */

export const requestPOST = function (to, params = {}) {
    return new Promise((resolve) => {
        const url = HOST + to
        const data = Object.assign(params, { hash: HASH })
        const header = { 'content-type': 'application/x-www-form-urlencoded' }
        const method = 'POST'
        const success = (res) => resolve(checkStatus(res))
        wx.request({ url, data, header, method, success })
    })
}

/**
 * put 请求
 *
 * @param  {string} url       请求路径
 * @param  {object} options   请求参数，对象形式
 * @return {object}           返回结果，返回一个promise对象
 */

export const requestPut = function (to, params = {}) {
    return new Promise((resolve) => {
        const url = HOST + to
        const data = Object.assign(params, { hash: HASH })
        const header = { 'content-type': 'application/x-www-form-urlencoded' }
        const method = 'PUT'
        const success = (res) => resolve(checkStatus(res))
        wx.request({ url, data, header, method, success })
    })
}

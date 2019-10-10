
import { isEmptyObject } from './assets/utils/func'
import { requestGet, requestPOST } from './assets/utils/request'
import modules from './assets/modules'
import config from './assets/config'

App(Object.assign(modules, {
    onLaunch: function () {
        console.log(config.host)
    },
    globalData: {
    },
    hash: config.hash,
    // 获取小程序信息
    appInfo: function () {
        const self = this
        // 全局小程序信息
        return new Promise((resolve) => {
            if (self.globalData.appInfo) {
                resolve(self.globalData.appInfo)
            } else {
                requestGet('/applets').then(({ success, data, msg }) => {
                    if (success) {
                        self.globalData.appInfo = data
                        resolve(data)
                    }
                })
            }
        })
    },
    // 静默登陆,获取session
    login: function (params) {
        const self = this
        return new Promise((resolve) => {
            const sessionInfo = wx.getStorageSync('session')
            if (sessionInfo && self.checkSessionTime(sessionInfo)) {
                resolve(sessionInfo.sid)
            } else {
                wx.login({
                    success: function (res) {
                        if (res.code) {
                            requestPOST('/users/login', { code: res.code }).then(({ success, data, msg }) => {
                                if (success && !isEmptyObject(data)) {
                                    wx.setStorageSync('session', data)
                                    resolve(data.sid)
                                } else {
                                    wx.showModal({
                                        title: '提示',
                                        content: '登陆失败，请检查网络配置',
                                        showCancel: false
                                    })
                                }
                            })
                        }
                    }
                })
            }
        })
    },
    // 校验session是否过期
    checkSessionTime: function (session) {
        let currentTime = Date.parse(new Date()) / 1000
        if (currentTime < parseInt(session.expireTime)) {
            return true
        }
        return false
    },
    // 获取用户信息
    getMemberInfo: function () {
        const self = this
        return new Promise((resolve) => {
            self.login().then(sid => {
                const memberInfo = wx.getStorageSync('memberinfo')
                if (memberInfo) {
                    resolve(memberInfo)
                } else {
                    requestGet('/users', { sid }).then(({ success, data, msg }) => {
                        if (success) {
                            wx.setStorageSync('memberinfo', data)
                            resolve(data)
                        } else {
                            wx.showModal({
                                title: '提示',
                                content: msg,
                                showCancel: false
                            })
                        }
                    })
                }
            })
        })
    },
    // 处理店铺码
    getScanShopQr: function (url) {
        // 获取hash 去掉空格
        const hash = config.hash.replace(/\s+/g, "")
        const host = config.hostUrl.replace(/\s+/g, "")
        // 判断是否是当前小程序的店铺码
        if (url.indexOf(hash) >= 0) {
            const urlHost = url.split(hash)[0]
            // 判断是否同一个域名
            if (1||urlHost.indexOf(host) >= 0) {
                const code = url.split(hash)[1].replace('/', '')
                return code.replace('/', '')
            } else {
                wx.showModal({
                    title: '扫码失败',
                    content: '该店铺码不是在' + host + '后台的店铺码',
                    showCancel: false
                })
                return false
            }
        } else {
            wx.showModal({
                title: '扫码失败',
                content: '扫错其他小程序的二维码',
                showCancel: false
            })
            return false
        }
    },
    // 处理扫招聘合伙人二维码
    getScanPartner: function (to) {
        const url = decodeURIComponent(to)
        // 定于新招聘合伙人页面
        let page = '/pages/createpartner/index?uid='
        let arr = url.split('?')
        // 获取码中合伙人uid
        if (arr[1].indexOf('#')) {
            let paramArr = arr[1].split('#')
            wx.navigateTo({ url: page + paramArr[1] })
        }
    }
}))
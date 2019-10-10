
import config from '../../assets/config'
import { requestPOST } from '../../assets/utils/request'
const { login, appInfo } = getApp()

Page({
    data: {
        appInfo: {},
        canIUse: wx.canIUse('button.open-type.getUserInfo')
    },
    onLoad: function (options) {
    },
    onShow: function () {
        const self = this
        // 获取中心数据
        login().then(sid => {
            self.sid = sid
            appInfo().then(info => {
                info.logo = config.host + info.url
                self.setData({ appInfo: info })
            })
        })
    },
    getPhoneNumber: function (e) {
        console.log(e.detail)
    },
    wxlogin: function (info) {
        const self = this
        const data = info.detail
        wx.showLoading({
            title: '授权登陆中',
            mask: true
        })
        // 执行后台数据更新
        requestPOST('/users/update', { sid: self.sid, iv: data.iv, encryptedData: data.encryptedData }).then(({ success, data, msg }) => {
            wx.hideLoading()
            if (success) {
                // 更新缓存
                let memberInfo = wx.getStorageSync('memberinfo')
                if (memberInfo) {
                    memberInfo.user.avatar = data.avatarUrl
                    memberInfo.user.nickname = data.nickName
                    console.log(memberInfo)
                    wx.setStorageSync('memberinfo', memberInfo)
                }
                // 更新成功返回用户中心
                wx.navigateBack({
                    delta: 1
                })
            } else {
                wx.showModal({
                    title: '提示',
                    content: msg,
                    showCancel: false,
                    success: function (res) {
                        if (res.confirm) {
                            // 清除缓存
                            wx.clearStorageSync()
                            self.onShow()
                        }
                    }
                })
            }
        })
    }
})

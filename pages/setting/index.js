import { requestPOST } from '../../assets/utils/request'
const { getMemberInfo } = getApp()

Page({
    data: {
        user: {},
        money: 0
    },
    onLoad: function (options) {
        this.options = options
    },
    onShow: function () {
        const self = this
        wx.removeStorageSync('memberinfo')
        getMemberInfo().then(res => {
            wx.stopPullDownRefresh()
            // 获取登陆sid
            self.sid = wx.getStorageSync('session').sid
            self.data.user = res.user
            self.data.num = res.num
            self.data.role = res.user.role
            if (res.user.role > 20) {
                self.data.money = res.agent.moneyout
            } else {
                self.data.money = res.user.cash
            }
            // 渲染数据
            self.setData(self.data)
        })
    },
    clearCache: function () {
        const self = this
        wx.showModal({
            title: '提示',
            content: '确认清楚本地缓存？',
            success: function (res) {
                if (res.confirm) {
                    wx.removeStorage({
                        key: 'memberinfo',
                        success: function (res) {
                            self.onShow()
                            wx.showToast({
                                title: '清除成功',
                                icon: 'success',
                                duration: 2000
                            })
                        }
                    })
                }
            }
        })
    },
    updateAvatar: function (info) {
        const self = this
        const data = info.detail
        wx.showModal({
            title: '提示',
            content: '因为微信的头像缓存机制，如果未更新，请24小时后重新更新',
            confirmText: '更新',
            success: function (res) {
                if (res.confirm) {
                    wx.showLoading({
                        title: '更新中...',
                        mask: true
                    })
                    // 执行后台数据更新
                    requestPOST('/users/update', { sid: self.sid, iv: data.iv, encryptedData: data.encryptedData }).then(({ success, data, msg }) => {
                        wx.hideLoading()
                        if (success) {
                            // 更新缓存
                            wx.removeStorage({
                                key: 'memberinfo',
                                success: function (res) {
                                    self.onShow()
                                    wx.showToast({
                                        title: '更新成功',
                                        icon: 'success',
                                        duration: 2000
                                    })
                                }
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
            }
        })
    }
})

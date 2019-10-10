
import { requestGet } from '../../assets/utils/request'

const { login } = getApp()

Page({
    data: {
        showHB: false,
        money: 0
    },
    onLoad: function (options) {
        this.options = options
    },
    onShow: function () {
        const self = this
        if (self.options.switcher == 4 || self.options.switcher == 12) {
            login().then(sid => {
                requestGet('/orders/pay-last-order', { sid: sid }).then(({ success, data, msg }) => {
                    if (success) {
                        const money = Math.floor(data.intelligenceBackMoney * 100) / 100
                        self.setData({ money: money, showHB: true })
                    }
                })
            })
        }
    },
    backHome: function () {
        wx.reLaunch({
            url: '/pages/home/home',
        })
    },
    close: function () {
        this.setData({ showHB: false })
    }
})
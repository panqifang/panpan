
import { formatTime } from '../../assets/utils/func'
import { requestGet } from '../../assets/utils/request'
const { login } = getApp()

Page({
    data: {
        orders: [],
        load: false,
        nodata: false,
        more: false,
        init: false,
        // 0 绑定， 1 可提现，2 未绑定
        listType: 0
    },
    onLoad: function (options) {
        const self = this
        // 加载中
        if (options.t) {
            self.data.listType = options.t
        }
        self.setData({ load: true, orders: [], listType: self.data.listType })
    },
    onShow: function () {
        const self = this
        login().then(sid => {
            self.sid = sid
            requestGet('/agents/qr-code', { page: 1, size: 10, sid: self.sid, type: self.data.listType  }).then(({ success, data, msg }) => {
                wx.stopPullDownRefresh()
                self.setData({ load: false })
                if (success) {
                    self.nextPage = data.nextPage
                    self.canMore = true
                    let list = data.list
                    if (list.length > 0) {
                        list.forEach((item, i) => {
                            item.create_time = formatTime(item.create_time)
                        })
                        self.setData({ nodata: false, orders: list, init: true })
                    } else {
                        self.setData({ nodata: true })
                    }
                } else {
                    wx.showModal({
                        title: '提示',
                        content: msg,
                        showCancel: false
                    })
                }
            })
        })
    },
    onPullDownRefresh: function () {
        const self = this
        self.onShow()
    },

    onReachBottom: function () {
        const self = this
        if (self.canMore && self.nextPage && self.nextPage !== 0) {
            self.setData({ more: true })
            self.canMore = false
            requestGet('/agents/qr-code', { page: self.nextPage, size: 6, sid: self.sid, type: self.data.listType }).then(({ success, data, msg }) => {
                self.setData({ more: false })
                if (success) {
                    self.nextPage = data.nextPage
                    let list = data.list
                    if (list.length > 0) {
                        list.forEach((item, i) => {
                            item.create_time = formatTime(item.create_time)
                            self.data.orders.push(item)
                        })
                        self.setData({ orders: self.data.orders })
                        self.canMore = true
                    }
                } else {
                    wx.showModal({
                        title: '提示',
                        content: msg,
                        showCancel: false
                    })
                }
            })
        }
    },
    // 查看店铺二维码
    showShopCode: function (e) {
        const shop = e.currentTarget.dataset.shop
        if (shop.code_imgurl) {
            wx.previewImage({
                urls: [shop.code_imgurl]
            })
        } else {
            wx.showModal({
                title: '提示',
                content: '店铺码不正确，请重试',
                showCancel: false
            })
        }
    },
    // 跳转体现界面
    toCashOut: function (e) {
        const shop = e.currentTarget.dataset.shop
        if (shop.shopid) {
            wx.navigateTo({
                url: '/pages/cashout/index?shopid=' + shop.shopid
            })
        } else {
            wx.showModal({
                title: '提示',
                content: '店铺不正确，请重试',
                showCancel: false
            })
        }
    }
})

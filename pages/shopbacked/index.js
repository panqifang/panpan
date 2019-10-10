
import { formatTime } from '../../assets/utils/func'
import { requestGet } from '../../assets/utils/request'
const { login } = getApp()

Page({
    data: {
        orders: [],
        load: false,
        nodata: false,
        more: false,
        init: false
    },
    onLoad: function (options) {
        const self = this
        self.shopid = 0
        if (options.shopid) {
            self.shopid = options.shopid
        }
        // 加载中
        self.setData({ load: true, orders: [] })
    },
    onShow: function () {
        const self = this
        login().then(sid => {
            self.sid = sid
            requestGet('/merchant/winners', { page: 1, size: 10, sid: self.sid, shopid: self.shopid }).then(({ success, data, msg }) => {
                wx.stopPullDownRefresh()
                self.setData({ load: false })
                if (success) {
                    self.nextPage = data.nextPage
                    self.canMore = true
                    let list = data.list
                    if (list.length > 0) {
                        list.forEach((item, i) => {
                            if (!item.nickname) {
                                item.nickname = '未允许获取昵称'
                            }
                            item.create_time = formatTime(item.create_time)
                        })
                        self.setData({ nodata: false, orders: list })
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
            requestGet('/merchant/winners', { page: self.nextPage, size: 6, sid: self.sid, shopid: self.shopid }).then(({ success, data, msg }) => {
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
    }
})

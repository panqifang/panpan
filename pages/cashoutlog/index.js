
import { formatTime } from '../../assets/utils/func'
import { requestGet } from '../../assets/utils/request'
const { login } = getApp()

Page({
    data: {
        orders: [],
        load: false,
        nodata: false,
        more: false
    },
    onLoad: function (options) {
        const self = this
        // 加载中
        self.setData({ load: true, orders: [] })
    },
    onShow: function () {
        const self = this
        login().then(sid => {
            self.sid = sid
            requestGet('/orders/arrived-list', { page: 1, size: 10, sid: self.sid }).then(({ success, data, msg }) => {
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
    // 获取列表数据
    getList: function (page) {
        const self = this

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
            requestGet('/orders/arrived-list', { page: self.nextPage, size: 6, sid: self.sid }).then(({ success, data, msg }) => {
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


import { formatTim, formatDate } from '../../assets/utils/func'
import { requestGet } from '../../assets/utils/request'
const { login } = getApp()

Page({
    data: {
        orders: [],
        load: false,
        nodata: false,
        more: false,
        init: false,
        money: 0,
        startTime: '',
        endTime: ''
    },
    onLoad: function (options) {
        const self = this
        if (options.balance) {
            self.data.momey = options.balance
        }
        // 获取当前日期
        var thisDate = new Date()
        // 获取当前日期作为结束日期
        var endDate = formatDate(thisDate)
            // 初始化可查询的时间段
        // 加载中
        self.setData({ load: true, orders: [], money: self.data.momey, endTime: endDate, startTime: endDate })
    },
    onShow: function () {
        const self = this
        login().then(sid => {
            self.sid = sid
            self.setData({ orders: [] })
            self.getDateData()
        })
    },
    getDateData: function () {
        const self = this
        requestGet('/orders/my-balance-simple', { page: 1, size: 10, sid: self.sid, startTime: self.data.startTime }).then(({ success, data, msg }) => {
            wx.hideLoading()
            wx.stopPullDownRefresh()
            self.setData({ load: false })
            if (success) {
                self.nextPage = data.nextPage
                self.canMore = true
                let list = data.list
                if (list.length > 0) {
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
            requestGet('/orders/my-balance-simple', { page: self.nextPage, size: 6, sid: self.sid, startTime: self.data.startTime }).then(({ success, data, msg }) => {
                self.setData({ more: false })
                if (success) {
                    self.nextPage = data.nextPage
                    let list = data.list
                    if (list.length > 0) {
                        list.forEach((item, i) => {
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

    selectDate: function (e) {
        const self = this
        const date = e.detail.value
        self.setData({ orders: [], startTime: date })
        wx.showLoading({
            title: '获取数据中',
            mask: true
        })
        self.getDateData()
    }
})

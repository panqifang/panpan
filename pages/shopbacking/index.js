
import { formatTime } from '../../assets/utils/func'
import { requestGet } from '../../assets/utils/request'
const { getMemberInfo, login } = getApp()

Page({
    data: {
        orders: [],
        load: false,
        nodata: false,
        more: false,
        init: false,
        role: 10
    },
    onLoad: function (options) {
        const self = this
        self.options = options
        // 加载中
        self.setData({ load: true, orders: [] })
    },
    onShow: function () {
        const self = this
        if (self.options.shopid) {
            login().then(sid => {
                self.sid = sid
                self.shopid = self.options.shopid
                self.getInfo(self.shopid)
            })
        } else {
            getMemberInfo().then(memberinfo => {
                self.sid = wx.getStorageSync('session').sid
                if (memberinfo.shop) {
                    self.shopid = memberinfo.shop.shopid
                    self.role = memberinfo.user.role
                    self.getInfo(self.shopid)
                }
            })
        }
    },
    getInfo: function (shopid) {
        const self = this
        let params = { page: 1, size: 10, sid: self.sid, shopId: shopid }
        if (self.role == 20) {
            params.orderby = 'desc'
        }
        requestGet('/merchant/my-order', params).then(({ success, data, msg }) => {
            wx.stopPullDownRefresh()
            self.setData({ load: false })
            if (success) {
                self.nextPage = data.nextPage
                self.canMore = true
                let list = data.list
                if (list.length > 0) {
                    list.forEach((item, i) => {
                        if (item.switcher == 4 || item.switcher == 12) {
                            item.realMoney = Math.floor(item.intelligenceBackMoney * 100) / 100
                        } else {
                            item.realMoney = item.money
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
            let params = { page: self.nextPage, size: 10, sid: self.sid, shopId: self.shopid }
            if (self.role == 20) {
                params.orderby = 'desc'
            }
            requestGet('/merchant/my-order', params).then(({ success, data, msg }) => {
                self.setData({ more: false })
                if (success) {
                    self.nextPage = data.nextPage
                    let list = data.list
                    if (list.length > 0) {
                        list.forEach((item, i) => {
                            if (item.switcher == 4 || item.switcher == 12) {
                                item.realMoney = Math.floor(item.intelligenceBackMoney * 100) / 100
                            } else {
                                item.realMoney = item.money
                            }
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

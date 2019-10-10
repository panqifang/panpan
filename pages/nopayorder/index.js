
import { formatTime } from '../../assets/utils/func'
import { requestGet } from '../../assets/utils/request'
const { login } = getApp()

Page({
    data: {
        orders: [],
        load: false,
        nodata: false,
        init: false
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
            requestGet('/orders/unpay', { page: 1, size: 10, sid: self.sid }).then(({ success, data, msg }) => {
                wx.stopPullDownRefresh()
                self.setData({ load: false })
                if (success) {
                    let list = data
                    if (list.length > 0) {
                        list.forEach((item, i) => {
                            item.create_time = formatTime(item.create_time)
                        })
                        self.setData({ nodata: false, orders: list })
                    } else {
                        self.setData({ nodata: true })
                    }
                } else {
                    if (!msg) {
                        msg = '暂时没有数据'
                    }
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
    cannelOrder: function (e) {
        const self = this
        const item = e.currentTarget.dataset.order
        wx.showModal({
            title: '提示',
            content: '取消订单后将会退回所用的余额',
            success: function (res) {
                if (res.confirm) {
                    wx.showLoading({
                        title: '正在取消中...',
                        mask: true
                    })
                    requestGet('/orders/cancel', { sid: self.sid, orderid: item.orderid }).then(({ success, data, msg }) => {
                        wx.hideLoading()
                        if (success) {
                            setTimeout(() => {
                                wx.showToast({
                                    title: '取消成功',
                                    icon: 'success',
                                    duration: 2000,
                                    success: () => {
                                        self.expectOrder(item.orderid)
                                    }
                                })
                            }, 100)
                        } else {
                            if (!msg) {
                                msg = '取消失败，请重试'
                            }
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
    },
    expectOrder: function (orderid) {
        const self = this
        if (self.data.orders.length > 0) {
            const list = []
            self.data.orders.forEach((item, i) => {
                if (item.orderid != orderid) {
                    list.push(item)
                }
            })
            self.setData({ nodata: false, orders: list })
        } else {
            self.setData({ nodata: true })
        }
    }
})

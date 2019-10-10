
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
            requestGet('/users/recommended-awards', { sid: self.sid }).then(({ success, data, msg }) => {
                wx.stopPullDownRefresh()
                self.setData({ load: false })
                if (success) {
                    let list = data
                    if (list.length > 0) {
                        list.forEach((item, i) => {
                            if (item.create_time) {
                                item.create_time = formatTime(item.create_time)
                            }
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
    }
})

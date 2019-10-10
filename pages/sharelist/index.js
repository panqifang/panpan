import {
    requestGet
} from '../../assets/utils/request'
import {
    formatTime,
    formatTimeTs,
    formatDate
} from '../../assets/utils/func'

const {
    getMemberInfo
} = getApp()

Page({
    data: {
        list: [],
        nodata: false
    },
    onLoad: function (options) {
        // options.shopid = 121
        this.options = options
    },

    onShow: function () {
        const self = this
        wx.showLoading({
            title: '获取数据中',
            mask: true
        })
        getMemberInfo().then(res => {
            self.sid = wx.getStorageSync('session').sid
            const shopid = parseInt(self.options.shopid);
            requestGet('/users/get-bind-user', { sid: self.sid, shopid: shopid }).then(res => {
                console.log(res)
                wx.hideLoading();
                let list = []
                if (res.data.length > 0) {
                    res.data.forEach((item, i) => {
                        console.log(item)
                        item.nickname = item.nickname.substring(0, 4)
                        if (item.create_time) {
                            item.create_time = formatTime(item.create_time)
                        }
                        if (!item.money) {
                            item.money = 0
                        }
                        list.push(item)
                    })
                }
                if (list.length > 0) {
                    self.data.nodata = false
                } else {
                    self.data.nodata = true
                }
                self.setData({ list: list, nodata: self.data.nodata })
            })
        })
    }
})
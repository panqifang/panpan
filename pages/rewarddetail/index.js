import { requestGet } from '../../assets/utils/request'
import { formatTime, formatDate } from '../../assets/utils/func'
import config from '../../assets/config'
const { getMemberInfo, hash } = getApp()

Page({

    data: {
        info: {}
    },
    onLoad: function (options) {
        if (options.orderid) {
            this.orderid = options.orderid
        }
    },
    onShow: function () {
        const self = this;
        getMemberInfo().then(info => {
            self.sid = wx.getStorageSync('session').sid
            requestGet('/orders/reward-detail', { sid: self.sid, orderid: self.orderid }).then(res => {
                if (res.success) {
                    let data = res.data
                    data.forEach((item, i) => {
                        item.create_time = formatTime(item.create_time)
                    })
                    self.setData({ info: data })
                }
            })
        })
        
    }
})
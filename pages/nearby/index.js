
import { requestGet } from '../../assets/utils/request'
import config from '../../assets/config'
const { login } = getApp()

Page({
    data: {
        shops: [],
        load: false,
        init: false,
        nodata: false
    },
    onLoad: function (options) {
        this.options = options
        if (options.latitude && options.longitude) {
            // 获取列表
            this.setData({ load: true, shops: [] })
            this.getQrList(options)
        }
    },
    getQrList: function (gps) {
        const self = this
        // 获取商户信息：
        requestGet('/shops/nearby', { lat: gps.latitude, lng: gps.longitude }).then(({ success, data, msg }) => {
            self.setData({ load: false })
            if (success) {
                if (data.length > 0) {
                    data.forEach((item, i) => {
                        item.range = self.getDistance(item.lat, item.lng, gps.latitude, gps.longitude)
                        if (item.range >= 1000) {
                            item.range_km = Math.round(item.range / 1000, 1)
                        }
                    })
                    self.setData({ shops: data, init: true })
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
    // 计算距离
    getDistance(lat1, lng1, lat2, lng2) {
        var radLat1 = lat1 * Math.PI / 180.0
        var radLat2 = lat2 * Math.PI / 180.0
        var a = radLat1 - radLat2
        var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
        s = s * 6378137
        s = Math.round(s)
        return s
    }
})
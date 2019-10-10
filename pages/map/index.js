
import { requestGet } from '../../assets/utils/request'
import config from '../../assets/config'
const { getScanShopQr, getScanPartner, getMemberInfo, hash } = getApp()

Page({
    data: {
        latitude: 22.6355320,
        longitude: 114.1807630,
        markers: [],
        controls: [],
        regionchange: 1,
        role: 10
    },
    onLoad: function (options) {
        this.options = options
    },
    onReady: function () {
        const self = this
        wx.getLocation({
            type: 'gcj02',
            success: function (res) {
                self.setData({
                    latitude: res.latitude,
                    longitude: res.longitude,
                })
                // 获取列表
                getMemberInfo().then(info => {
                    self.setData({ role: info.user.role })
                    self.getQrList(res)
                })
            }
        })
        const getControls = self.getControls()
        self.setData({ controls: getControls })
        this.mapCtx = wx.createMapContext('map')
        this.mapCtx.moveToLocation()
    },
    regionchange: function () {
        var that = this
        that.data.regionchange++
        setTimeout(function () {
            that.data.regionchange--
            if (that.data.regionchange == 1) {
                that.mapCtx.getCenterLocation({
                    success: function (res) {
                        if (that.data.latitude == res.latitude) {
                            return
                        }
                        var distance = that.getDistance(that.data.latitude, that.data.longitude, res.latitude, res.longitude)
                        if (distance > 2000) {
                            that.data.latitude = res.latitude
                            that.data.longitude = res.longitude
                            // 刷新列表
                            that.getQrList(res)
                        }
                    }
                })
            }
        }, 200)
    },
    getControls: function () {
        const systemInfo = wx.getSystemInfoSync()
        return [{
            id: 1,
            iconPath: '/assets/images/mapgoto.png',
            position: {
                left: 10,
                top: 10,
                width: 50,
                height: 50
            },
            clickable: true
        },
        {
            id: 2,
            iconPath: '/assets/images/mapscan.png',
            position: {
                left: systemInfo.windowWidth / 2 - 51,
                top: 10,
                width: 102,
                height: 40
            },
            clickable: true
        },
        {
            id: 3,
            iconPath: '/assets/images/mapshop.png',
            position: {
                left: systemInfo.windowWidth - 55,
                top: 10,
                width: 50,
                height: 50
            },
            clickable: true
        },
        {
            iconPath: '/assets/images/location.png',
            position: {
                left: systemInfo.windowWidth / 2 - 5,
                top: systemInfo.windowHeight / 2 - 22,
                width: 10,
                height: 22
            }
        }]
    },
    getQrList: function (gps) {
        const self = this
        // 获取商户信息：
        requestGet('/shops/nearby', { lat: gps.latitude, lng: gps.longitude }).then(({ success, data, msg }) => {
            if (success) {
                let markers = []
                data.forEach((item, i) => {
                    let img = "/assets/images/marker.png"
                    if (hash == '6a60ed12') {
                        img = "/assets/images/marker-" + hash +".png"
                    }
                    let marker = {
                        iconPath: img,
                        id: parseInt(item.shopid),
                        latitude: parseFloat(item.lat),
                        longitude: parseFloat(item.lng),
                        width: 40,
                        height: 47
                    }
                    markers[i] = marker
                })
                self.setData({ markers: markers })
            } else {
                wx.showModal({
                    title: '提示',
                    content: msg,
                    showCancel: false
                })
            }
        })
    },
    // 地图点点击
    markerTap: function (e) {
        wx.navigateTo({
            url: '/pages/shopinfo/index?shopid=' + e.markerId
        })
    },
    // 控件点击
    controlTap: function (res) {
        // 点击定位控件
        if (res.controlId == 1) {
            this.mapCtx.moveToLocation()
            this.regionchange()
        } else if (res.controlId == 2) {
            // 扫码
            wx.scanCode({
                success: (res) => {
                    console.log(res)
                    if (res.path) {
                        const to = decodeURIComponent(res.path)
                        if (to && to.indexOf('pages/share/index') >= 0) {
                            wx.navigateTo({
                                url: '/' + to,
                            })
                        } else {
                            getScanPartner(res.path)
                        }
                        
                    } else {
                        if (getScanShopQr(res.result)) {
                            const code = getScanShopQr(res.result)
                            console.log(code)
                            // 跳到支付页面
                            wx.navigateTo({
                                url: '/pages/scan/index?code=' + code,
                            })
                        }
                    }
                }
            })
            // 查看附近店铺
        } else if (res.controlId == 3) {
            wx.navigateTo({
                url: '/pages/nearby/index?latitude=' + this.data.latitude + '&longitude=' + this.data.longitude 
            })
        }
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
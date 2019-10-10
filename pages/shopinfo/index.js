
import { requestGet } from '../../assets/utils/request'
import config from '../../assets/config'
const { login } = getApp()

Page({
    data: {
        logo: '',
        title: '',
        sort_name: '',
        address: '',
        content: '',
        phone: '',
        lat: 0,
        lng: 0,
        hot: 0,
        shopid: 0
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const self = this
        wx.showLoading({
            title: '数据加载中',
        })
        if (options.shopid) {
            self.data.shopid = parseInt(options.shopid)
        }
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.pageInit()
    },
    pageInit() {
        const self = this
        requestGet('/shops/shop-info', { shopId: self.data.shopid }).then(({ success, data, msg }) => {
            wx.hideLoading()
            if (success) {
                const res = data
                if (typeof res.logo != 'undefined') {
                    self.data.logo = res.logo
                }
                if (typeof res.title != 'undefined') {
                    self.data.title = res.title
                }
                if (typeof res.sort_name != 'undefined') {
                    self.data.sort_name = res.sort_name
                } else {
                    self.data.sort_name = '暂未设置行业分类'
                }
                if (typeof res.address != 'undefined') {
                    self.data.address = res.address
                }
                if (typeof res.content != 'undefined') {
                    self.data.content = res.content
                }
                if (typeof res.phone != 'undefined') {
                    self.data.phone = res.phone
                }
                if (typeof res.lat != 'undefined') {
                    self.data.lat = res.lat
                }
                if (typeof res.lng != 'undefined') {
                    self.data.lng = res.lng
                }
                if (typeof res.pay_times != 'undefined') {
                    self.data.hot = res.pay_times
                }
                self.setData({
                    logo: self.data.logo,
                    title: self.data.title,
                    sort_name: self.data.sort_name,
                    address: self.data.address,
                    content: self.data.content,
                    phone: self.data.phone,
                    lat: self.data.lat,
                    lng: self.data.lng,
                    hot: self.data.hot
                })
            } else {
                wx.showModal({
                    title: '提示',
                    content: msg,
                    showCancel: false
                })
            }  
        })
    },
    goToShop() {
        const self = this
        wx.authorize({
            scope: 'scope.userLocation',
            success() {
                wx.openLocation({
                    latitude: Number(self.data.lat),
                    longitude: Number(self.data.lng),
                    name: "前往：" + self.data.title,
                    address: "联系方式：" + self.data.phone,
                    scale: 18
                })
            }
        })
    },
    callphone(e) {
        var phone = e.currentTarget.dataset.phone
        if (phone) {
            wx.makePhoneCall({
                phoneNumber: phone
            })
        }
    }
})
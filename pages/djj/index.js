
import { formatTime } from '../../assets/utils/func'
import { requestGet } from '../../assets/utils/request'
const { getMemberInfo } = getApp()

var sliderWidth = 96;

Page({
  data: {
    orders: [],
    load: false,
    nodata: false,
    more: false,
    init: false,
    shopid: 0,
    status: 1,
    tabs: ["未使用", "已使用"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0
  },
  onLoad: function (options) {
    const self = this
    wx.getSystemInfo({
      success: function (res) {
        self.setData({
          sliderLeft: (res.windowWidth / self.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / self.data.tabs.length * self.data.activeIndex,
        });
      }
    });
    // 加载中
    self.setData({ load: true, orders: [] })
  },
  tabClick: function (e) {
    if (e.currentTarget.id != this.data.activeIndex) {
      this.setData({
        sliderOffset: e.currentTarget.offsetLeft,
        activeIndex: e.currentTarget.id
      });
      this.data.status = parseInt(e.currentTarget.id) + 1
      this.onShow()
    }
  },
  onShow: function () {
    const self = this
    self.setData({
      orders: [],
      nodata: false
    })
    getMemberInfo().then(info => {
      self.sid = wx.getStorageSync('session').sid
      if (info.user.role == 20 && info.shop) {
        self.data.shopid = info.shop.shopid
        wx.showLoading({
          title: '获取数据中..',
          mask: true
        })
        requestGet('/merchant/voucher-list', { page: 1, size: 10, sid: self.sid, status: self.data.status, shopId: self.data.shopid }).then(({ success, data, msg }) => {
          wx.hideLoading()
          wx.stopPullDownRefresh()
          self.setData({ load: false })
          if (success) {
            self.nextPage = data.nextPage
            self.canMore = true
            let list = data.list
            if (list.length > 0) {
              list.forEach((item, i) => {
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
      requestGet('/merchant/voucher-list', { page: self.nextPage, size: 10, sid: self.sid, status: self.data.status, shopId: self.data.shopid }).then(({ success, data, msg }) => {
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
  }
})

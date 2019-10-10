import {
  formatTime
} from '../../assets/utils/func'
import {
  requestGet
} from '../../assets/utils/request'
import config from '../../assets/config'
const {
  getMemberInfo,
  login
} = getApp()

Page({
  data: {
    orders: [],
    load: false,
    nodata: false,
    more: false,
    init: false,
    role: 10,
    title_length:4,
    latitude: 22.6355320,
    longitude: 114.1807630,
    data:{}
  },
  onLoad: function(options) {
    const self = this
    self.options = options
    // 加载中
    self.setData({
      load: true,
      orders: [],
      orders_near: [],
      tabindex: 0
    })
    this.sid = wx.getStorageSync('session').sid

  },
  onShow: function() {
   
   

    this.getInfo()
    const self = this
    self.data.timer = {}
    self.data.timeStr = {}
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        self.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        })
        // 获取列表
        self.getNearShop(res)
      }
    })

  },
  getInfo: function() {
    const self = this
    let params = {
      num: 5,
      sid: self.sid
    }

    requestGet('/shops/pool-top', params).then(({
      success,
      data,
      msg
    }) => {
      wx.stopPullDownRefresh()
      self.setData({
        load: false
      })
      if (success) {
        self.nextPage = data.nextPage
        self.canMore = true
        let list = data
        if (list.length > 0) {
          list.forEach((item, i) => {
            if (item.front_url) {
              item.front_url = config.host + item.front_url
            }
            if ((item.title.length) > this.data.title_length) {
              item.title = item.title.substring(0, this.data.title_length)
            }

            const nowDate = Date.parse(new Date()) / 1000;
            let endtime = item.cycle ? item.cycle.end_time :0
            let date = endtime - nowDate

            self.countDown(item.shopid, date)

          })
          self.setData({
            nodata: false,
            orders: list
          })
        } else {
          self.setData({
            nodata: true
          })
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
  getNearShop: function(gps) {
    const self = this
    // 获取商户信息：
    requestGet('/shops/nearby', {
      lat: gps.latitude,
      lng: gps.longitude,
      cycle: true
    }).then(({
      success,
      data,
      msg
    }) => {
      if (success) {
        data.forEach((item, i) => {

          if (item.front_url) {
            item.front_url = config.host + item.front_url
          }
          if ((item.title.length) > this.data.title_length) {
            item.title = item.title.substring(0, this.data.title_length)
          }
          const nowDate = Date.parse(new Date()) / 1000;
          let endtime = item.cycle ? item.cycle.end_time : 0
          let date = endtime - nowDate

          self.countDown(item.shopid,date)
        })
        self.setData({
          orders_near: data
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

  onPullDownRefresh: function() {
    const self = this
    self.onShow()
  },

  onReachBottom: function() {
    const self = this
    if (self.canMore && self.nextPage && self.nextPage !== 0) {
      self.setData({
        more: true
      })
      self.canMore = false
      let params = {
        page: self.nextPage,
        size: 10,
        sid: self.sid,
        shopId: self.shopid
      }
      if (self.role == 20) {
        params.orderby = 'desc'
      }
      requestGet('/merchant/my-order', params).then(({
        success,
        data,
        msg
      }) => {
        self.setData({
          more: false
        })
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
            self.setData({
              orders: self.data.orders
            })
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
  changeTab: function(e) {
    const self = this
    const tabindex = e.currentTarget.dataset.index
    if (tabindex != self.data.tabindex) {
      self.setData({
        tabindex: tabindex
      })
    }
  },

  pay: function(e) {
    const shopid = e.currentTarget.dataset.shopid
    if (shopid) {
      wx.navigateTo({
        url: '/pages/scan/index?shopid=' + shopid + '&yxd=1'
      })
    }
  },

  activeCenter: function(e) {
    const shopid = e.currentTarget.dataset.shopid
    wx.setStorageSync('active-shopid', shopid)

    if (shopid) {
      wx.switchTab({

        url: '/pages/home/home'
      })
    }
  },

  goToShop: function(e) {
    const self = this
    const shop = e.currentTarget.dataset.shop
    wx.authorize({
      scope: 'scope.userLocation',
      success() {
        wx.openLocation({
          latitude: Number(shop.lat),
          longitude: Number(shop.lng),
          name: "前往：" + shop.title,
          address: "联系方式：" + shop.phone,
          scale: 18
        })
      }
    })

    return false
  },
  //带天数的倒计时
  countDown: function(shopid, times) {
    const self = this
    self.data.timer[shopid] = setInterval(function() {

      let day = 0,
        hour = 0,
        minute = 0,
        second = 0; //时间默认值
      if (times > 0) {
        hour = Math.floor(times / (60 * 60));
        minute = Math.floor(times / 60) - (day * 24 * 60) - (hour * 60);
        second = Math.floor(times) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60);
      }
      if (hour <= 9) hour = '0' + hour;
      if (minute <= 9) minute = '0' + minute;
      if (second <= 9) second = '0' + second;
      //
      const timeStr = hour + ":" + minute + ":" + second
      let d = {}
      self.data.timeStr[ shopid] = timeStr
      self.setData({ timeStr: self.data.timeStr})
      times--;
    }, 1000);
    if (times <= 0) {
      clearInterval(self.data.timer[shopid]);
      self.setData({
        isend: true
      })
    }
  },

})
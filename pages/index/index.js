import { requestGet } from '../../assets/utils/request'
import { unique, formatTime, isEmptyObject } from '../../assets/utils/func'
import config from '../../assets/config'
const { getScanShopQr, getScanPartner, getMemberInfo, hash } = getApp()

Page({
  data: {
    role: 0,
    // user
    orders: [],
    load: false,
    nodata: false,
    init: false,
    shopid: 0,
    // shop
    more: false,
    orderTotal: 0,
    aname: config.name,
    hash: hash,
    // 红包金额
    money: 0,
    showHB: false,
    // shop
    shop: [],
    orderNum: 0,
    moreText: '点击获取更多',
    twice: false,
    uid: 0,
    logo_url: ''
  },
  onLoad: function (options) {
    const self = this
    if (options.scene) {
      const uidarr = options.scene.split('#')
      wx.redirectTo({
        url: '/pages/createpartner/index?uid=' + uidarr[1]
      })
    }
    // 加载中
    self.setData({ load: true, orders: [] })
  },
  onShow: function () {
    const self = this
    self.setData({ orders: [] })
    self.init()
  },
  init: function () {
    const self = this
    getMemberInfo().then(memberinfo => {
      // wx.navigateTo({
      //     url: '/pages/share/index?scene=2-30-5b768ff0',
      // })
      self.sid = wx.getStorageSync('session').sid
      self.data.uid = memberinfo.user.uid
      self.setData({ role: memberinfo.user.role })
      if (memberinfo.user.role == 10) {
        // 获取红包数据
        // self.showHbFunc()
        // 获取订单数据
        self.userOrder()
      } else if (memberinfo.user.role == 20) {
        self.data.orders = []
        if (memberinfo.shop.shopid) {
          self.data.shopid = memberinfo.shop.shopid
        }
        self.shopOrder()
      } else {
        wx.stopPullDownRefresh()
        self.setData({ nodata: true, load: false })
      }
    })
  },
  onPullDownRefresh: function () {
    const self = this
    self.init()
  },

  // ------------------------------------------ user ----------------------------------
  // 弹出红包
  showHbFunc: function () {
    const self = this
    wx.getStorage({
      key: 'showhb',
      success: function (res) {
        const hbdata = res.data
        self.getHbMoney().then(data => {
          self.data.twice = data.twice
          if (data.intelligenceBackMoney) {
            const money = data.intelligenceBackMoney
            const hbkey = 'orderid'
            if (data.orderid <= hbdata[hbkey]) {
              self.setData({ money: money, showHB: false })
            } else {
              let hbData = {}
              hbData[hbkey] = data.orderid
              wx.setStorageSync('showhb', hbData)
              self.setData({ money: money, showHB: true, twice: self.data.twice })
            }
          } else {
            self.setData({ showHB: false })
          }
          
        })
      },
      fail: function (res) {
        self.getHbMoney().then(data => {
          self.data.twice = data.twice
          if (data.intelligenceBackMoney) {
            let hbData = {}
            const money = data.intelligenceBackMoney
            const hbkey = 'orderid'
            hbData[hbkey] = data.orderid
            wx.setStorageSync('showhb', hbData)
            self.setData({ money: money, showHB: true, twice: self.data.twice })
          } else {
            self.setData({ showHB: false })
          }
        })
      }
    })
  },
  getHbMoney: function () {
    const self = this
    return new Promise((resolve) => {
      requestGet('/orders/pay-last-order', { sid: self.sid }).then(({ success, data, msg }) => {
        if (success) {
          resolve(data)
        }
      })
    })
  },
  // 获取订单
  userOrder: function () {
    const self = this
    requestGet('/orders/consume-group-simple', { sid: self.sid, page: 10, size: 100 }).then(({ success, data, msg }) => {
      wx.stopPullDownRefresh()
      self.setData({ load: false })
      if (success) {
        let list = data.list
        if (list.length > 0) {
          list.forEach((shop, a) => {
            if (shop.title.length > 4) {
              shop.title = shop.title.substring(0, 4)
            }
            if (shop.front_url) {
              shop.logo_url = config.host + shop.front_url
            } else {
              shop.logo_url = ''
            }
          })
          console.log(list)
          self.setData({ nodata: false, init: true, shopid: list[0].shopid, shop: list, logo_url: list[0].logo_url })
          wx.showLoading({
            title: '获取订单中',
            mask: true
          })
          self.orderdata()
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
  // 获取订单数据
  orderdata: function () {
    const self = this
    requestGet('/orders/consume-detail-self-list3', { sid: self.sid, page: 1, size: 10, shopId: self.data.shopid }).then(({ success, data, msg }) => {
      wx.hideLoading()
      if (success) {
        let orders = data.list
        // 装载数据
        self.nextOrderPage = data.nextPage
        // 是否允许继续更多
        if (data.nextPage > 0) {
          self.setData({ moreText: '点击获取更多' })
        } else {
          self.setData({ moreText: '' })
        }
        let result = wx.getStorageSync('orderData') || {}
        orders.forEach((order, a) => {
          if (order.switcher == 4 || order.switcher == 12) {
            if (order.intelligenceBackMoney) {
              // 获取缓存最后一单
              if (!isEmptyObject(result)) {
                const key = order.shopid + '-' + order.orderid
                if (result[key]) {
                  const lastDa = result[key].money
                  const lastNum = lastDa[lastDa.length - 1]
                  if (order.intelligenceBackMoney * 1000 < lastNum * 1000) {
                    order.isdown = true
                  } else if (order.intelligenceBackMoney == lastNum) {
                    order.isdown = !result[key].up
                  } else {
                    order.isdown = false
                  }
                } else {
                  order.isdown = false
                }
              }
              order.realMoney = order.intelligenceBackMoney
            } else {
              order.realMoney = order.money
            }
          } else {
            order.realMoney = order.money
          }
        })
        self.setData({ orders: orders, orderNum: data.total })
        // 缓存数据
        self.saveCache()
      } else {
        wx.showModal({
          title: '提示',
          content: msg,
          showCancel: false
        })
      }
    })
  },
  // 获取更多
  moreOrder: function () {
    const self = this
    if (self.data.moreText == '点击获取更多' && self.nextOrderPage > 0) {
      self.setData({ moreText: '获取中...' })
      requestGet('/orders/consume-detail-self-list3', { sid: self.sid, page: self.nextOrderPage, size: 10, shopId: self.data.shopid }).then(({ success, data, msg }) => {
        wx.hideLoading()
        if (success) {
          let orders = data.list
          // 装载数据
          self.nextOrderPage = data.nextPage
          // 是否允许继续更多
          if (data.nextPage > 0) {
            self.setData({ moreText: '点击获取更多' })
          } else {
            self.setData({ moreText: '' })
          }
          // 获取缓存数据
          let result = wx.getStorageSync('orderData') || {}
          orders.forEach((order, a) => {
            if (order.switcher == 4 || order.switcher == 12) {
              if (order.intelligenceBackMoney) {
                // 获取缓存最后一单
                if (!isEmptyObject(result)) {
                  const key = order.shopid + '-' + order.orderid
                  if (result[key]) {
                    const lastDa = result[key].money
                    const lastNum = lastDa[lastDa.length - 1]
                    if (order.intelligenceBackMoney * 1000 < lastNum * 1000) {
                      order.isdown = true
                    } else if (order.intelligenceBackMoney == lastNum) {
                      order.isdown = !result[key].up
                    } else {
                      order.isdown = false
                    }
                  } else {
                    order.isdown = false
                  }
                }
                order.realMoney = order.intelligenceBackMoney
              } else {
                order.realMoney = order.money
              }
            } else {
              order.realMoney = order.money
            }
            self.data.orders.push(order)
          })
          self.setData({ orders: self.data.orders })
          // 缓存数据
          self.saveCache()
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
  // 切换店铺
  showShopOrders: function (e) {
    const item = e.currentTarget.dataset.item
    const shopid = item.shopid
    const logo_url = item.logo_url
    if (shopid != this.data.shopid) {
      this.setData({ shopid: shopid, logo_url: logo_url })
      wx.showLoading({
        title: '获取订单中',
        mask: true
      })
      this.orderdata()
    }
  },
  // 查看
  backInfo: function (e) {
    const order = e.currentTarget.dataset.order
    if (order.switcher == 4 || order.switcher == 12) {
      let cash = order.money
      if (order.intelligenceBackMoney) {
        cash = order.intelligenceBackMoney
      }
      wx.navigateTo({
        url: '/pages/backinfo/index?shopid=' + order.shopid + '&orderid=' + order.orderid + '&cash=' + cash + '&slot=' + order.slot
      })
    } else {
      const cash = parseFloat(order.money)
      if (cash > 0) {
        wx.navigateTo({
          url: '/pages/rewarddetail/index?orderid=' + order.orderid
        })
      }

    }
  },
  // 缓存数据
  saveCache: function () {
    const self = this
    const orders = self.data.orders
    const saveData = self.saveFiveChange(orders)
    if (!isEmptyObject(saveData)) {
      wx.setStorage({
        key: 'orderData',
        data: saveData
      })
    }
  },
  // 存储最近变动金额
  saveFiveChange: function (orders) {
    const self = this
    // 获取缓存数据
    let result = wx.getStorageSync('orderData') || {}
    // 判断是否缓存有当前店铺订单数据
    if (isEmptyObject(result)) {
      orders.forEach((item, i) => {
        let money = 0
        if (item.intelligenceBackMoney) {
          money = item.intelligenceBackMoney
        } else {
          money = item.money
        }
        const key = item.shopid + '-' + item.orderid
        result[key] = { money: [money], up: true }
      })
    } else {
      let newDta = {}
      orders.forEach((item, i) => {
        let money = 0
        if (item.intelligenceBackMoney) {
          money = item.intelligenceBackMoney
        } else {
          money = item.money
        }
        const key = item.shopid + '-' + item.orderid
        newDta[key] = item.intelligenceBackMoney
      })
      // 遍历
      for (let key in newDta) {
        // 判断缓存是否存在当前订单
        if (result[key]) {
          result[key] = self.isInArray(newDta[key], result[key].money)
        } else {
          const newdata = newDta[key]
          result[key] = { money: [newdata], up: true }
        }
      }
    }
    return result
  },
  // 判断是否跟你上一次订单一样
  isInArray: function (sum, arr) {
    if (sum != arr[arr.length - 1]) {
      arr.push(sum)
    }
    // 判断是否小于上次，是的话更新为降
    if (sum < arr[arr.length - 2]) {
      return { money: arr, up: false }
    } else {
      return { money: arr, up: true }
    }
  },

  // -------------------------------------------- shop -----------------------------------
  shopOrder: function () {
    const self = this
    let params = { page: 1, size: 10, sid: self.sid, shopId: self.data.shopid, orderby: 'desc' }
    requestGet('/merchant/my-order', params).then(({ success, data, msg }) => {
      wx.stopPullDownRefresh()
      self.setData({ load: false })
      if (success) {
        self.data.orderTotal = data.total
        self.nextPage = data.nextPage
        self.canMore = true
        let list = data.list
        if (list.length > 0) {
          list.forEach((item, i) => {
            if (item.switcher == 4 || item.switcher == 12) {
              item.realMoney = item.intelligenceBackMoney
            } else {
              item.realMoney = item.backing_money
            }
            item.create_time = formatTime(item.create_time)
          })
          self.setData({ nodata: false, orderTotal: self.data.orderTotal, orders: list, init: true })
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
  onReachBottom: function () {
    const self = this
    if (self.data.role == 20) {
      if (self.canMore && self.nextPage && self.nextPage !== 0) {
        self.setData({ more: true })
        self.canMore = false
        let params = { page: self.nextPage, size: 10, sid: self.sid, shopId: self.data.shopid, orderby: 'desc' }
        requestGet('/merchant/my-order', params).then(({ success, data, msg }) => {
          self.setData({ more: false })
          if (success) {
            self.nextPage = data.nextPage
            let list = data.list
            if (list.length > 0) {
              list.forEach((item, i) => {
                if (item.switcher == 4 || item.switcher == 12) {
                  item.realMoney = item.intelligenceBackMoney
                } else {
                  item.realMoney = item.backing_money
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
  },
  onShareAppMessage: function (e) {
    const self = this
    let img = '/assets/images/logo.png'
    if (self.data.hash == '6a60ed12') {
      img = '/assets/images/logo-' + hash + '.png'
    }
    return {
      title: self.data.aname,
      desc: '一款为实体店的营销工具!',
      path: 'pages/home/home',
      imageUrl: img
    }
  },
  // hb
  close: function () {
    this.setData({ showHB: false })
  },
  toPool: function (e) {
    const shopid = e.currentTarget.dataset.shopid
    const uid = this.data.uid
    wx.navigateTo({
      url: '/pages/share/index?pid=' + this.data.uid + '&shopid=' + shopid
    })
  },
  scan: function () {
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
          const code = getScanShopQr(res.result)
          if (code) {
            if (res.result.indexOf('redqr')>0){
              // 跳到支付页面
              wx.navigateTo({
                url: '/pages/red/index?code=' + code,
              })
            }
            else{
              // 跳到支付页面
              wx.navigateTo({
                url: '/pages/scan/index?code=' + code,
              })
            }
          
          }
        }
      }
    })
  },
  seefh: function (e) {
    const item = e.currentTarget.dataset.order
    const orderid = item.orderid
    wx.setStorage({
      key: "fh-orderid",
      data: orderid,
      success: function () {
        wx.switchTab({
          url: '/pages/home/home',
        })
      }
    })
  }
})
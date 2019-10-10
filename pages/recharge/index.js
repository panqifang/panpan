import {
  requestGet,
  requestPOST
} from '../../assets/utils/request'
import {
  formatTime
} from '../../assets/utils/func'
import config from '../../assets/config'
const {
  getMemberInfo,
  globalData,
  getScanShopQr
} = getApp()

Page({
  data: {
    shop: {},
    noshop: false,
    init: false,
    load: false,
    payNum: '100',
    payMoney: '1',
    payInput: 100.,
    orders: [],
    poolRate: 0,
    switcher: 0,
    hb: false,
    uid: 0,
    canshare: true,
    shopid: 0,
    yxd: 0
  },
  onLoad: function(options) {
    // options.code = '5badf4d5'
    this.options = options
    this.setData({
      load: true,
      noshop: false
    })

  },
  onShow: function() {
    const self = this
    if (self.options.shopid) {
      self.shopid = self.options.shopid
    }
    if (self.options.yxd) {
      self.data.yxd = self.options.yxd
    }
    if (self.options.code) {
      self.code = self.options.code
      // 如果扫店铺二维码进来
    } else if (self.options.q) {
      // 获取二维码里面的路径信息
      let url = decodeURIComponent(self.options.q)
      // 处理二维码连接信息，返回code
      self.code = getScanShopQr(url)
    }

    if (self.options.share) {
      self.setData({
        canshare: false
      })
    }
    // 登录
    getMemberInfo().then(memberinfo => {
      self.sid = wx.getStorageSync('session').sid
      self.data.uid = memberinfo.user.uid
      // 获取店铺信息
      self.shopInfo().then(data => {
        self.setData({
          load: false
        })
        if (data) {
          const shop = data
          if (shop.status == 10) {
            // 未营业直接跳转
            self.setData({
              noshop: true,
              init: false
            })
            // 跳转开店
            wx.redirectTo({
              url: '/pages/openshop/index?code=' + self.code
            })
            // 营业中
          } else if (shop.status == 50) {
            self.shopid = shop.shopid
            self.data.poolRate = shop.pool_rate
            self.switcher = shop.switcher
            self.setData({
              noshop: false,
              init: true,
              shop: shop
            })

          } else {
            self.setData({
              noshop: true,
              init: false
            })
          }
        } else {
          wx.showModal({
            title: '提示',
            content: '店铺不存在',
            showCancel: false
          })
        }
      })
    })

  },
  // 避免周期再次调用接口
  shopInfo: function() {
    const self = this
    let param = {
      sid: self.sid
    }
    if (self.code) {
      param.code = self.code
    }
    if (self.shopid) {
      param.shopId = self.shopid
    }
    return new Promise((resolve) => {
      requestGet('/shops/info', param).then(({
        success,
        data,
        msg
      }) => {
        if (success && data) {
          resolve(data)
        } else {
          resolve(false)
        }
      })
    })
  },
  // 操作输入，处理输入作为订单金额
  handleZanFieldChange(e) {
    console.log(e.target.id)

    if (e.target.id == "pay")

      this.changePay(e)

    else if (e.target.id == "num")
      this.changeNum(e)

    else if (e.target.id == "money")
      this.changeMoney(e)
  },

  changePay: function(e) {

    let val = Number(e.detail.value.toString().match(/^\d+(?:\.\d{0,2})?/))
    this.data.payInput = val
    // this.setData({
    //   payInput: val
    // })
    if (this.data.payMoney > 0) {

      this.setData({
        payNum: parseInt(val / this.data.payMoney)
      })
      console.log(this.data.payNum)

    }
  },

  changeNum: function(e) {

    let val = Number(e.detail.value.toString().match(/^\d+/))
    this.data.payNum = val
    // this.setData({
    //   payNum: val
    // })
    if (this.data.payMoney > 0) {

      this.setData({
        payInput: val * this.data.payMoney
      })
    }
  },

  changeMoney: function(e) {
    let val = Number(e.detail.value.toString().match(/^\d+(?:\.\d{0,2})?/))
    this.data.payMoney = val
    // this.setData({
    //   payMoney: val
    // })
    if (this.data.payNum > 0) {

      this.setData({
        payInput: val * this.data.payNum
      })
    }
  },
  // 弹出支付信息
  popupPay: function() {
    const self = this
    const money = this.data.payInput
    const avg = this.data.payMoney
    if (avg * 1000 < 0.1 * 1000) {
      wx.showModal({
        title: '提示',
        content: '红包平均金额不能小于0.1元',
        showCancel: false
      })

      return

    }
    const poolRate = this.data.poolRate
    const deductionRatio = parseInt(this.data.shop.deduction_ratio)
    if (money * 1000 >= 0.1 * 1000) {
      let url = '/pages/pay/index?code=' + this.code + '&money=' + money + '&poolRate=' + poolRate + '&switcher=' + this.switcher + '&shopid=' + this.data.shop.shopid + '&yxd=' + this.data.yxd + '&recharge=' + "1&avg=" + avg

      wx.navigateTo({
        url: url
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '最少支付0.1元',
        showCancel: false
      })
    }
  },
  shareTo: function() {
    const self = this
    const hash = config.hash
    const host = config.host
    const sence = self.data.uid + '-' + self.data.shop.shopid + '-' + self.data.shop.code
    let url = host + '/qrcode/create-circle?sence=' + sence + '&hash=' + hash + '&page=pages/share/index'

    wx.showActionSheet({
      itemList: ['分享给好友', '分享二维码'],
      success: function(res) {
        if (res.tapIndex == 0) {
          wx.showModal({
            title: '提示',
            content: '点击右上角三个点进行转发',
            showCancel: false,
            confirmText: '我知道了'
          })
        } else if (res.tapIndex == 1) {
          wx.previewImage({
            urls: [url] // 需要预览的图片http链接列表
          })
        }
      },
      fail: function(res) {
        console.log(res.errMsg)
      }
    })

  },

  onShareAppMessage: function(res) {
    const self = this;
    let info = {
      title: '推荐赢大奖',
      desc: '最具人气的大奖等你来拿!',
      imageUrl: '../../assets/images/share-pic.png'
    }
    // 如果是点击按钮分享的
    if (res.from === 'button') {
      // 分享的页面
      info.path = '/pages/share/index?pid=' + self.data.uid + '&shopid=' + self.data.shop.shopid + '&code=' + self.data.shop.code
    } else {
      info.path = '/pages/share/index?pid=' + self.data.uid + '&shopid=' + self.data.shop.shopid + '&code=' + self.data.shop.code
    }
    return info
  }
})
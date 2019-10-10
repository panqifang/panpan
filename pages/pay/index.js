import {
  requestGet,
  requestPut
} from '../../assets/utils/request'
import {
  getFloatThree,
  checkTwoFloat,
  toCeil,
  toTwoNum
} from '../../assets/utils/func'
import config from '../../assets/config'
import {
  add,
  sub,
  mul,
  div
} from '../../assets/utils/calc';
const {
  getMemberInfo,
  globalData,
  modules
} = getApp()
// code=undefined&money=33&poolRate=40&switcher=16&shopid=37&yxd=0
Page({

  data: {
    // 店铺id
    shopid: 0,
    // 余额
    cash: 0,
    // 可用余额:
    canUserBalance: 0,
    // 总价
    pay: 0,
    // 需要支付金额
    needPay: 0,
    // 是否适用代金券
    yxd: 0,
    // 代金券列表
    djjitems: [],
    djjitemsInit: [],
    canUseDjj: true,
    // 余额支付状态
    useBalancePay: false,
    // 代金券支付状态
    useDjjPay: false,
    vids: [],
    canUseDjj: false,
    canUseCash: true
  },
  onLoad: function(options) {
    this.options = options

    this.setData({money:options.money})
   
  },
  onShow: function() {
    const self = this
    // 有数据传人执行
    if (self.options.money) {
      getMemberInfo().then(memberinfo => {
        // sid
        self.sid = wx.getStorageSync('session').sid
        // 需要支付的金额
        self.data.needPay = self.options.money
        // self.data.money = self.options.money
        if (self.options.yxd) {
          self.data.yxd = self.options.yxd
          self.data.category = self.options.yxd
        }

        if (self.options.yxd == 1 || self.options.recharge) {
          self.data.canUseDjj = false
        } else {
          self.data.canUseDjj = true
        }

        if (self.options.recharge) {
          self.data.canUseCash = false
          self.data.category = 2
        }

        // 判断余额支付
        if (self.data.needPay > memberinfo.user.cash) {
          self.data.canUserBalance = memberinfo.user.cash
        } else {
          self.data.canUserBalance = self.data.needPay
        }
        // 获取代金券
        if (self.data.canUseDjj)
          requestGet('/voucher', {
            sid: self.sid,
            shopid: self.options.shopid
          }).then(res => {
            if (res.success) {
              let list = res.data
              // 初始化全部不勾上
              list.forEach(item => {
                item.checked = false
              })
              self.data.djjitemsInit = list
              self.setData({
                djjitems: list
              })
            }
          })

        self.setData({
          cash: memberinfo.user.cash,
          needPay: self.data.needPay,
          canUserBalance: self.data.canUserBalance,
          canUseDjj: self.data.canUseDjj,
          canUseCash: self.data.canUseCash
        })
      })
    }
  },

  // 开启余额抵现
  openBalanceBtn: function(e) {
    this.data.useBalancePay = e.detail.value
    this.countPay()
  },
  // 选择代金券
  checkboxChange: function(e) {
    const val = e.detail.value
    this.data.checkvalue = e.detail.value
    if (val.length > 0) {
      this.data.useDjjPay = true
    } else {
      this.data.useDjjPay = false
    }
    this.countPay()
  },
  // 计算钱
  countPay: function() {
    const self = this
    const money = toTwoNum(self.data.money)
    // 需要支付
    self.data.needPay = money
    self.data.vids = []
    // 判断代金券
    if (self.data.useDjjPay) {
      const djjye = self.data.checkvalue
      let djjcash = 0
      djjye.forEach(item => {
        const djsitem = self.data.djjitemsInit[item]
        const cash = djsitem.cash
        self.data.vids.push(djsitem.vid)
        djjcash = djjcash + toTwoNum(cash)
      })
      if (sub(djjcash, self.data.needPay) <= 0) {
        self.data.needPay = sub(self.data.needPay, djjcash)
      } else {
        wx.showModal({
          title: '提示',
          content: '支付金额不能小于代金券总额',
          showCancel: false,
        })
        self.data.useDjjPay = false
        self.setData({
          djjitems: self.data.djjitemsInit
        })
      }
    }

    // 从新计算下可用余额
    if (self.data.needPay > self.data.cash) {
      self.data.canUserBalance = self.data.cash
    } else {
      self.data.canUserBalance = self.data.needPay
    }

    // 判断是否开启余额支付
    if (self.data.useBalancePay) {
      const balance = self.data.canUserBalance
      self.data.needPay = sub(self.data.needPay, balance)
    }

    // 避免负数
    if (self.data.needPay <= 0) {
      self.data.needPay = 0
    }

    self.setData({
      needPay: self.data.needPay,
      canUseDjj: self.data.canUseDjj,
      canUserBalance: self.data.canUserBalance
    })
  },

  // 执行微信支付
  orderWxPay: function() {
    // 如果开启积分积分抵现
    let payType = 0
    if (this.data.useBalancePay) {
      payType = payType + 1
    }
    if (this.data.useDjjPay) {
      payType = payType + 8
    }
    // 调用支付
    this.pay(payType)
  },
  // 执行生成订单
  pay: function(typePay) {
    const self = this
    if (self.data.isPay) {
      return
    }
    let score = 0
    let data = {
      sid: self.sid,
      name: '微信支付：' + self.data.money + '元',
      amount: self.data.money,
      score: score,
      category: self.data.category,
      multi_pay: typePay,
      avg:this.options.avg||0
    }
    if (self.options.code && self.options.code != 'undefined') {
      data.code = self.options.code
    }
    if (self.options.shopid) {
      data.shopId = self.options.shopid
    }
    if (self.data.vids.length > 0) {
      data.vid = self.data.vids.join(',')
    }

    data.price=this.options.price
    data.num=this.options.num
    if (this.options.category_id)
      data.category_id = this.options.category_id

    wx.showLoading({
      title: '执行支付中',
      mask: true
    })
    self.setData({
      isPay: true
    })
    requestPut('/orders', data).then(({
      success,
      data,
      msg
    }) => {
      self.setData({
        isPay: false
      })
      wx.hideLoading()
      if (success) {
        // 调取微信支付
        if (data.type == 1) {
          self.payFinalHandle()
        } else {
          console.log(data)


          wx.requestPayment({
            'timeStamp': String(data.timeStamp),
            'nonceStr': data.nonceStr,
            'package': data.package,
            'signType': data.signType,
            'paySign': data.paySign,
            'success': function(res) {
              self.payFinalHandle()
            },
            fail: function(err) {
              console.log(err)
              wx.removeStorageSync('memberinfo');
              wx.navigateBack()
            }
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
  // 支付成功
  payFinalHandle: function() {
    // wx.redirectTo({
    //     url: '/pages/payresult/index?switcher=' + this.options.switcher
    // })
    wx.removeStorageSync('memberinfo')
    wx.switchTab({
      url: '/pages/home/home',
      success:function(){
        wx.navigateTo({
          url: '/pages/address/address',

        })
      }
    })
   
  }
})
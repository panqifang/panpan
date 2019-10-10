import {
  requestPOST
} from '../../assets/utils/request'
import config from '../../assets/config'
const {
  getMemberInfo,
  modules
} = getApp()

Page({
  data: {
    shop: {},
    load: false,
    init: false,
    // address
    address: '',
    num: 0,
    // 是否开启涨停比例（新智能反）
    isMostHeight: false,
    // 开启天天了设置模块
    isOpenDdh: false,
    max_ddh: 100,
    openDDH: modules.openDDH, // 模块开启
    openShopSetDefaultBack: modules.openShopSetDefaultBack,
    submit: true,
    logo: ''
  },
  onLoad: function (options) {
    const self = this
    this.options = options
    this.setData({
      load: true
    })
    wx.removeStorageSync('memberinfo')
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    getMemberInfo().then(memberinfo => {
      wx.hideLoading()
      wx.stopPullDownRefresh()
      self.sid = wx.getStorageSync('session').sid
      if (memberinfo.shop) {
        let shop = memberinfo.shop
        self.data.address = shop.address
        if (shop.front_url) {
          const logo = config.host + shop.front_url
          self.data.logo = logo
        }
        // H获取定位
        wx.getLocation({
          type: 'gcj02',
          success: function(res) {
            self.lat = res.latitude
            self.lng = res.longitude
          },
          fail: function() {
            self.lat = shop.lat
            self.lng = shop.lng
          }
        })
        // 初始化
        if (shop.switcher == 12) {
          self.data.isMostHeight = true
        } else {
          self.data.isMostHeight = false
        }
        // 判断天天乐
        if (shop.switcher == 0) {
          self.data.max_ddh = shop.pool_rate
          if (parseInt(shop.ddh_pool_rate) > 0) {
            self.data.isOpenDdh = true
          } else {
            self.data.isOpenDdh = false
          }
        }
        self.setData({
          max_ddh: self.data.max_ddh,
          isOpenDdh: self.data.isOpenDdh,
          isMostHeight: self.data.isMostHeight,
          shop: shop,
          address: self.data.address,
          logo: self.data.logo,
          load: false,
          init: true
        })
      } else {
        wx.showModal({
          title: '提示',
          content: '店铺异常，请重试',
          showCancel: false
        })
      }
    })
  },
  onPullDownRefresh: function(){
    this.onLoad()
  },
  // 选择地点, 注意：选择完成后还会执行onshow方法
  selectAdress: function() {
    const self = this
    wx.chooseLocation({
      success: function(res) {
        self.lat = res.latitude
        self.lng = res.longitude
        self.setData({
          address: res.address
        })
      }
    })
  },
  // 计数
  countInputNum: function(e) {
    const val = e.detail.value.length
    this.setData({
      num: val
    })
  },
  // 开启最高反
  openMostBack: function(e) {
    const val = e.detail.value
    this.setData({
      isMostHeight: val
    })
  },
  // ------------------ ddh------------------------
  openDdhSwitch: function(e) {
    const val = e.detail.value
    this.setData({
      isOpenDdh: val
    })
  },
  // 折扣比例设置后，更新天天乐最大设置比例
  poolRateChange: function(e) {
    const max_ddh = parseInt(100 - e.detail.value)
    this.setData({
      max_ddh: max_ddh
    })
  },
  //----------------- ddh end -------------------
  // 提交提现信息
  formSubmit: function(e) {
    const self = this
    // 阻止多次提交
    if (!self.data.submit) {
      return
    }
    let formdata = e.detail.value

    // 追加参数
    let baseParam = {
      sid: self.sid,
      shopid: self.data.shop.shopid,
      lat: self.lat,
      lng: self.lng,
      switcher: self.data.shop.switcher
    }
    // 处理switch选择到0时候为空
    if (!formdata.order_pay_rate) {
      formdata.order_pay_rate = 0
    }
    const params = Object.assign(baseParam, formdata)
    // 处理开关
    if ((self.data.shop.switcher & 4) == 4) {
      if (self.data.isMostHeight) {
        params.switcher = 12
      } else {
        params.switcher = 4
        params.order_pay_rate = 100
      }
    } else {
      // 处理开启天天乐
      if (!self.data.isOpenDdh) {
        params.ddh_pool_rate = 0
      } else {
        if (self.data.isOpenDdh && params.ddh_pool_rate == '') {
          params.ddh_pool_rate = 1
        }
      }
      // 处理是否只能发
      if (self.data.openShopSetDefaultBack) {
        params.pool_rate = 100 - params.pool_rate
      } else {
        params.pool_rate = 30
        params.order_pay_rate = 100
      }
    }
    wx.showLoading({
      title: '保存设置中',
      mask: true
    })
    // 提交
    requestPOST('/merchant/merchant-setting', params).then(({
      success,
      data,
      msg
    }) => {
      wx.hideLoading()
      self.data.submit = true
      if (success) {
        wx.removeStorageSync('memberinfo')
        wx.showToast({
          title: '保存设置成功',
          icon: 'success',
          success: function() {
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
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
  chooseImage: function() {
    wx.navigateTo({
      url: '/pages/cropper/index',
    })
  }
})
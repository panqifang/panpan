import {
  requestGet,
  requestPOST
} from '../../assets/utils/request'

import {
  formatTime,
  formatDate
} from '../../assets/utils/func'
import config from '../../assets/config'
const {
  getMemberInfo,
  hash
} = getApp()




Page({
  data: {
    mode:"aspectFit",
    shopid: null,
    role: 0,
    uid: 0,
    shop: {},
    data: {},
    selected: 1,
    momey: 0,
    code: '',
    timeStr: '',
    timer: null,
    isend: false,
    endTime: 0,
    timerTwo: null,
    shareshow: false,
    nodata: false,
    optime: '',
    clotime: '',
    ruleshow: false,
    ruleOne: [],
    ruleTwo: [],
    ruleThree: [],
    rules: [],
    orderid: '',
    shopconfig: {},
    showyxd: false,
    pool_bottom_init: 0,
    times:0,
    rule_index:0,
    date:'30天',
    add:10,
    rate:10

  },
  onLoad: function(options) {
    // options={shopid:19584,pid:4}
    const self = this
    self.options = options

    console.log(options)

    if (options.scene) {
      const senceArr = options.scene.split('-')
      let params = {}
      if (senceArr[0]) {
        params.pid = senceArr[0]
      }
      if (senceArr[1]) {
        params.shopid = senceArr[1]
      }
      this.options = params
    }


    if (self.options.shopid) {
      this.setData({
        shopid: parseInt(self.options.shopid)
      })
      wx.setStorageSync('wx_shopid', self.options.shopid)
    } else {

      let shopid = wx.getStorageSync('wx_shopid')
      if (shopid) {
        this.setData({
          shopid: parseInt(shopid)
        })
      }
    }

  },
  onShow: function() {
    

    let shopid = wx.getStorageSync('active-shopid')
    if (shopid) {
      this.setData({
        shopid: parseInt(shopid)
      })
      this.data.shopid = parseInt(shopid)

      wx.removeStorageSync('active-shopid')
      wx.setStorageSync('wx_shopid', shopid)
    }

    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {

      console.log("getTabBar().setData")
      this.getTabBar().setData({
        selected: 1
      })
    }



    const self = this
    getMemberInfo().then(userinfo => {
      self.data.role = userinfo.user.role
      self.sid = wx.getStorageSync('session').sid
      self.data.uid = userinfo.user.uid
      self.setData({
        role: self.data.role
      })
      wx.stopPullDownRefresh()
      if (self.data.role == 10) {
        let shopid = self.data.shopid
        if (wx.getStorageSync('fh-orderid')) {
          self.getHbMoney()
        }
       else if (shopid) {
          self.getShop(shopid)
        } else {
          self.getHbMoney()
        }
        const pid = self.options.pid
        if (pid) {
          self.bind(pid)
          self.options.pid = null
          console.log('self.options.pid')
          console.log(self.options.pid)
        }
      } else if (self.data.role == 20) {
        if ((userinfo.shop.title.length) > 8) {
          userinfo.shop.title = userinfo.shop.title.substring(0, 8)
        }
        self.data.shopid = userinfo.shop.shopid
        self.data.code = userinfo.shop.code
        self.setData({
          shop: userinfo.shop
        })
        self.countTime();
      } else {
        self.setData({
          nodata: true
        })
      }
      requestGet('/rule', {}).then(res => {
        if (res.success) {
          self.data.ruleOne = self.createActiveList(res.data.one)
          self.data.ruleTwo = self.createActiveList(res.data.two)
          self.data.ruleThree = self.createActiveList(res.data.three)
        }
      })
    })
  },
  bind: function(pid) {

    const self = this
    // 不绑定自己
    if (self.data.uid != pid) {
      requestPOST('/users/user-bind', {
        pid: pid,
        sid: self.sid,
        shopid: self.data.shopid
      }).then(res => {
        console.log(res);
      })
    }
  },

  onPullDownRefresh: function() {
    this.onShow();
  },

  createActiveList: function(val) {
    let result = []
    if (!val) {
      return result
    }
    if (val.indexOf('\n') === -1) {
      return [val]
    }
    const arr = val.split('\n')
    return arr
  },
  getHbMoney: function() {
    const self = this
    let params = {
      sid: self.sid
    }
    if (wx.getStorageSync('fh-orderid')) {
      params.orderid = wx.getStorageSync('fh-orderid')
      wx.removeStorageSync('fh-orderid')
    }
    requestGet('/orders/pay-last-order', params).then(({
      success,
      data,
      msg
    }) => {
      if (success) {
        self.onGetData(data)
      } else {
        let shopid = config.shopid
        if (shopid) {
          shopid = parseInt(shopid)
         
        }
        self.getShop(shopid)
        // self.setData({ nodata: true })
      }
    })
  },
  getShop: function(shopid) {
    const self = this
    let params = {
      sid: self.sid,
      shopid: shopid
    }

    requestGet('/shops/shop-active-info', params).then(({
      success,
      data,
      msg
    }) => {
      if (success) {
        self.onGetData(data)
      } else {
        self.setData({
          nodata: true
        })
      }
    })
  },
  onGetData: function(data) {
    const self = this
    if ((data.shop.title.length) > 8) {
      data.shop.title = data.shop.title.substring(0, 8)
    }
    self.data.shopid = data.shop.shopid
    wx.setStorageSync('wx_shopid', self.data.shopid)
    self.data.code = data.shop.code
    self.data.orderid = data.orderid
    self.data.shopconfig = data.config
    self.countdate(data.config)
    // self.data.showyxd = self.ckeckWorking()
    let cycle_max = data.config.cycle_max
    // cycle_max =  2870
    let date=''
    if (cycle_max >= 1440){
      date = date +parseInt(cycle_max/1440)+'天'
      cycle_max %= 1440
    }
    if(cycle_max>=60){
      date = date + parseInt(cycle_max / 60) + '小时'
      cycle_max %= 60
    }
    if (cycle_max >0){
      date = date + cycle_max  + '分'
    }

    self.setData({
      data: data,
      shop: data.shop,
      nodata: false,
      add:data.config.cycle_grow,
      date:date
      // showyxd: self.data.showyxd
    })
    self.countTime();
  },
  countdate: function(config) {
    const optime = this.UnixToDate(config.open_time - 28800)
    const closetime = this.UnixToDate(config.close_time - 28800)
    this.setData({
      optime: optime,
      clotime: closetime
    })
  },

  countTime: function() {
    const self = this
    // 获取登陆sid
    requestGet('/shops/cycle-info', {
      sid: self.sid,
      shopid: self.data.shopid
    }).then(resdata => {
      // clearInterval(self.data.timer);
      const result = resdata.data
      // const nowDate = Date.parse(new Date()) / 1000;
      const nowDate = result.sysTime
      let endtime = result.end_time
      const date = endtime - nowDate
      self.data.endTime = date
      if (date > 0) {
        self.data.isend = false
        this.data.times = date
        self.countDown();
      } else {
        self.data.isend = true
        const timeStr = '00:00:00'
        this.data.times =0
        self.setData({
          timeStr: timeStr
        })
      }
      self.setData({
        momey: result.pool_bottom,
        isend: self.data.isend,
        pool_bottom_init: result.config.pool_bottom_init
      })
    })
  },

  //带天数的倒计时
  countDown: function() {
    const self = this
    if (!self.data.timer)
      self.data.timer = setInterval(function() {
        let times =   self.data.times;
        if(times==0)
          return;
       // self.countFive(times)
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
        self.setData({
          timeStr: timeStr
        })
        times--;
        self.data.times=times;
        if((times<300&&times%60==0)||(times<7&&times%2==0)){
          self.countTime()
        }
      }, 1000);
    // if (times <= 0) {
    //   clearInterval(self.data.timer);
    //   self.setData({
    //     isend: true
    //   })
    // }
  },

  // countFive: function(times) {
  //   const self = this;
  //   const time = 5 * 60 + 4;
  //   if (times <= time && !self.data.timerTwo) {
  //     console.log('start')
  //     self.data.timerTwo = setInterval(function() {
  //       // 获取登陆sid
  //       requestGet('/shops/cycle-info', {
  //         sid: self.sid,
  //         shopid: self.data.shopid
  //       }).then(resdata => {
  //         clearInterval(self.data.timer);
  //         const result = resdata.data
  //         let endtime = result.end_time
  //         const nowDate = Date.parse(new Date()) / 1000;
  //         const date = endtime - nowDate
  //         self.data.endTime = date
  //         if (date > 0) {
  //           self.data.isend = false
  //           self.countDown(date);
  //         } else {
  //           self.data.isend = true
  //           const timeStr = '00:00:00'
  //           self.setData({
  //             timeStr: timeStr
  //           })
  //         }
  //         self.setData({
  //           momey: result.pool_bottom,
  //           isend: self.data.isend,
  //           pool_bottom_init: result.config.pool_bottom_init
  //         })
  //       })

  //     }, 60000 > (times - 4) * 1000 ? (times - 4) * 1000 : 600000);
  //     if (times <= 0) {
  //       clearInterval(self.data.timerTwo);
  //     }
  //     if (times <= 10 && !self.data.timerThree) {

  //     }
  //   }
  // },

  mylist: function() {
    const shopid = this.data.shopid
    wx.navigateTo({
      url: '/pages/sharelist/index?shopid=' + shopid,
    })
  },

  pay: function() {
    const code = this.data.code
    const shopid = this.data.shopid

    if (this.data.shopid) {
      wx.navigateTo({
        url: '/pages/scan/index?shopid=' + shopid
      })
    } else {
      if (code && code != 'undefined') {
        wx.navigateTo({
          url: '/pages/scan/index?code=' + code
        })
      }
    }
  },

  ckeckWorking: function() {
    const config = this.data.shopconfig
    const now = Date.parse(new Date()) / 1000;
    const dastart = Date.parse(formatDate(now)) / 1000
    const nowdata = now - dastart + 28800
    let yudan = false
    //
    const optime = config.open_time
    let closetime = config.close_time;
    if (closetime >= 86400) {
      closetime = config.close_time - 86400
    }
    // 当天内
    if (closetime > optime) {
      if (nowdata >= optime && nowdata <= closetime) {
        yudan = true;
      }

    } else {
      // 跨天
      const dayend = 24 * 60 * 60 - 1
      if ((nowdata >= optime && nowdata <= dayend) || (nowdata >= 0 && nowdata <= closetime)) {
        yudan = true
      }
    }
    return yudan;
  },

  onShareAppMessage: function(res) {
    const self = this;
    self.setData({
      shareshow: false
    })
    let info = {
      title: '推荐赢大奖',
      desc: '最具人气的大奖等你来拿!'
    }


    // 分享的页面
    info.path = '/pages/home/home?pid=' + self.data.uid + '&shopid=' + self.data.shopid + '&source=home'

    return info
  },

  shareTo: function() {
    const self = this
    const hash = config.hash
    const host = config.host
    self.setData({
      shareshow: false
    })
    const sence = self.data.uid + '-' + self.data.shopid
    let url = host + '/qrcode/create-circle?t=2&sence=' + sence + '&hash=' + hash + '&page=pages/aindex/aindex'
    console.log(url)
    wx.previewImage({
      urls: [url] // 需要预览的图片http链接列表
    })
  },
  onRuleClose() {
    this.setData({
      ruleshow: false
    });
  },

  goToShop() {
    const self = this
    wx.authorize({
      scope: 'scope.userLocation',
      success() {
        wx.openLocation({
          latitude: Number(self.data.shop.lat),
          longitude: Number(self.data.shop.lng),
          name: "前往：" + self.data.shop.title,
          address: "联系方式：" + self.data.shop.phone,
          scale: 18
        })
      }
    })
  },

  shareTotop: function() {
    this.setData({
      shareshow: true
    });
  },

  onClose() {
    this.setData({
      shareshow: false
    });
  },

  ruleClose:function() {
    this.setData({
      ruleshow: false
    });
  },


  UnixToDate: function(unixTime) {
    let date = new Date(unixTime * 1000);


    let year = date.getFullYear(),
      month = date.getMonth() + 1, //月份是从0开始的
      day = date.getDate(),
      hour = date.getHours(),
      min = date.getMinutes(),
      sec = date.getSeconds();
    if (hour < 10) {
      hour = '0' + hour
    }
    if (min < 10) {
      min = '0' + min
    }
    const newTime = hour + ':' + min
    return newTime;
  },

  showRulePopup: function(e) {
    // const self = this
    // const ty = e.currentTarget.dataset.ty
    
    //   this.setData({
    //     rule_index: ty,
    //     ruleshow: true
    //   })

    const self = this
    const ty = e.currentTarget.dataset.ty
    if (ty == 'one') {
      this.setData({
        rules: self.data.ruleOne,
        ruleshow: true
      })
    } else if (ty == 'two') {
      this.setData({
        rules: self.data.ruleTwo,
        ruleshow: true
      })
    } else if (ty == 'three') {
      this.setData({
        rules: self.data.ruleThree,
        ruleshow: true
      })
    }
  },
  call: function(e) {
    const mobile = e.currentTarget.dataset.mobile
    wx.makePhoneCall({
      phoneNumber: mobile
    })
  },
  topBackingList: function() {
    const self = this
    wx.navigateTo({
      url: '/pages/shopbacking/index?shopid=' + self.data.shopid
    })
  },
  toppool: function() {
    const self = this
    wx.navigateTo({
      url: '/pages/toppool/index?shopid=' + self.data.shopid
    })
  },
  user:function(){
    wx.switchTab({
      url: '/pages/user/index',
    })
  }
})
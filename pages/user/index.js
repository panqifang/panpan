import { requestGet, requestPOST, requestPut } from '../../assets/utils/request'
import { formatTime, formatDate } from '../../assets/utils/func'
import config from '../../assets/config'
const { getMemberInfo, hash } = getApp()

Page({
    data: {
        hash: hash,
        user: {},
        wiperdata: [],
        appname: config.company,
        showQR: true,
        addphone: config.addphone,
        aname: config.name,
        canIUse: wx.canIUse('button.open-type.getUserInfo')
    },
    onLoad: function (options) {
        this.options = options
    },
    onShow: function () {
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          selected: 2
        })
      }

        const self = this
        getMemberInfo().then(res => {
            wx.stopPullDownRefresh()
            // 获取登陆sid
            self.sid = wx.getStorageSync('session').sid
            // 不存在头像，需要跳转授权
            // if ((!res.user.avatar || !res.user.nickname) && self.data.canIUse) {
            //     // wx.navigateTo({
            //     //     url: '/pages/login/index',
            //     // })
            // } else 
            {
                res.user.paynum = res.num
                self.data.user = res.user
                self.data.num = res.num
                self.data.role = res.user.role
                // 店铺信息
                if (res.shop) {
                    self.data.shop = res.shop
                }
                // 代理商信息
                if (res.agent) {
                    self.data.agent = res.agent
                }
                // 用户执行获取列表
                if (res.user.role == 10) {
                    self.getSwiperData()
                    // 弹出可领取订单提醒
                    setTimeout(() => {
                        self.openCanCastout()
                    }, 30)
                }
                // 渲染数据
                self.setData(self.data)
            }
        })
    },

    // 下拉刷新
    onPullDownRefresh: function () {
        wx.removeStorageSync('memberinfo')
        this.onShow()
    },
    // 获取swiper数据
    getSwiperData: function () {
        const self = this
        requestGet('/orders/backed-last', { size: 15, page: 1, sid: self.sid }).then(({ success, data, msg }) => {
            if (success) {
                let list = data.list
                let leng = list.length > 5 ? list.length : 5
                let size = Math.floor(leng / 5)
                let rs = []
                for (let i = 0; i < size; i++) {
                    let arr = []
                    list.forEach((item, a) => {
                        if (!item.nickname) {
                            item.nickname = '未知昵称'
                        } else {
                            item.nickname = item.nickname.substring(0, 5)
                        }
                        if (Math.floor(a / 5) == i) {
                            arr.push(item)
                        }
                    })
                    rs.push(arr)
                }
                self.setData({
                    wiperdata: rs
                })
            }
        })
    },
    callPhone: function () {
        const self = this
        // wx.makePhoneCall({
        //     phoneNumber: String(self.data.addphone)
        // })
        wx.navigateTo({
            url: '/pages/league/index',
        })
    },
  add_address: function () {
        wx.navigateTo({
            url: '/pages/address/address',
        })
    },
  reward: function () {
        wx.navigateTo({
            url: '/pages/index/index',
        })
    },
    // 弹出可领取
    openCanCastout: function () {
        const self = this
        const todayisshow = wx.getStorageSync('todayisshow')
        // 获取时间
        let thisDate = new Date()
        // 获取当前日期作为结束日期
        let endDate = formatDate(thisDate)
        // 获取前一天作为开始日期
        // thisDate.setDate(thisDate.getDate() + 1);
        // var startDate = formatDate(thisDate)
        if (!todayisshow || endDate != todayisshow) {
            requestGet('/orders/backed-order-notify', { sid: self.sid }).then(({ success, data, msg }) => {
                if (success) {
                    wx.setStorageSync('todayisshow', endDate)
                    wx.showModal({
                        title: '温馨提示',
                        content: msg,
                        confirmText: '我知道了',
                        showCancel: false
                    })
                }
            })
        }
    },
    // ------------------- shop ------------------
    showShopQr: function () {
        const url = this.data.shop.codeImageUrl
        console.log(url)
        if (this.data.role === 20 && url) {
            wx.previewImage({
                urls: [url]
            })
        }
    },
  // ------------------- shop ------------------
  showShopRedQr: function () {
    if(this.data.recharge){
      this.setData({
        recharge: 0
      })
      return
    }
    const url = this.data.shop.redCodeImageUrl
    if (this.data.role === 20 && url) {
      const url2 = url+'&t=' + new Date().getTime()
      console.log(url2)
      wx.previewImage({
        urls: [url2]
      })
    }
  },
  //充值
  recharge:function(){
    this.setData({
      recharge:1
    })

    wx.navigateTo({
      url: '/pages/recharge/index?shopid=' + this.data.shop.shopid 
    })
  },
    // ---------------------------- agent ---------------------------------
    // 开店二维码
    agentOpenShop () {
        const self = this
        self.openShopHandle().then(res => {
            if (res.confirm) {
                if (self.data.role === 50) {
                    self.agentCreateShopQr()
                } else if (self.data.role == 30 || self.data.role == 40) {
                    self.otherCreateShopQr()
                } else {
                    wx.showModal({
                        title: '提示',
                        content: '生产二维码失败',
                        showCancel: false
                    })
                }
            }
        })
    },
    openShopHandle: function () {
        return new Promise((resolve) => {
            wx.showModal({
                title: '重要提示',
                content: '此操作生成店铺二维码，二维码第一次被扫时绑定扫码人为店主，请妥善保管生成的二维码！',
                mask: true,
                confirmText: '生成',
                success: function (res) {
                    resolve(res)
                }
            })
        })
    },
    // 代理商
    agentCreateShopQr: function () {
        const self = this
        wx.showLoading({
            title: '生成二维码中',
        })
        // 执行生成开店二维码
        requestPut('/shops/custom', { sid: self.sid }).then(res => {
            self.onenShopHanle(res)
        })
    },
    otherCreateShopQr: function () {
        const self = this
        wx.showLoading({
            title: '生成二维码中',
        })
        // 执行生成开店二维码
        requestPOST('/shops/direct_indirect_shop', { sid: self.sid, agentUid: self.data.agent.parent_uid }).then(res => {
            self.onenShopHanle(res)
        })
    },
    onenShopHanle: function (res) {
        const self = this
        wx.hideLoading()
        if (res.success) {
            // 图片预览
            wx.previewImage({
                urls: [res.data.url]
            })
            // 更新缓存数据
            let memberinfo = wx.getStorageSync('memberinfo')
            memberinfo.agent.unshops = memberinfo.agent.unshops + 1
            memberinfo.agent.num = memberinfo.agent.num - 1
            wx.setStorageSync('memberinfo', memberinfo)
            self.setData({ agent: memberinfo.agent })
        } else {
            wx.showModal({
                title: '提示',
                content: res.msg,
                showCancel: false
            })
        }
    },
    // 服务商招聘合伙人
    createPartnerQr: function () {
        const self = this
        // 仅仅允许服务商操作
        if (self.data.role === 40) {
            wx.showModal({
                title: '温馨提示',
                content: '此操作生成招聘合伙人二维码',
                mask: true,
                confirmText: '生成',
                success: function (res) {
                    if (res.confirm) {
                        requestGet('/servicer', { sid: self.sid }).then(res => {
                            if (res.success) {
                                // 图片预览
                                wx.previewImage({
                                    urls: [res.data.url]
                                })
                            } else {
                                wx.showModal({
                                    title: '提示',
                                    content: res.msg,
                                    showCancel: false
                                })
                            }
                        })
                    }
                }
            })
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
    }
})

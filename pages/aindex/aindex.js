// pages/aindex/aindex.js
import {
  requestGet,
  requestPOST
} from '../../assets/utils/request'
const {
  getMemberInfo,
  hash
} = getApp()
import config from '../../assets/config'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shopid: null,
    selected: 0,
    index: 1,
    media_index: [0, 0],
    media: [
      [],
      []
    ],

    shopImg: '',
    videoContext: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // options = { shopid: 19585, pid: 5 }
    let self = this
    this.options = options
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

  
    console.log("options:" + options)
    console.log(options)
  },
  onShow: function () {
    let self = this
    let options = this.options
    if (options.shopid) {
      this.setData({
        shopid: parseInt(options.shopid)
      })
      wx.setStorageSync('wx_shopid', options.shopid)
    } else {
      let shopid = wx.getStorageSync('wx_shopid')
      if (shopid) {
        this.setData({
          shopid: parseInt(shopid)
        })
      }
    }
  if(!self.data.shopid){

    let shopid = wx.getStorageSync('active-shopid')
    if (shopid) {
      this.setData({
        shopid: parseInt(shopid)
      })

      wx.removeStorageSync('active-shopid')
    }
  }


    getMemberInfo().then(userinfo => {
      self.data.role = userinfo.user.role
      self.sid = wx.getStorageSync('session').sid
      self.data.uid = userinfo.user.uid
      self.setData({
        role: self.data.role
      })
      console.log(self.data.role)
      if (self.data.role == 10) {

        const pid = self.options.pid
        if (pid) {
          self.bind(pid)
          self.options.pid = null
          console.log(self.options.pid)
        }
     

        let shopid = self.data.shopid

        if (shopid) {
          self.shopInfo()
          self.getMedia()
        } else {
          self.getHbMoney()
        }
      }


       if (self.data.role == 20) {
        self.data.shopid = userinfo.shop.shopid
        self.setData({
          shopid: userinfo.shop.shopid,
          shopImg: userinfo.shop.logo
        })
        self.shopInfo()
        self.getMedia()

      }else{
         let shopid = self.data.shopid

         if (shopid) {
           self.shopInfo()
           self.getMedia()
         } else {
           self.getHbMoney()
         }
      }
 
    })


   


    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      console.log("getTabBar().setData")
      this.getTabBar().setData({
        selected: 0
      })
    }
  },
  shopInfo:function(){
    let self = this
    requestGet('/shops/shop-info', {
      shopId: self.data.shopid
    }).then(({
      success,
      data,
      msg
    }) => {
      if (success) {
        console.log(data)
        self.setData({
          shopImg : data.logo
        });
      }
    })
  },
  getMedia:function(){
    let self = this
    requestGet('/media', {
      shopid: self.data.shopid
    }).then(({
      success,
      data,
      msg
    }) => {
      if (success) {
        console.log(data)
        self.data.media[0] = data.videos
        self.data.media[1] = data.images
        self.setData({
          media: self.data.media
        });
      }
    })
  },
  bind: function (pid) {

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

  getHbMoney: function () {
    const self = this
    let params = {
      sid: self.sid
    }
    if (wx.getStorageSync('fh-orderid')) {
      params.orderid = wx.getStorageSync('fh-orderid')
    }
    requestGet('/orders/pay-last-order', params).then(({
      success,
      data,
      msg
    }) => {
      if (success) {
        self.onGetData(data)
      } else {
        
        self.setData({ shopid: config.shopid})
        self.shopInfo()
        self.getMedia()

        // self.setData({ nodata: true })
      }
    })
  },
  onGetData: function (data) {
    const self = this
   
    self.data.shopid = data.shop.shopid
    
    self.setData({
      shopImg: data.shop.logo,
      
    })
    self.getMedia();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },



  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },
  bindtouchstart: function(e) {
    console.log(e)
    this.setData({
      "touch.x": e.changedTouches[0].clientX,
      "touch.y": e.changedTouches[0].clientY
    });
    console.log(this.data)
  },
  bindtouchend: function(e) {
    let x = e.changedTouches[0].clientX;
    let y = e.changedTouches[0].clientY;
    console.log("x=" + x + "  y=" + y)
    let dx = x - this.data.touch.x;
    let dy = y - this.data.touch.y;
    console.log("dx=" + dx + "  dy=" + dy)
    // if (this.abs(dx) > 50) {
    //   if (this.data.images && this.data.images.length > 0 && this.data.videos && this.data.videos.length > 0)
    //     this.setData({
    //       index: 1 - this.data.index
    //     })
    // } else


    if (this.abs(dy) > 50) {

      let index = this.data.index
      let m_index = this.data.media_index[index]
      if (dy < 0) {
        if (m_index < this.data.media[index].length - 1) {
          this.data.media_index[index] = m_index + 1
          this.setData({
            media_index: this.data.media_index
          })
        } else {

          if (this.data.media[1 - index] && this.data.media[1 - index].length > 0) {
            index = 1 - index
            this.setData({
              index: index

            })
          }
          this.data.media_index[index] = 0
          this.setData({
            media_index: this.data.media_index
          })
        }
      } else {
        if (m_index > 0) {
          this.data.media_index[index] = m_index - 1
          this.setData({
            media_index: this.data.media_index
          })
        } else {

          if (this.data.media[1 - index] && this.data.media[1 - index].length > 0) {
            index = 1 - index
            this.setData({
              index: index

            })
          }
          this.data.media_index[index] = this.data.media[index].length - 1
          this.setData({
            media_index: this.data.media_index
          })
        }
      }
    }
    let id = "i" + this.data.index + this.data.media_index[this.data.index]
    this.setData({
      imageViewid: id
    })

    if (this.data.videoContext) {
      this.data.videoContext.pause()
    }
    if (this.data.index == 0) {
      this.data.videoContext = wx.createVideoContext(id, this)
      this.data.videoContext.play()
    }
    // this.countTop()
  },
  abs: function(n) {
    return n > 0 ? n : -n
  },
  countTop: function() {
    const query = wx.createSelectorQuery()
    query.select('#vd1').boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec(function(res) {
      // res[0].top // #the-id节点的上边界坐标
      // res[1].scrollTop // 显示区域的竖直滚动位置
      console.log(res)
    })

  },
  buy: function() {
    wx.navigateTo({
      url: '/pages/scan/index?shopid=' + this.data.shopid,
    })
  },
  next: function() {
    // if (this.data.media_index[0] < this.data.media[0].length - 1) {
    //   this.data.media_index[0] = this.data.media_index[0] + 1
    //   this.setData({
    //     media_index: this.data.media_index
    //   })
    // }
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
    info.path = '/pages/aindex/aindex?shopid=' + this.data.shopid+'&pid='+self.data.uid
    return info
  },

  home: function() {
    wx.setStorageSync('active-shopid', this.data.shopid)
    wx.switchTab({
      url: '/pages/home/home'
    })
  },
  waiting:function(){
    // wx.showLoading({
    //   title: '缓存中。。。',
    // })
  },
  play:function(){
    // wx.hideLoading()
  }

})
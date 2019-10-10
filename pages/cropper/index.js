import config from '../../assets/config'

import WeCropper from '../../components/cropper/we-cropper.js'

const { getMemberInfo, hash } = getApp()

const device = wx.getSystemInfoSync() // 获取设备信息
const width = device.windowWidth // 示例为一个与屏幕等宽的正方形裁剪框
const height = width

Page({

  data: {
    hasSelectImage: false,
    ty: 0,
    shopid: 0,
    more: '',
    cropperOpt: {
      id: 'cropper',
      width,  // 画布宽度
      height, // 画布高度
      scale: 2.5, // 最大缩放倍数
      zoom: 8, // 缩放系数
      cut: {
        x: (width - 320) / 2, // 裁剪框x轴起点
        y: (width - 150) / 2, // 裁剪框y轴期起点
        width: 320, // 裁剪框宽度
        height: 150 // 裁剪框高度
      }
    }
  },

  onLoad: function (options) {
    const self = this
    // 裁剪实例
    let { cropperOpt } = this.data

    if (options.ty) {
      self.data.ty = options.ty
    }

    if (options.more) {
      self.data.more = options.more
    }
    
    new WeCropper(cropperOpt)

    getMemberInfo().then(res => {
      self.sid = wx.getStorageSync('session').sid
      
      self.data.role = res.user.role
      if (res.user.role == 20) {
        self.data.shopid = res.shop.shopid
      }
    })
  },


  // 裁剪操作
  touchStart(e) {
    this.wecropper.touchStart(e)
  },
  touchMove(e) {
    this.wecropper.touchMove(e)
  },
  touchEnd(e) {
    this.wecropper.touchEnd(e)
  },

  uploadTap() {
    const self = this

    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success(res) {
        const src = res.tempFilePaths[0]
        self.wecropper.pushOrign(src)
        self.setData({ hasSelectImage: true })
      }
    })
  },

  getCropperImage() {
    const self = this
    this.wecropper.getCropperImage((src) => {
      if (src) {
        //
        self.uploadSingleImage(src)
        
      } else {
        console.log('获取图片地址失败，请稍后重试')
      }
    })
  },

  uploadSingleImage: function (image) {
    const self = this
    const tyid = parseInt(self.data.ty)
    const host = config.host
    const param = {
      shopId: self.data.shopid,
      sid: self.sid
    }
    wx.showToast({
      icon: 'loading',
      title: '上传中...',
      mask: true
    })
    wx.uploadFile({
      url: config.host + '/merchant/photo/upload-front', //仅为示例，非真实的接口地址
      filePath: image,
      name: 'file',
      formData: param,
      success: function (res) {
        wx.removeStorageSync('memberinfo')
        wx.showToast({
          title: '上传成功',
          icon: 'success',
          duration: 1500,
          success: function () {
            setTimeout(() => {
              wx.navigateBack()
            }, 2000)
          }
        })
      },
      fail: function () {
        wx.hideToast()
      }
    })
  },
})
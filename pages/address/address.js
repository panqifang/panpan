// pages/address/address.js
import {
  requestGet,
  requestPOST
} from '../../assets/utils/request'

const {
  login
} = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    contact:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const self = this
    login().then(sid => {
      self.sid = sid
      let params = {
        sid: self.sid
      }
      requestGet('/address', params).then(({
        success,
        data,
        msg
      }) => {
        
        if (success && data) {
          self.setData({
            contact:data
          })
        }
      })

    })   
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  formSubmit: function (e) {
    const self = this
    // 阻止多次提交
    if (self.data.submit) {
      return
    }
    let formdata = e.detail.value
    formdata.sid = self.sid
    self.setData({
      submit: true
    })
    requestPOST('/address', formdata).then(res => {
      self.handleResult(res)
    })
  },

  handleResult: function (res) {
    const self = this
    self.setData({
      submit: false
    })
    if (res.success) {

      self.setData({
        contact: res.data
      })

      wx.showToast({
        title: '保存成功',
        icon: 'success'
       
      })
    } else {
      wx.showModal({
        title: '提示',
        content: res.msg,
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            self.onShow()
          }
        }
      })
    }
  },

})
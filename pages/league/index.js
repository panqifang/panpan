import { requestPOST } from '../../assets/utils/request'
import { unique, formatTime, isEmptyObject } from '../../assets/utils/func'
import config from '../../assets/config'
const { getScanShopQr, getScanPartner, getMemberInfo, hash } = getApp()

Page({
    data: {
        intype: '',
        mobile: '',
      addphone: config.addphone,
    },
    onLoad(options) {
        var that = this
        getMemberInfo().then(memberInfo => {
            that.data.mobile = memberInfo.user.mobile
            that.sid = wx.getStorageSync('session').sid
            that.setData({
                mobile: that.data.mobile
            })
        })
    },
    bindNameInput: function (e) {
        this.data.intype = e.detail.value
    },

    bindMobileInput: function (e) {
        this.data.mobile = e.detail.value
    },
    submit() {
        var that = this
        if (that.data.intype == '') {
            wx.showModal({
                title: '系统提示',
                content: '请选择类型',
                showCancel: false
            })
            return;
        }
        if (that.data.mobile == '') {
            wx.showModal({
                title: '系统提示',
                content: '请输入手机号码',
                showCancel: false
            })
            return;
        }
        requestPOST('/join', { sid: that.sid, mobile: that.data.mobile, type: that.data.intype }).then(function (res) {
            setTimeout(() => {
                wx.showToast({
                    title: '申请成功',
                    icon: 'success',
                    duration: 2000,
                    success: () => {
                        setTimeout(() => {
                            that.formReset()
                        }, 1000)
                    }
                })
            }, 500)
        })
    },
    formReset: function () {
        wx.switchTab({
            url: '/pages/user/index'
        })
    },
  callphone: function(e) {
    const self = this
    const mobile = e.currentTarget.dataset.mobile
    wx.makePhoneCall({
      phoneNumber: String(mobile)
    })

  }
})

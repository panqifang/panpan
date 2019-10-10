
import { requestGet, requestPOST } from '../../assets/utils/request'
import { getFloatThree } from '../../assets/utils/func'
const { getMemberInfo } = getApp()

Page({
    data: {
        load: false,
        init: false,
        showTopTips: false,
        submit: false,
        smsCodeBtnText: '获取验证码',
        mobile: ''
    },
    onLoad: function (options) {
        this.options = options
        this.setData({ load: true, init: false })
    },
    onShow: function () {
        const self = this
        getMemberInfo().then(memberinfo => {
            self.sid = wx.getStorageSync('session').sid
            self.setData({ mobile: memberinfo.user.mobile, load: false, init: true })
        })
    },
    // 绑定手机输入
    bindMobileChange: function (e) {
        this.data.mobile = e.detail.value
    },
    getSmsCode: function () {
        const self = this
        if (self.data.smsCodeBtnText === '获取验证码') {
            // 判读手机号码
            if (self.data.mobile == '') {
                return self.showErrorTip('请输入手机号码')
            }
            let n = 65
            self.setData({ smsCodeBtnText: (n + 1) + 's' })
            const timer = setInterval(function () {
                self.setData({ smsCodeBtnText: n + 's' })
                n--
                if (n < 0) {
                    self.setData({ smsCodeBtnText: '获取验证码' })
                    clearInterval(timer)
                }
            }, 1000)
            // 获取验证码
            requestPOST('/sms/send', { mobile: self.data.mobile }).then(({ success, data, msg }) => {
                if (success) {
                    wx.showToast({
                        title: '验证码已发送',
                        icon: 'success'
                    })
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
    // 提交提现信息
    formSubmit: function (e) {
        const self = this
        // 阻止多次提交
        if (self.data.submit) {
            return
        }
        let formdata = e.detail.value
        formdata.sid = self.sid
        // 检验手机号码
        if (!formdata.mobile) {
            return self.showErrorTip('请输入手机号码')
        }
        // 检验手机验证码
        if (!formdata.code) {
            return self.showErrorTip('请输入手机验证码')
        }
        self.setData({ submit: true })
        requestPOST('/sms/verify', { sid: self.sid, mobile: formdata.mobile, code: formdata.code }).then(({ success, data, msg }) => {
            if (success && data.verify) {
                requestPOST('/users/bindPhone', { sid: self.sid, mobile: formdata.mobile }).then(res => {
                    self.setData({ submit: false })
                    if (res.success) {
                        // 更新缓存数据
                        let memberinfo = wx.getStorageSync('memberinfo')
                        memberinfo.user.mobile = formdata.mobile
                        wx.setStorageSync('memberinfo', memberinfo)
                        self.setData({ mobile: formdata.mobile })
                        // tip
                        wx.showToast({
                            title: '绑定成功',
                            icon: 'success',
                            success: function () {
                                wx.navigateBack()
                            }
                        })
                    } else {
                        wx.showModal({
                            title: '提示',
                            content: res.msg,
                            showCancel: false
                        })
                    }
                })
            } else {
                self.setData({ submit: false })
                wx.showModal({
                    title: '提示',
                    content: msg,
                    showCancel: false
                })
            }
        })

    },
    // 弹出错误提示
    showErrorTip: function (text) {
        const self = this
        self.setData({ showTopTips: true, errorText: text })
        setTimeout(() => {
            self.setData({ showTopTips: false })
        }, 3000)
    }
})

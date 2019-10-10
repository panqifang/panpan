
import { requestPOST } from '../../assets/utils/request'
import config from '../../assets/config'

const { getMemberInfo } = getApp()

Page({
    data: {
        appname: config.name,
        mobile: '',
        code: '',
        load: false,
        canSubmit: false,
        init: false
    },
    onLoad: function (options) {
        this.options = options
        this.setData({ load: true })
    },
    onShow: function () {
        const self = this
        getMemberInfo().then(memberinfo => {
            self.sid = wx.getStorageSync('session').sid
            self.role = memberinfo.user.role
            if (self.options.code) {
                self.data.code = self.options.code
            }
            // 绑定手机才能执行
            if (memberinfo.user.mobile) {
                self.data.mobile = memberinfo.user.mobile
            } else {
                wx.navigateTo({
                    url: '/pages/bindmobile/index',
                })
            }
            self.setData({ init: true, load: false })
        })
    },
    // 执行绑定
    toPartnerTap: function () {
        const self = this
        if (self.role != 10) {
            wx.showModal({
                title: '提示',
                content: '你不是用户角色，无法开店',
                showCancel: false
            })
            return
        }
        let params = { code: self.data.code, sid: self.sid }
        if (self.data.mobile) {
            params.mobile = self.data.mobile
        } 
        self.setData({ canSubmit: true })
        wx.showLoading({
            title: '提交中',
            mask: true
        })
        requestPOST('/shops', params).then(({ success, data, msg }) => {
            self.setData({ canSubmit: false })
            wx.hideLoading()
            if (success) {
                wx.removeStorageSync('memberinfo')
                wx.showToast({
                    title: '申请成功',
                    icon: 'success',
                    success: () => {
                        setTimeout(() => {
                            wx.redirectTo({
                                url: '/pages/shopsetting/index',
                            })
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
    }
})
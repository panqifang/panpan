
import { requestPOST } from '../../assets/utils/request'
import config from '../../assets/config'

const { getMemberInfo } = getApp()

Page({
    data: {
        appname: config.name,
        mobile: '',
        uid: 0,
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
            console.log(self.options)
            self.sid = wx.getStorageSync('session').sid
            if (self.options.uid) {
                self.data.uid = self.options.uid
            } else if (self.options.scene) {
                const scene = self.options.scene
                const uidarr = scene.split('#')
                self.data.uid = uidarr[1]
            }
            self.setData({ init: true, load: false })
        })
    },
    // 执行绑定
    toPartnerTap: function () {
        const self = this
        const uid = self.data.uid
        let params = { serviceUid: uid, sid: self.sid }
        if (self.data.mobile) {
            params.mobile = self.data.mobile
        }
        self.setData({ canSubmit: true })
        wx.showLoading({
            title: '提交中',
            mask: true
        })
        requestPOST('/shops/bindPn', params).then(({ success, data, msg }) => {
            self.setData({ canSubmit: false })
            wx.hideLoading()
            if (success) {
                wx.removeStorageSync('memberinfo')
                wx.showToast({
                    title: '申请成功',
                    icon: 'success',
                    success: () => {
                        setTimeout(() => {
                            wx.reLaunch({
                                url: '/pages/user/index',
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
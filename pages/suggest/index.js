
import { requestPut, requestGet } from '../../assets/utils/request'

const { getMemberInfo, modules } = getApp()

Page({
    data: {
        load: false,
        init: false,
        num: 0,

        shoplists: [],
        role: 0,
        phone: '',
        size: 10,
        can: 0,
        shopName: '请选择要投诉的店铺',
        shopid: 0
    },
    onLoad: function (options) {
        const self = this
        this.options = options
        this.setData({ load: true })
        getMemberInfo().then(memberinfo => {
            self.sid = wx.getStorageSync('session').sid
            requestGet('/shops/last-consume-list', { sid: self.sid }).then(({ success, data, msg }) => {
                if (success) {
                    self.setData({ load: false, init: true })
                    if (data.length > 0) {
                        self.data.shoplists = data
                        self.data.can = 0
                        self.setData({ shoplists: self.data.shoplists, can: self.data.can })
                    } else {
                        self.data.shoplists = []
                        self.data.can = 1
                        self.setData({ shoplists: self.data.shoplists, can: self.data.can })
                    }
                }
            })
            
        })
    },
    // 计数
    countInputNum: function (e) {
        const val = e.detail.value.length
        this.setData({ num: val })
    },
    // 选择店铺
    shopPickerChange: function (e) {
        const self = this
        let item = self.data.shoplists[e.detail.value]
        self.data.shopid = item.shopid
        self.setData({ shopName: item.title })
    },
    //----------------- ddh end -------------------
    // 提交提现信息
    formSubmit: function (e) {
        const self = this
        // 阻止多次提交
        // if (self.data.submit) {
        //     return
        // }
        let formdata = e.detail.value

        // 追加参数
        let baseParam = {
            sid: self.sid,
            shopid: self.data.shopid
        }
        wx.showLoading({
            title: '提交中',
            mask: true
        })
        let params = Object.assign(baseParam, formdata)
        requestPut('/suggests', params).then(({ success, data, msg }) => {
            wx.hideLoading()
            if (success) {
                wx.showToast({
                    title: '提交成功',
                    icon: 'success',
                    success: function () {
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
    }

})
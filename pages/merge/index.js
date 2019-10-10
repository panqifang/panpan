
import { requestPOST, requestGet } from '../../assets/utils/request'

const { getMemberInfo, modules } = getApp()

Page({
    data: {
        items: [],
        uids: [],
        nodata: false,
        uid: 0,
        load: false,
        init: false
    },
    onLoad: function (options) {
        const self = this
        this.options = options
        this.setData({ load: true })
        getMemberInfo().then(memberinfo => {
            self.sid = wx.getStorageSync('session').sid
            requestGet('/data-transfer/users', { sid: self.sid, mobile: memberinfo.user.mobile }).then(({ success, data, msg }) => {
                self.setData({ load: false })
                if (success) {
                    
                    if (data.length > 0) {
                        for (var i = 0; i < data.length; i++) {
                            self.data.uids.push(data[i].uid)
                            data[i].create_time = formatTime(data[i].create_time)
                        }
                        self.setData({
                            items: data,
                            init: true
                        })
                    } else {
                        self.setData({
                            nodata: true
                        })
                    }
                } else {
                    wx.showModal({
                        title: '提示',
                        content: msg,
                        showCancel: false
                    })
                }
            })

        })
    },

    mergeClic: function () {
        var that = this
        var uids = that.data.uids.join(',')
        wx.showModal({
            title: '系统提示',
            content: '以当前登陆用户为主账号进行数据合并？',
            showCancel: false,
            confirmText: '确认合并',
            success: function (res) {
                if (res.confirm && that.data.uid != 0) {
                    requestPOST('/data-transfer/merge', { targetUid: that.data.uid, sourceUids: uids, sid: self.sid }).then(({ success, data, msg }) => {
                        if (success) {
                            wx.showToast({
                                title: '合并成功',
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
            }
        })
    }
})
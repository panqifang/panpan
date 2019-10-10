import { requestGet } from '../../assets/utils/request'
import { formatTim, formatDate } from '../../assets/utils/func'
const { getMemberInfo } = getApp()

Page({
    data: {
        startDate: '',
        endDate: '',
        data: {},
        role: 0,
        beginStartTime: '',
        beginEndTime: '',
        lastStartTime: '',
        lastEndTime: ''
    },
    onLoad: function (options) {
        const self = this
    },
    onShow: function () {
        var that = this
        var endDate = formatDate(new Date())
        var startDate = formatDate(new Date().setDate(new Date().getDate() - 180) / 1000)

        // 初始化可查询的时间段
        //
        that.data.beginStartTime = startDate
        that.data.beginEndTime = formatDate(new Date().setDate(new Date().getDate() - 1) / 1000)
        //
        that.data.lastStartTime = formatDate(new Date().setDate(new Date().getDate() - 179) / 1000)
        that.data.lastEndTime = endDate
        // 默认显示半年的
        that.data.startDate = that.data.beginStartTime
        that.data.endDate = that.data.lastEndTime

        getMemberInfo().then(memberInfo => {
            that.sid = wx.getStorageSync('session').sid
            that.setData({
                startDate: that.data.startDate,
                endDate: that.data.endDate,
                role: memberInfo.user.role,
                beginStartTime: that.data.beginStartTime,
                beginEndTime: that.data.beginEndTime,
                lastStartTime: that.data.lastStartTime,
                lastEndTime: that.data.lastEndTime
            })
            wx.showLoading({
                title: '获取数据中',
            })
            that.getMoenyLog(that.data.startDate, that.data.endDate)
        })
    },
    onPullDownRefresh: function () {
        const self = this
        self.onShow()
    },
    getMoenyLog(startDate, endDate) {
        var that = this
        requestGet('/orders/my-count', { startDate: startDate, endTime: endDate, sid: that.sid }).then(({ success, data, msg }) => {
            wx.hideLoading()
            wx.stopPullDownRefresh()
            if (success) {
                that.setData({
                    data: data
                })
            } else {
                wx.showModal({
                    title: '提示',
                    content: msg,
                    showCancel: false
                })
            }
        })
    },
    bindStartDateChange(e) {
        var date = e.detail.value
        var lastStartTime = Date.parse(date) / 1000 + 24 * 3600
        lastStartTime = formatDate(lastStartTime)
        this.setData({ lastStartTime: lastStartTime, startDate: date })
        wx.showLoading({
            title: '获取数据中',
        })
        this.getMoenyLog(date, this.data.lastEndTime)
    },
    bindEndDateChange(e) {
        var date = e.detail.value
        var beginEndTime = Date.parse(date) / 1000 - 24 * 3600
        beginEndTime = formatDate(beginEndTime)
        this.setData({ beginEndTime: beginEndTime, endDate: date })
        wx.showLoading({
            title: '获取数据中',
        })
        this.getMoenyLog(this.data.beginStartTime, date)
    }
})

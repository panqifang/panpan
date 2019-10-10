import { requestGet, requestPOST } from '../../assets/utils/request'
import { formatMoney } from '../../assets/utils/func'
import wxCharts from '../../assets/utils/wxcharts'

const { getMemberInfo } = getApp()

// 定义line 图表
var lineChart = null;
// 定义area 图表
var areaChart = null;

Page({

    data: {
        orderid: 0,
        shopid: 19,
        slot: 0,
        areaChart: {},
        lineChart: {},
        cash: 0,
        role: 0,
        load: false,
        init: false
    },

    onLoad: function (options) {
        const self = this
        if (options.orderid) {
            self.data.orderid = options.orderid
        }
        if (options.shopid) {
            self.data.shopid = options.shopid
        }
        if (options.slot) {
            self.setData({ slot: options.slot })
        }
        if (options.cash) {
            self.data.cash = options.cash
        }
        self.setData({ load: true })
    },
    onShow: function () {
        const self = this
        getMemberInfo().then(memberInfo => {
            self.sid = wx.getStorageSync('session').sid
            self.data.role = memberInfo.user.role
            self.setData({ cash: self.data.cash })
            // 加载图表数据
            self.loadLineData()
            self.loadAreaData()
        })
    },
    // 加载line图表数据
    loadLineData: function () {
        const self = this
        var windowWidth = 320;
        try {
            var res = wx.getSystemInfoSync();
            windowWidth = res.windowWidth;
        } catch (e) {
            console.error('getSystemInfoSync failed!');
        }

        this.createSimulationData().then(simulationData => {
            self.data.lineChart = new wxCharts({
                canvasId: 'lineCanvas',
                type: 'line',
                categories: simulationData.categories,
                animation: true,
                series: [{
                    name: '消费人次',
                    data: simulationData.data
                }],
                xAxis: {
                    disableGrid: true
                },
                yAxis: {
                    title: '奖励比例 (0% - 100%)',
                    format: function (val) {
                        let yText = formatMoney(val.toFixed(2)) * 100
                        return yText + '%';
                    },
                    min: 0,
                    max: 1
                },
                width: windowWidth,
                height: 200,
                dataLabel: false,
                dataPointShape: false,
                extra: {
                    lineStyle: 'curve'
                }
            });

        })
    },
    // 加载区域图表数据
    loadAreaData: function () {
        const self = this
        var windowWidth = 320;
        try {
            var res = wx.getSystemInfoSync();
            windowWidth = res.windowWidth;
        } catch (e) {
            console.error('getSystemInfoSync failed!');
        }
        self.getOrderlog().then(data => {
            const maxShow = Math.max.apply(null, data) * 1.5
            let back = data
            let num = [];
            data.forEach((item, i) => {
                num.push((i + 1))
            })
            self.data.areaChart = new wxCharts({
                canvasId: 'areaCanvas',
                type: 'column',
                categories: num,
                animation: true,
                series: [{
                    name: '最近奖励',
                    data: data,
                    format: function (val) {
                        return val;
                    }
                }],
                yAxis: {
                    title: '奖励金额（元）',
                    format: function (val) {
                        return val.toFixed(2);
                    },
                    min: 0,
                    max: maxShow
                },
                xAxis: {
                    disableGrid: true
                },
                extra: {
                    legendTextColor: ''
                },
                width: windowWidth,
                height: 200
            });
        })
    },


    touchLineHandler: function (e) {
        const self = this
        self.data.lineChart.showToolTip(e, {
            // background: '#7cb5ec',
            format: function (item, category) {
                console.log(item.data)
                return '奖励比例:' + Math.floor(item.data * 10000) / 10000 * 100 + '%'
            }
        });
    },
    // 获取奖励数据
    createSimulationData: function () {
        const self = this
        return new Promise((resolve) => {
            requestGet('/merchant/my-order', { page: 1, shopId: self.data.shopid, size: 20, sid: self.sid }).then(({ success, data, msg }) => {
                self.setData({ load: false, init: true })
                if (success) {
                    const listdata = data.list
                    var categories = [];
                    var result = [];
                    listdata.forEach((item, i) => {
                        if (i < 20) {
                            let momey = 0
                            if (item.switcher == 4 || item.switcher == 12) {
                                const imoney = Math.floor(item.intelligenceBackMoney * 100) / 100
                                momey = imoney / item.total_fee
                            } else {
                                momey = item.money / item.total_fee
                            }
                            categories.push((i + 1));
                            result.push(momey);
                        }

                    })
                    resolve({
                        categories: categories,
                        data: result
                    })
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
    topBackingList: function () {
        const self = this
        wx.navigateTo({
            url: '/pages/shopbacking/index?shopid=' + self.data.shopid
        })
    },
    // 获取订单的缓存记录
    getOrderlog: function () {
        const self = this
        return new Promise((resolve) => {
            // 获取缓存数据
            let curArr = wx.getStorageSync('orderData')
            // 获取当前缓存店铺数据
            const key = self.data.shopid + '-' + self.data.orderid
            const curdata = curArr[key]
            // 返回最后个
            const arr = curdata.money
            let resarr = []
            arr.forEach((item, i) => {
                if (arr.length <= 5) {
                    resarr.push(item)
                } else {
                    if (i >= arr.length - 5) {
                        resarr.push(item)
                    }
                }
            })
            resolve(resarr)
        })
    },
    // 智能发订单操作消除订单
    removeQueueTap: function (e) {
        const self = this
        // 仅仅允许用户自己操作
        if (self.data.role !== 10) {
            return
        }
        wx.showModal({
            title: '系统提示',
            content: '温馨提示：领取后将停止本单消费奖励继续等待可得到商家更多奖励, 具体以实际到账为准',
            cancelText: '领取',
            confirmText: '等待',
            success: function (res) {
                if (res.confirm) {
                    
                } else if (res.cancel) {
                    // 执行退出
                    wx.showLoading({
                        title: '执行领取中',
                        mask: true
                    })
                    requestPOST('/intelligenceBack/getBackMoney', { orderid: self.data.orderid, top: self.data.slot, sid: self.sid }).then(({ success, data, msg }) => {
                        if (success) {
                            wx.showToast({
                                title: '领取成功',
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
    },
})
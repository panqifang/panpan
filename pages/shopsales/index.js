import {
  formatTime,
  formatDate
} from '../../assets/utils/func'
import {
  requestGet
} from '../../assets/utils/request'
import config from '../../assets/config'
const {
  login
} = getApp()

Page({
  data: {
    totaFees: 0,
    total: 0,
    totalSales: 0,
    discout: 0,
    // 
    startDate: '',
    endDate: '',
    startTime: '',
    lastTime: '',
    //
    beginStartDate: '',
    beginEndDate: '',
    lastStartDate: '',
    lastEndDate: '',
    //
    beginEndTime: '',
    lastStartTime: '',
    lastEndTime: '',
    //
    canMore: true,
    time: '12:23',
    // 结果时间
    beginTime: '',
    endTime: '',

    orders: [],
    load: false,
    nodata: false,
    more: false,
    init: false,
    category: 0,
  },
  onLoad: function(options) {
    const self = this
    // 加载中
    self.shopid = 0
    if (options.shopid) {
      self.shopid = options.shopid
    }
    // 获取时间
    var thisDate = new Date()
    // 获取当前日期作为结束日期
    var endDate = formatDate(thisDate)
    // 获取前一天作为开始日期
    thisDate.setDate(thisDate.getDate() - 0);
    var startDate = formatDate(thisDate)
    // 获取当前时间作为最后时间
    var lastTime = thisDate.getHours() + ':' + thisDate.getMinutes()
    var startTime = '00:00'
    // 初始化可查询的时间段
    self.data.startDate = startDate
    self.data.endDate = endDate
    self.data.lastTime = lastTime
    self.data.startTime = startTime
    // 
    self.data.beginTime = startDate + ' ' + startTime
    self.data.endTime = endDate + ' ' + lastTime
    // 
    // 渲染日期
    self.setData({
      endDate: self.data.endDate,
      startDate: self.data.startDate,
      lastTime: self.data.lastTime,
      startTime: self.data.startTime,
      beginEndDate: self.data.endDate,
      lastEndDate: self.data.endDate,
      lastStartDate: self.data.startDate,
      lastEndTime: lastTime
    })
    wx.showLoading({
      title: '数据加载中',
      mask: true
    })
  },
  onShow: function() {
    const self = this
    login().then(sid => {
      self.sid = sid
      self.init()
    })
  },
  init: function() {
    const self = this
    let params = {
      page: 1,
      size: 10,
      sid: self.sid,
      shopid: self.shopid,
      beginTime: self.data.beginTime,
      endTime: self.data.endTime,
      category: self.data.category
    }
    requestGet('/merchant/sales-between-time', params).then(({
      success,
      data,
      msg
    }) => {
      wx.stopPullDownRefresh()
      wx.hideLoading()

      if (success) {
        self.nextPage = data.nextPage
        self.canMore = true
        let list = data.list
        if (list && list.length > 0) {
          list.forEach((item, i) => {
            if (!item.nickname) {
              item.nickname = '未允许获取昵称'
            }
            item.create_time = formatTime(item.create_time)
          })
          self.setData({
            nodata: false,
            orders: list,
            total: data.total,
            totalSales: data.totalSales,
            discout: data.discout,
            totaFees: data.totaFees
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
  },
  onPullDownRefresh: function() {
    const self = this
    self.onShow()
  },
  // 开始选择日期
  bindStartDateChange: function(e) {
    const self = this
    const time = e.detail.value
    wx.showLoading({
      title: '数据加载中',
      mask: true
    })
    // 判断是否今天
    let thisDate = new Date()
    let curDate = formatDate(thisDate)
    let lastd = thisDate.getHours() + ':' + thisDate.getMinutes()
    if (time == curDate) {
      self.data.beginEndTime = lastd
      self.data.lastEndTime = lastd
    } else {
      self.data.beginEndTime = ''
      self.data.lastEndTime = ''
    }
    self.setData({
      startDate: time,
      lastStartDate: time,
      orders: [],
      beginEndTime: self.data.beginEndTime,
      lastEndTime: self.data.lastEndTime,
      lastTime: lastd,
      startTime: '00:00'
    })
    self.data.beginTime = time + ' ' + self.data.startTime
    self.init()
  },
  bindStartTimeChange: function(e) {
    const self = this
    const time = e.detail.value
    wx.showLoading({
      title: '数据加载中',
      mask: true
    })
    let thisDate = new Date()
    let curDate = formatDate(thisDate)
    let lastd = thisDate.getHours() + ':' + thisDate.getMinutes()
    if (self.data.startDate == self.data.endDate) {
      self.data.lastStartTime = time
      self.data.beginEndTime = lastd
    } else {
      self.data.lastStartTime = ''
      self.data.beginEndTime = ''
    }
    self.setData({
      startTime: time,
      orders: [],
      lastStartTime: self.data.lastStartTime,
      beginEndTime: self.data.beginEndTime
    })
    self.data.beginTime = self.data.startDate + ' ' + time
    self.init()
  },
  // 结束选择时间
  bindEndDateChange: function(e) {
    const self = this
    const time = e.detail.value
    wx.showLoading({
      title: '数据加载中',
      mask: true
    })
    // 判断是否今天
    let thisDate = new Date()
    let curDate = formatDate(thisDate)
    let lastd = thisDate.getHours() + ':' + thisDate.getMinutes()
    if (time == curDate) {
      self.data.beginEndTime = lastd
      self.data.lastEndTime = lastd
      self.data.lastTime = lastd
    } else {
      self.data.beginEndTime = ''
      self.data.lastEndTime = ''
      self.data.lastTime = '00:00'
    }
    self.setData({
      endDate: time,
      beginEndDate: time,
      orders: [],
      beginEndTime: self.data.beginEndTime,
      lastEndTime: self.data.lastEndTime,
      lastTime: self.data.lastTime
    })
    self.data.endTime = time + ' ' + self.data.lastTime
    self.init()
  },
  bindEndTimeChange: function(e) {
    const self = this
    const time = e.detail.value
    wx.showLoading({
      title: '数据加载中',
      mask: true
    })
    let thisDate = new Date()
    let curDate = formatDate(thisDate)
    let lastd = thisDate.getHours() + ':' + thisDate.getMinutes()
    if (self.data.startDate == self.data.endDate) {
      self.data.beginEndTime = time
    } else {
      self.data.beginEndTime = ''
    }
    self.setData({
      lastTime: time,
      orders: [],
      beginEndTime: self.data.beginEndTime
    })
    self.data.endTime = self.data.endDate + ' ' + time
    self.init()
  },
  onReachBottom: function() {
    const self = this
    if (self.canMore && self.nextPage && self.nextPage !== 0) {
      self.setData({
        more: true
      })
      self.canMore = false
      let params = {
        page: self.nextPage,
        size: 6,
        sid: self.sid,
        shopid: self.shopid,
        beginTime: self.data.beginTime,
        endTime: self.data.endTime,
        category: self.data.category 
      }
      requestGet('/merchant/sales-between-time', params).then(({
        success,
        data,
        msg
      }) => {
        self.setData({
          more: false
        })
        if (success) {
          self.nextPage = data.nextPage
          let list = data.list
          if (list && list.length > 0) {
            list.forEach((item, i) => {
              if (!item.nickname) {
                item.nickname = '未允许获取昵称'
              }
              item.create_time = formatTime(item.create_time)
              self.data.orders.push(item)
            })
            self.setData({
              orders: self.data.orders
            })
            self.canMore = true
          }
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
  // 导出
  export: function() {
    const self = this
    let downUrl = config.host + '/merchant/sales/export?sid=' + self.sid + '&date=' + self.data.startDate + '&endDate=' + self.data.endDate
    wx.showModal({
      title: '导出提示',
      content: '默认以开始日期为时间进行导出，是否继续',
      confirmText: '文档导出',
      cancelText: '复制下载',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '导出中，请稍后',
            mask: true
          })

          wx.downloadFile({
            url: downUrl,
            success: function(downRes) {
              wx.hideLoading()
              if (downRes.statusCode === 200) {
                wx.showLoading({
                  title: '保存中，请稍后',
                  mask: true
                })
                wx.saveFile({
                  tempFilePath: downRes.tempFilePath,
                  success: function(saveRes) {
                    wx.hideLoading()
                    wx.showModal({
                      title: '下载提示',
                      content: '文件保存路径：' + saveRes.savedFilePath,
                      confirmText: '打开文档',
                      success: function(tipRes) {
                        if (tipRes.confirm) {
                          wx.openDocument({
                            filePath: saveRes.savedFilePath,
                            success: function(openRes) {
                              console.log('打开文档成功')
                            }
                          })
                        }
                      }
                    })
                  }
                })
              }
            }
          })
        }
        if (res.cancel) {
          wx.setClipboardData({
            data: downUrl,
            success: function(copyRes) {
              wx.showModal({
                title: '复制成功',
                content: '请打开手机浏览器粘贴下载',
                showCancel: false
              })
            }
          })
        }
      }
    })
  }
})
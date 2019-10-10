import {
  requestGet,
  requestPOST
} from '../../assets/utils/request'
import {
  getFloatThree
} from '../../assets/utils/func'
const {
  login
} = getApp()

Page({
  data: {
    cashInfo: {},
    load: false,
    init: false,
    showTopTips: false,
    submit: false,
    cashType: '',
    cashAllMoney: 0,
    smsCodeBtnText: '获取验证码',
    mobile: '',
    // xuan
    inputShowed: false,
    inputVal: "",
    showbanks: [],
    showBank: false,
    bankid: ''
  },
  onLoad: function(options) {
    this.options = options
    if (options.type) {
      this.data.cashType = options.type
    }
    this.setData({
      load: true,
      cashType: this.data.cashType
    })
  },
  onShow: function() {
    const self = this
    login().then(sid => {
      self.sid = sid
      let params = {
        sid: self.sid
      }
      // 商户提现带shopid，
      if (self.options.shopid) {
        params.shopid = self.options.shopid
      }
      requestGet('/cash-back', params).then(({
        success,
        data,
        msg
      }) => {
        self.setData({
          load: false
        })
        if (success && data) {
          // 合并提现处理
          if (self.options.type == 'all') {
            const cash = getFloatThree(data.cash)
            const max = getFloatThree(data.maxmoney)
            const min = getFloatThree(data.minmoney)
            self.data.cashAllMoney = cash
            if (cash * 1000 < min * 1000) {
              self.data.cashAllMoney = 0
            }
            if (cash * 1000 > max * 1000) {
              self.data.cashAllMoney = max
            }
            console.log(self.data.cashAllMoney)
          }
          // 判断是否需要选择银行
          if (data.bank_list.length > 0) {
            self.data.bankName = '请选择银行',
              data.bank_list.forEach((item, i) => {
                if (item.bank_id == data.bank_id) {
                  self.data.bankName = item.bank_name
                  self.data.bank_id = data.bank_id
                  self.data.bankid = data.bank_id
                }
              })
          }
          self.setData({
            cashInfo: data,
            mobile: data.mobile,
            cashAllMoney: self.data.cashAllMoney,
            bankName: data.bankName || [],
            init: true,
            bankid: self.data.bankid,
            payment: data.payment
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
  // 绑定手机输入
  bindMobileChange: function(e) {
    this.data.mobile = e.detail.value
  },
  getSmsCode: function() {
    const self = this
    if (self.data.smsCodeBtnText === '获取验证码') {
      // 判读手机号码
      if (self.data.mobile == '') {
        return self.showErrorTip('请输入手机号码')
      }
      let n = 65
      self.setData({
        smsCodeBtnText: (n + 1) + 's'
      })
      const timer = setInterval(function() {
        self.setData({
          smsCodeBtnText: n + 's'
        })
        n--
        if (n < 0) {
          self.setData({
            smsCodeBtnText: '获取验证码'
          })
          clearInterval(timer)
        }
      }, 1000)
      // 获取验证码
      requestPOST('/sms/send', {
        mobile: self.data.mobile
      }).then(({
        success,
        data,
        msg
      }) => {
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
  formSubmit: function(e) {
    const self = this
    // 阻止多次提交
    if (self.data.submit) {
      return
    }
    let formdata = e.detail.value
    formdata.sid = self.sid
    if (self.data.payment != 'wechat') {


      // 需要选择银行
      if (self.data.cashInfo.bank_list.length > 0) {
        if (self.data.bankName == '请选择银行') {
          return self.showErrorTip('请选择银行')
        }
      }
      // 检验银行卡
      if (!formdata.card) {
        return self.showErrorTip('请输入银行卡号')
      }
      // 检验银行卡对应姓名
      if (!formdata.realname) {
        return self.showErrorTip('请输入银行卡号对应姓名')
      }
      // 检验手机号码
      if (!formdata.mobile) {
        return self.showErrorTip('请输入手机号码')
      }
      // 检验手机验证码
      if (!formdata.smscode) {
        return self.showErrorTip('请输入手机验证码')
      }
    }
    const cash = getFloatThree(self.data.cashInfo.cash)
    const max = getFloatThree(self.data.cashInfo.maxmoney)
    const min = getFloatThree(self.data.cashInfo.minmoney)

    // 如果是合并提现 不检验余额
    if (self.data.cashType == 'all') {
      if (cash * 1000 < min * 1000) {
        return self.showErrorTip('最低提现' + min + '元')
      }
      if (cash * 1000 > max * 1000) {
        formdata.cash = max
        wx.showModal({
          title: '提示',
          content: '你当次最大只能提现' + max + '元',
          success: function(res) {
            if (res.confirm) {
              self.setData({
                submit: true
              })
              self.submitCashOut(formdata)
            }
          }
        })
      } else {
        formdata.cash = cash
        self.setData({
          submit: true
        })
        self.submitCashOut(formdata)
      }
    } else {
      // 检验余额
      formdata.cash = getFloatThree(formdata.cash)
      if (formdata.cash <= 0) {
        return self.showErrorTip('请输入提现金额')
      }
      if (formdata.cash * 1000 > cash * 1000) {
        return self.showErrorTip('要提现的余额不足')
      }
      if (formdata.cash * 1000 < min * 1000) {
        return self.showErrorTip('最低提现' + min + '元')
      }
      if (formdata.cash * 1000 > max * 1000) {
        return self.showErrorTip('最大提现' + max + '元')
      }
      self.setData({
        submit: true
      })
      self.submitCashOut(formdata)
    }
  },
  // 弹出错误提示
  showErrorTip: function(text) {
    const self = this
    self.setData({
      showTopTips: true,
      errorText: text
    })
    setTimeout(() => {
      self.setData({
        showTopTips: false
      })
    }, 3000)
  },
  // 执行提现
  submitCashOut: function(formdata) {
    const self = this
    if (self.data.payment == 'wechat') {
      self.doCash(formdata)
    } else
      requestPOST('/sms/verify', {
        sid: self.sid,
        mobile: formdata.mobile,
        code: formdata.smscode
      }).then(({
        success,
        data,
        msg
      }) => {
        console.log(data)
        if (success && data.verify) {
          self.doCash(formdata)
        } else {
          self.setData({
            submit: false
          })
          wx.showModal({
            title: '提示',
            content: msg,
            showCancel: false
          })
        }
      })
  },
  doCash: function(formdata) {
    const self = this
    // 提现只能两位小数点
    formdata.cash = Math.floor(formdata.cash * 100) / 100
    // 如果是合并提现 不检验余额
    if (self.data.cashType == 'all') {
      self.cashAll(formdata)
    } else {
      self.cashOne(formdata)
    }
  },
  // 执行单个提现
  cashOne: function(formdata) {
    const self = this
    if (self.options.shopid) {
      formdata.shopid = self.options.shopid
    }
    if (self.data.bank_id) {
      formdata.bank_id = self.data.bank_id
    }
    requestPOST('/cash-back', formdata).then(res => {
      self.handleResult(res)
    })
  },
  // 执行合并提现
  cashAll: function(formdata) {
    const self = this
    if (self.data.bank_id) {
      formdata.bank_id = self.data.bank_id
    }
    requestPOST('/cash-back/agent-cashout', formdata).then(res => {
      self.handleResult(res)
    })
  },
  handleResult: function(res) {
    const self = this
    self.setData({
      submit: false
    })
    if (res.success) {
      wx.showToast({
        title: '提现申请成功提交',
        icon: 'success',
        success: () => {
          wx.removeStorageSync('memberinfo')
          setTimeout(() => {
            wx.navigateBack()
          }, 1000)
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: res.msg,
        showCancel: false,
        success: function(res) {
          if (res.confirm) {
            self.onShow()
          }
        }
      })
    }
  },

  // serrch
  showInput: function() {
    this.setData({
      inputShowed: true
    });
  },
  hideInput: function() {
    this.setData({
      inputShowed: false
    });
  },
  clearInput: function() {
    this.setData({
      inputVal: "",
      showbanks: this.data.cashInfo.bank_list
    });
  },
  // 弹出选择选择开户银行
  selectkhBank: function() {
    this.setData({
      showBank: true,
      showbanks: this.data.cashInfo.bank_list
    })
  },
  // 关闭选择
  toggleBottomPopup: function() {
    this.setData({
      showBank: false,
    })
  },
  // 查询银行
  inputTyping: function(e) {
    const self = this
    let val = e.detail.value
    const banks = self.data.cashInfo.bank_list
    let newBanks = []
    banks.forEach((item, i) => {
      if (item.bank_name.indexOf(val) >= 0) {
        newBanks.push(item)
      }
    })
    self.setData({
      showbanks: newBanks,
      inputVal: val
    })
  },
  selectCashOutBank: function(e) {
    const self = this
    let bankinfo = e.currentTarget.dataset.bank
    self.data.bankName = bankinfo.bank_name
    self.data.bank_id = bankinfo.bank_id
    self.setData({
      bankid: self.data.bank_id,
      bankName: self.data.bankName,
      showBank: false,
    })
  }
})
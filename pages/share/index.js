import { requestGet, requestPOST } from '../../assets/utils/request'
import { formatTime } from '../../assets/utils/func'
import config from '../../assets/config'
const { getMemberInfo, hash } = getApp()

Page({
    data: {
        role: 0,
        uid: 0,
        shop: {},
        data: {},
        momey: 0,
        shopid: 0,
        code: '',
        timeStr: '',
        timer: null,
        isend: false,
        endTime: 0,
        timerTwo: null,
        shareshow: false,
        nodata: false,
        optime: '',
        clotime: '',
        ruleshow: false,
        ruleOne: [],
        ruleTwo: [],
        ruleThree: [],
        rules: [],
        orderid: ''
    },
    onLoad: function (options) {
        const self = this
        console.log(options)
        if (options.scene) {
            const senceArr = options.scene.split('-')
            let params = {}
            if (senceArr[0]) {
                params.pid = senceArr[0]
            }
            if (senceArr[1]) {
                params.shopid = senceArr[1]
            }
            this.options = params
        } else {
            this.options = options
        }
    },
    onShow: function () {
        const self = this
        getMemberInfo().then(userinfo => {
            self.data.role = userinfo.user.role
            self.sid = wx.getStorageSync('session').sid
            self.data.shopid = self.options.shopid
            self.data.uid = userinfo.user.uid
            self.setData({ role: self.data.role })
            if (self.data.role == 10) {
                const pid = self.options.pid
                // 不绑定自己
                if (self.data.uid != pid) {
                    requestPOST('/users/user-bind', { pid: pid, sid: self.sid, shopid: self.data.shopid }).then(res => {
                        console.log(res);
                    })
                }
                self.countTime();
            } else if (self.data.role == 20) {
                self.data.shopid = userinfo.shop.shopid
                self.data.code = userinfo.shop.code
                self.countTime();
            } else {
                self.setData({ nodata: true })
            }
            requestGet('/rule', {}).then(res => {
                if (res.success) {
                    self.data.ruleOne = self.createActiveList(res.data.one)
                    self.data.ruleTwo = self.createActiveList(res.data.two)
                    self.data.ruleThree = self.createActiveList(res.data.three)
                }
            })
        })
    },

    createActiveList: function (val) {
        let result = []
        if (!val) {
            return result
        }
        if (val.indexOf('\n') === -1) {
            return [val]
        }
        const arr = val.split('\n')
        return arr
    },
    countdate: function (config) {
        const optime = this.UnixToDate(config.open_time - 28800)
        const closetime = this.UnixToDate(config.close_time - 28800)
        this.setData({ optime: optime, clotime: closetime })
    },

    countTime: function () {
        const self = this
        // 获取登陆sid
        requestGet('/shops/cycle-info', { sid: self.sid, shopid: self.data.shopid }).then(resdata => {
            clearInterval(self.data.timer);
            const result = resdata.data
            const nowDate = Date.parse(new Date()) / 1000;
            let endtime = result.end_time
            const date = endtime - nowDate
            self.data.endTime = date
            if (date > 0) {
                self.data.isend = false
                self.countDown(date);
            } else {
                self.data.isend = true
            }
            self.countdate(result.config)
            self.setData({ momey: result.pool_bottom, isend: self.data.isend, shop: result.shop })
        })
    },

    //带天数的倒计时
    countDown: function (times) {
        const self = this
        self.data.timer = setInterval(function () {
            self.countFive(times)
            let day = 0,
                hour = 0,
                minute = 0,
                second = 0; //时间默认值
            if (times > 0) {
                hour = Math.floor(times / (60 * 60));
                minute = Math.floor(times / 60) - (day * 24 * 60) - (hour * 60);
                second = Math.floor(times) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60);
            }
            if (hour <= 9) hour = '0' + hour;
            if (minute <= 9) minute = '0' + minute;
            if (second <= 9) second = '0' + second;
            //
            const timeStr = hour + ":" + minute + ":" + second
            self.setData({ timeStr: timeStr })
            times--;
        }, 1000);
        if (times <= 0) {
            clearInterval(self.data.timer);
            self.setData({ isend: true })
        }
    },

    countFive: function (times) {
        const self = this;
        const time = 5 * 60;
        if (times <= time && !self.data.timerTwo) {
            console.log('start')
            self.data.timerTwo = setInterval(function () {
                // 获取登陆sid
                requestGet('/shops/cycle-info', { sid: self.sid, shopid: self.data.shopid }).then(resdata => {
                    clearInterval(self.data.timer);
                    const result = resdata.data
                    let endtime = result.end_time
                    const nowDate = Date.parse(new Date()) / 1000;
                    const date = endtime - nowDate
                    self.countdate(result.config)
                    self.data.endTime = date
                    if (date > 0) {
                        self.data.isend = false
                        self.countDown(date);
                    } else {
                        self.data.isend = true
                    }
                    self.setData({ momey: result.pool_bottom, isend: self.data.isend, shop: result.shop })
                })
            }, 60000);
            if (times <= 0) {
                clearInterval(self.data.timerTwo);
            }
        }
    },

    mylist: function () {
        const shopid = this.data.shopid
        wx.navigateTo({
            url: '/pages/sharelist/index?shopid=' + shopid,
        })
    },

    pay: function () {
        const code = this.data.code
        const shopid = this.data.shopid
        if (this.data.shopid) {
            wx.navigateTo({
                url: '/pages/scan/index?shopid=' + shopid + '&share=yes',
            })
        } else {
            if (code && code != 'undefined') {
                wx.navigateTo({
                    url: '/pages/scan/index?code=' + code + '&share=yes',
                })
            }
        }
    },

    onShareAppMessage: function (res) {
        const self = this;
        self.setData({ shareshow: false })
        let info = {
            title: '推荐赢大奖',
            desc: '最具人气的大奖等你来拿!'
        }
        let codeparam = ''
        // 如果是点击按钮分享的
        if (res.from === 'button') {
            // 分享的页面
            info.path = '/pages/share/index?pid=' + self.data.uid + '&shopid=' + self.data.shopid + codeparam
        } else {
            info.path = '/pages/share/index?pid=' + self.data.uid + '&shopid=' + self.data.shopid + codeparam
        }
        return info
    },

    shareTo: function () {
        const self = this
        const hash = config.hash
        const host = config.host
        self.setData({ shareshow: false })
        const sence = self.data.uid + '-' + self.data.shopid
        let url = host + '/qrcode/create-circle?sence=' + sence + '&hash=' + hash + '&page=pages/share/index'
        wx.previewImage({
            urls: [url] // 需要预览的图片http链接列表
        })
    },

    goToShop() {
        const self = this
        wx.authorize({
            scope: 'scope.userLocation',
            success() {
                wx.openLocation({
                    latitude: Number(self.data.shop.lat),
                    longitude: Number(self.data.shop.lng),
                    name: "前往：" + self.data.shop.title,
                    address: "联系方式：" + self.data.shop.phone,
                    scale: 18
                })
            }
        })
    },

    shareTotop: function () {
        this.setData({ shareshow: true });
    },

    onClose() {
        this.setData({ shareshow: false });
    },

    onRuleClose() {
        this.setData({ ruleshow: false });
    },


    UnixToDate: function (unixTime) {
        let date = new Date(unixTime * 1000);

        let year = date.getFullYear(),
            month = date.getMonth() + 1,//月份是从0开始的
            day = date.getDate(),
            hour = date.getHours(),
            min = date.getMinutes(),
            sec = date.getSeconds();
        if (hour < 10) {
            hour = '0' + hour
        }
        if (min < 10) {
            min = '0' + min
        }
        const newTime = hour + ':' + min
        return newTime;
    },

    showRulePopup: function (e) {
        const self = this
        const ty = e.currentTarget.dataset.ty
        if (ty == 'one') {
            this.setData({
                rules: self.data.ruleOne,
                ruleshow: true
            })
        } else if (ty == 'two') {
            this.setData({
                rules: self.data.ruleTwo,
                ruleshow: true
            })
        } else if (ty == 'three') {
            this.setData({
                rules: self.data.ruleThree,
                ruleshow: true
            })
        }
    },
    call: function (e) {
        const mobile = e.currentTarget.dataset.mobile
        wx.makePhoneCall({
            phoneNumber: mobile
        })
    }
})
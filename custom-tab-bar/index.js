Component({
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#ffffff",
    list: [
      {
        "pagePath": "/pages/aindex/aindex",
        "iconPath": "assets/images/home.png",
        "selectedIconPath": "assets/images/homeselect.png",
        "text": "首页"
      },
      {
        "pagePath": "/pages/home/home",
        "iconPath": "assets/images/active.png",
        "selectedIconPath": "assets/images/active.png",
        "text": "活动中心"
      },
      {
        "pagePath": "/pages/user/index",
        "iconPath": "assets/images/my.png",
        "selectedIconPath": "assets/images/myselect.png",
        "text": "我的"
      }]
  },
  attached() {
    console.log(parseInt(wx.getStorageSync("selected")))
    this.setData({
      selected: parseInt(wx.getStorageSync("selected"))
    })
  },
  


  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path 
     
      wx.switchTab({url})
      this.setData({
        selected: data.index
      })
    }
  }
})
export default defineAppConfig({
  pages: [
    'pages/recharge/index',
    'pages/account/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2563EB',
    navigationBarTitleText: '充值中心',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FB'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#2563EB',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/recharge/index',
        text: '',
        iconPath: 'assets/tabbar/recharge.png',
        selectedIconPath: 'assets/tabbar/recharge-active.png'
      },
      {
        pagePath: 'pages/account/index',
        text: '',
        iconPath: 'assets/tabbar/account.png',
        selectedIconPath: 'assets/tabbar/account-active.png'
      }
    ]
  }
})

const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

Page({
  data: {
    rtCash: 0,
    cash: null,
    userStores: [],
    processing: false
  },

  onLoad(options) {
    wx.setNavigationBarTitle({title: '提现'});
    this._fetchData();
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo();
    let query = `query user($filter: JSON) {
            users(id: "${user.id}") {
              rtCash
            },
            userStores(filter: $filter) {
              createdAt
              recordValue
            }
          }`;
    return graphql(query, {filter: {userId: user.id, recordType: 'cash'}})
    .then(res => {
      let list = res.data.userStores
      list.map(obj => {
        obj.createdAtString = utils.formatTime(new Date(obj.createdAt))
        obj.value = `${parseInt(obj.recordValue) / 100} 元`
      })
      this.setData({
        rtCash: (res.data.users[0].rtCash / 100),
        userStores: list
      });
    });
  },

  allCash() {
    this.setData({
      cash: this.data.rtCash
    });
  },

  startCash() {
    if (this.data.processing) {
      return
    }
    const lowLine = 1000
    const hightLine = 3000
    const cash = this.data.cash * 100
    if (!cash) {
      this.showToast('请输入提现金额！')
      return
    }
    //
    // if (cash > this.data.rtCash * 100) {
    //   this.showToast('余额不足！')
    //   return
    // }
    //
    // if (this.data.cash < lowLine || this.data.cash > hightLine) {
    //   this.showToast('提现金额范围10元-30元')
    //   return
    // }
    this.setData({
      processing: true
    });
    wx.showLoading({
      title: '提现中',
    })
    const user = Auth.getLocalUserInfo();
    let query = `mutation {
            cash(userId: "${user.id}", money: ${this.data.cash * 100}) {
              id
            },
          }`;
    return graphql(query)
    .then(res => {
      if (res.errors && res.errors.length > 0) {
        this.showToast(res.errors[0].message)
      } else if (res.data.cash && res.data.cash.id){
        this.showToast('提现成功！', 'success')
        this._fetchData()
        this.setData({
          cash: null
        });
        wx.hideLoading()
      } else {
        this.showToast('提现异常，请重试！')
      }

      this.setData({
        processing: false
      });
    });
  },

  bindKeyInput: function(e) {
    this.setData({
      cash: e.detail.value
    })
  },

  showToast(title, icon) {
    wx.showToast({
      title: title,
      icon: icon || 'none',
      duration: 2000
    })
  }
});

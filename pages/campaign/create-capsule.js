const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    graphql = require('../../utils/graphql'),
    _ = require('../../vendors/underscore');

Page({
  data: {
    capsuleId: '',
    userInfo: Auth.getLocalUserInfo().attributes,
    date: '321',
    openAt: 1,
    content: '',
    title: '',
    picUrl: 'http://ailingual-production.oss-cn-shanghai.aliyuncs.com/medium_picurl/501de553-a7b7-452d-94bd-c22d2c1798c1.png'
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#000000'
    });

    wx.setNavigationBarTitle({
      title: '时间胶囊'
    });

    let days = Math.abs(util.getDays((new Date()), (new Date(options.openAt))));

    if (days === 0) {
      days = util.formatDateToDay(new Date(options.openAt));
    } else {
      days = days + '天后';
    }

    this.setData({
      date: days,
      openAt: (new Date(`${options.openAt}T00:00:00`)).getTime()
    });
  },

  onShow() {
    // Auth.getLocalUserId();
  },

  onTitleInput: _.debounce(function(event) {
    this.data.title = event.detail.value;
  }, 600),

  onContentInput: _.debounce(function(event) {
    this.data.content = event.detail.value;
  }, 600),

  changePic: function(event) {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: 'compressed',
      success: function(res) {
        if (res.tempFilePaths.length === 0) return;
        wx.showLoading({
          title: '上传中...'
        });
        that.setData({
          picUrl: res.tempFilePaths[0]
        });
        wx.uploadFile({
          url: `${app.globalData.apiBase}/time-capsules/photo`,
          filePath: res.tempFilePaths[0],
          name: 'photo',
          formData:{
          },
          success: function (res) {
            console.log('打开文档成功');
          },
          fail: function (res) {
            console.log('打开文档失败');
          },
          complete: function(data){
            that.setData({capsuleId: JSON.parse(data.data).id});
            wx.hideLoading();
          },
        })
      }
    })
  },

  release: function(event) {

    if (!this.data.title || !this.data.content) {
      wx.showToast({
        title: '请先输入',
        duration: 1000,
        image: '../../images/survey/delete.jpg'
      });
      return;
    }

    const idParam = this.data.capsuleId ? `, id: "${this.data.capsuleId}"` : '';

    let param = `
      mutation {
        timeCapsule(
          title: "${this.data.title}",content: "${this.data.content}",userId: "${Auth.getLocalUserId()}",openAt: ${this.data.openAt},coverPicurl: "${this.data.picUrl}"${idParam}
        ){
          title
        }
      }
    `;

    graphql(param).then(res => {
      // openAt
      console.log(res);
      wx.redirectTo({
        url: `./capsule`
      });
    });
  }
})

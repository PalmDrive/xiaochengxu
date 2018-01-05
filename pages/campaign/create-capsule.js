const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    graphql = require('../../utils/graphql'),
    _ = require('../../vendors/underscore');

Page({
  data: {
    userInfo: Auth.getLocalUserInfo().attributes,
    date: '321',
    openAt: 1,
    content: '',
    title: '',
    picUrl: 'http://ailingual-production.oss-cn-shanghai.aliyuncs.com/time_capsule/2831514861881_.pic.jpg'
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
      openAt: (new Date(`${options.openAt}`)).getTime()
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
          url: `${app.globalData.apiBase}/photo/upload`,
          filePath: res.tempFilePaths[0],
          path: 'time_capsule',
          name: 'photo',
          complete: function(data){
            console.log(data);
            that.setData({picUrl: JSON.parse(data.data).data});
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

    let param = `
      mutation {
        timeCapsule(
          title: "${escape(this.data.title)}",content: "${escape(this.data.content)}",userId: "${Auth.getLocalUserId()}",openAt: ${this.data.openAt},coverPicurl: "${this.data.picUrl}"
        ){
          title
        }
      }
    `;

    graphql(param).then(res => {
      // openAt
      console.log(res);
      wx.reLaunch({
        url: `./capsule`
      });
    });
  }
})

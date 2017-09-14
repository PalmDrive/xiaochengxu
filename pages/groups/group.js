const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth');

function loadData(groupId, lastDate) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBase}/users/${groupId}/group-topics-24hours?date=${lastDate}&from=miniProgram`,
      success(res) {
        resolve(res.data);
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

Page({
  data: {
    userName: null, // group or toutiao name actually
    groupId: null,
    lastDate: null,
    loadingStatus: null, // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    dateList: [],
    newMediaCount: 0, // 今日更新数量
    viewsCount: 0,
    wxCode: null // 群主微信号
  },
  onLoad: function (options) {
    this.setData({
      groupId: options.id,
      loadingStatus: 'LOADING'
    });
    this._load();

    wx.request({
      method: 'POST',
      url: `${app.globalData.apiBase}/user-groups?from=miniProgram`,
      data: {
        data: {
          attributes: {
            userId: Auth.getLocalUserId(),
            groupId: options.id
          }
        },
      },
      success: res => {
        this.setData({
          viewsCount: res.data.data.attributes.viewsCount
        });
      }
    });
  },

  onShow() {
    if (this.data.userName) {
      util.ga({
        cid: Auth.getLocalUserId(),
        dp: '%2FtoutiaoPage_XiaoChengXu',
        dt: `toutiao_name:${this.data.userName},toutiao_id:${this.data.groupId}`
      });
    }
  },

  //点击专题
  goToTopic: function(event) {
    const topic = event.currentTarget.dataset.topic;
    const gaOptions = {
      cid: Auth.getLocalUserId(),
      ec: `topic_name:${topic.attributes.name},topic_id:${topic.id}`,
      ea: 'click_topic_in_toutiaoPage',
      el: `toutiao_name:${this.data.userName},toutiao_id:${this.data.groupId}`,
      ev: 1
    };
    util.goToTopic(event, gaOptions);
  },
  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          userInfo = Auth.getLocalUserInfo(),
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_toutiaoPage',
            el: `toutiao_name:${this.data.userName},toutiao_id:${this.data.groupId}`,
            ev: 0
          };
    util.goToMedium(event, gaOptions);
  },
  /**
   * 加载数据
   */
  _load() {
    loadData(this.data.groupId, this.data.lastDate)
      .then(this._onLoadSuccess);
  },
  /**
   * 数据加载 成功 回调
   */
  _onLoadSuccess: function (res) {
    let updates = {},
        dateList = this.data.dateList;

    // 没有数据 显示loading页的加载完毕
    if (!res.data || !res.data.length) {
      return this.setData({loadingStatus: 'LOADED_ALL'});
    }
    const today = new Date(res.meta.mediumLastDate);
    dateList.push({
      date: '· ' + util.formatDateToDay(today) + ' 周' + '日一二三四五六'[today.getDay()],
      topics: res.data
    });
    const groupInfo = res.included[0].attributes.groupInfo && JSON.parse(res.included[0].attributes.groupInfo);
    updates.dateList = dateList;
    updates.userName = res.included[0].attributes.username;
    updates.wxCode = groupInfo && groupInfo.wxCode;
    updates.lastDate = res.meta.mediumLastDate;
    updates.loadingStatus = null;

    const totalMediaCount = this._countMedia();

    if (!this.data.newMediaCount) {
      updates.newMediaCount = totalMediaCount;
    }

    this.setData(updates);

    // 设置标题
    wx.setNavigationBarTitle({
      title: updates.userName
    });

    util.ga({
      cid: Auth.getLocalUserId(),
      dp: '%2FtoutiaoPage_XiaoChengXu',
      dt: `toutiao_name:${this.data.userName},toutiao_id:${this.data.groupId}`
    });

    if (totalMediaCount <= 10) {
      this.onReachBottom();
    }
  },

  _countMedia() {
    const dateList = this.data.dateList,
          topics = dateList.reduce((memo, obj) => {
            memo = memo.concat(obj.topics);
            return memo;
          }, []);

    return topics.reduce((memo, topic) => {
      memo += topic.relationships.media.data.length;
      return memo;
    }, 0);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.loadingStatus) {
      this.setData({loadingStatus: 'LOADING_MORE'});
      this._load();
    }
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    return {
      title: `你的群头条: 今日更新${this.data.newMediaCount}篇`
    }
  }
})
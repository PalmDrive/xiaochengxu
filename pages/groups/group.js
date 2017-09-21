const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request');

function loadData(groupId, lastDate) {
  return request({
    url: `${app.globalData.apiBase}/groups/${groupId}/topics-24hours?date=${lastDate}&from=miniProgram`,
  });
}

let didUserPay = false;
const PAID_USER_ROLE = 2;

Page({
  data: {
    userName: null, // group or toutiao name actually
    groupId: null,
    lastDate: null,
    loadingStatus: null, // 'LOADING', 'LOADING_MORE', 'LOADED_ALL'
    dateList: [],

    newMediaCount: 0, // 今日更新数量
    groupInfo: {},
    showHint: false,
    modalShown: false,
    isPaidGroup: false,
    bannerImage: {}
  },

  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },

  onLoad(options) {
    //console.log(getCurrentPages()[1]);
    const bannerImageRatio = 375 / 400, // width / height
          updates = {
            groupId: options.id,
            loadingStatus: 'LOADING'
          },
          that = this;
    
    wx.getSystemInfo({
      success(res) {
        updates.bannerImage = {height: res.windowWidth / bannerImageRatio};
        that.setData(updates);
        Auth.getLocalUserId() && that._load();
      },
      fail() {
        updates.bannerImage = {height: 400};
        that.setData(updates);
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
    if (!this.data.isPaidGroup || didUserPay) {
      util.goToMedium(event, gaOptions);
    } else {
      this.toggleModalShown();
    }
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
    const today = new Date(res.meta ? res.meta.mediumLastDate : new Date());
    dateList.push({
      date: '· ' + util.formatDateToDay(today) + ' 周' + '日一二三四五六'[today.getDay()],
      topics: res.data
    });
    const group = res.included[0], 
          groupInfo = group.attributes.groupInfo;
    groupInfo.pageviews = util.shortNumber(groupInfo.pageviews);
    updates.dateList = dateList;
    updates.userName = res.included[0].attributes.username;
    updates.groupInfo = groupInfo;
    updates.lastDate = res.meta ? res.meta.mediumLastDate : null;
    updates.loadingStatus = null;
    updates.isPaidGroup = res.data[0].type === 'morningPosts';

    const totalMediaCount = this._countMedia();
    didUserPay = group.relationships && group.relationships.userGroup.data.attributes.role === PAID_USER_ROLE;

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
    if (!this.data.loadingStatus && !this.data.isPaidGroup) {
      this.setData({loadingStatus: 'LOADING_MORE'});
      this._load();
    }
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    const title = this.data.isPaidGroup ? this.data.userName : `你的群头条: 今日更新${this.data.newMediaCount}篇`;
    return {
      title
    }
  },
  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    loadData(this.data.groupId, null)
      .then(res => {
        wx.stopPullDownRefresh();
        this.data.dateList = new Array();
        this._onLoadSuccess(res)
      });
  },

  copyWechatId() {
    const wechatId = 'zhixiaobin123';
    wx.setClipboardData({
      data: wechatId,
      success() {
        wx.showToast({
          title: '复制成功'
        });
      },
      fail() {
        wx.showToast({
          title: '哎呀，复制失败了。麻烦手动复制吧。'
        });
      }
    })
  },

  toggleModalShown() {
    const modalShown = !this.data.modalShown;
    this.setData({modalShown});
  }
})
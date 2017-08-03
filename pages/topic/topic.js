// pages/topic/topic.js
const app = getApp(),
      util = require('../../utils/util.js'),
      Auth = require('../../utils/auth'),
      Topic = require('../../utils/topic');

const contentTypes = ['观点', '推荐书籍', '资讯', '案例'];

function pushMedium(m, contentTypes, mediumData) {
  const s = m.attributes.contentTypes.join();
  contentTypes.forEach(type => {
    if (s.indexOf(type) > -1) {
      mediumData[type].push(m);
    }
  });
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    topicId: null,
    topic: {},
    isFeatured: false,
    tabs: [],
    mediumData: contentTypes.reduce((acc, c) => {
      acc[c] = [];
      return acc;
    }, {}),
    selectedTab: '动态',
    childTopics: [],
    subscribeButton: '订阅',
    showHint: false,
    loading: true,
    page: {number: 1, size: 8}
  },
  //绑定事件
  selectTab(event) {
    const tab = event.target.dataset.tab;
    this.setData({
      selectedTab: tab
    });
  },
  goToMedium: util.goToMedium,
  showMoreMedia(event) {
    const topicId = event.currentTarget.dataset.id;
    const childTopics = this.data.childTopics;
    for (let i = 0; i < childTopics.length; i++) {
      if (childTopics[i].id === topicId) {
        const topic = childTopics[i];
        topic.media5 = topic.media;
        topic.moreShowed = true;
        this.setData({
          childTopics
        });
      }
    }
  },
  clickSubscribe(event) {
    const that = this,
      topic = that.data.topic,
      topicId = that.data.topicId,
      userId = Auth.getLocalUserId(),
      userInfo = Auth.getLocalUserInfo();
    if (userId) {
      if (that.data.subscribeButton === '订阅') {
        util.gaEvent({
          cid: userId,
          ec: `topic_name:${topic.attributes.name}, topic_id:${topicId}`,
          ea: 'subscribe_topic',
          el: `user_name:${userInfo.nickName}, user_id:${userInfo.openId}`,
          ev: 3
        });
        that.setData({subscribeButton: '订阅中...'});
        Topic.subscribe(userId, topicId, () => {
          that.setData({subscribeButton: '已订阅'});
        });
      } else if (that.data.subscribeButton === '已订阅') {
        that.setData({subscribeButton: '取消中...'});
        Topic.unsubscribe(userId, topicId, () => {
          that.setData({subscribeButton: '订阅'});
        });
      }
    }
  },
  //关闭首次登陆弹窗
  closeHint: function () {
    util.closeHint(this);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this,
      topicId = options.id;
    that.setData({
      loading: true,
      topicId
    });
    //检查storage里是否有userId，没有则请求
    if (Auth.getLocalUserId()) {
      init();
    } else {
      Auth.login(init, that);
    }

    function init() {
      const userId = Auth.getLocalUserId(),
        topicUrl = `${app.globalData.apiBase}/topics/${topicId}?filterSource=true&fields[topics]=name,description,imgUrl,mediaCount,fields,tabs,type&userId=${userId}`;
      //获取专题数据
      wx.request({
        url: topicUrl,
        success(res) {
          const topic = res.data.data;
          let subscribeButton;
          if (res.data.meta && res.data.meta.subscribe) {
            subscribeButton = '已订阅';
          } else {
            subscribeButton = '订阅';
          }
          const isFeatured = topic.attributes.type === 'featured';

          // Determin tabs
          const tabs = topic.attributes.newTabs;
          tabs.unshift('动态');

          //获取其他标签下的文章
          that.getOtherTabsData(tabs);

          //更新数据
          that.setData({
            topicId,
            topic,
            isFeatured,
            tabs,
            subscribeButton,
            loading: false
          });

          wx.stopPullDownRefresh();

          util.ga({
            cid: Auth.getLocalUserId() || '555',
            dp: '%2FtopicPage_XiaoChengXu',
            dt: `topic_name:${topic.attributes.name},topic_id:${topicId}`
          });

          if (tabs.indexOf('子专题') > -1) {
            wx.request({
              url: `${app.globalData.apiBase}/topics/${topicId}/topics?include=media`,
              success(result) {
                const topics = result.data.data;
                const media = result.data.included || [];
                const mediumId2medium = media.reduce((acc, m) => {
                  acc[m.id] = m;
                  return acc;
                }, {});
                // Set topic.media
                topics.forEach(t => {
                  if (t.relationships && t.relationships.media && t.relationships.media.data) {
                    t.media = t.relationships.media.data.reduce((acc, m) => {
                      if (mediumId2medium[m.id]) {
                        acc.push(mediumId2medium[m.id]);
                      }
                      return acc;
                    }, []);
                    t.media5 = t.media.slice(0, 5);
                  }
                });
                that.setData({
                  childTopics: topics
                });
              },
              fail() {
                console.log('topic page request child topics fail');
              }
            });
          }
        },
        fail() {
          console.log('topic page request topic data fail');
        }
      });

      //获取动态标签的文章
      const cb = media => {
        const data = {};
        if (media.length) {
          media.forEach(m => util.formatPublishedAt(m));
          data['mediumData.动态'] = media;
        }
        if (media.length < that.data.page.size) {
          data.noMore = true;
        }
        that.setData(data);
      };
      that.getMedia(1, cb);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    const id = this.data.topicId;
    if (id && !this.data.loading) {
      this.onLoad({ id });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    const data = this.data,
      that = this;
    if (data.selectedTab === '动态' && !data.noMore && !data.loadingMore) {
      const pageNumber = data.page.number + 1;
      this.setData({
        'page.number': pageNumber,
        loadingMore: true
      });

      const cb = media => {
        const data = {};
        if (media.length) {
          media.forEach(m => util.formatPublishedAt(m));
          data['mediumData.动态'] = that.data.mediumData['动态'].concat(media);
        }
        if (media.length < that.data.page.size) {
          data.noMore = true;
        }
        data.loadingMore = false;
        that.setData(data);
      };

      this.getMedia(pageNumber, cb);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const topic = this.data.topic,
      userInfo = Auth.getLocalUserInfo();
    util.gaEvent({
      cid: Auth.getLocalUserId(),
      ec: `topic_name:${topic.attributes.name}, topic_id:${topic.id}`,
      ea: 'share_topic',
      el: `user_name:${userInfo.nickName}, user_id:${userInfo.openId}`,
      ev: 5
    });
  },

  getOtherTabsData: function(tabs) {
    const that = this,
      skipTabs = ['动态', '相关专题', '子专题'];
    tabs.forEach(tab => {
      if (skipTabs.indexOf(tab) === -1) {
        that.getTabData(tab);
      }
    });
  },

  getTabData: function(tab) {
    const that = this;
    wx.request({
      url: `${app.globalData.apiBase}/topics/${that.data.topicId}/media?page[number]=1&page[size]=100&filter[confirmed]=1&filter[contentTypes]=${tab}&sort=-publishedAt`,
      success(res) {
        const media = res.data.data;
        media.forEach(m => util.formatPublishedAt(m));
        const key = `mediumData.${tab}`;
        that.setData({
          [key]: media
        });
      },
      fail() {
        console.log('topic page, getTabData function, request fail');
      }
    });
  },

  //获取动态标签下的文章
  getMedia: function(pageNumber, cb) {
    wx.request({
      url: `${app.globalData.apiBase}/media/topic/${this.data.topicId}?page[number]=${pageNumber}&page[size]=${this.data.page.size}&sort=-publishedAt`,
      success(res) {
        const media = res.data.data;
        cb(media);
      },
      fail() {
        console.log('topic page, getMedia request fail');
      }
    });
  }
})
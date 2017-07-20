// pages/topic/topic.js
const app = getApp(),
      util = require('../../utils/util.js');

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
    childTopics: []
  },

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

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this,
          topicId = options.id;

    //获取专题数据
    wx.request({
      url: `${app.globalData.apiBase}/topics/${topicId}?fields[topics]=name,description,imgUrl,mediaCount,fields,tabs,type&include=media&fields[media]=id,title,summary,publishedAt,picUrl`,
      success(res) {
        const topic = res.data.data;
        // if (result.data.meta && result.data.meta.subscribe) {
        //   $scope.subscribeButton = '已订阅';
        // } else {
        //   $scope.subscribeButton = '订阅';
        // }
        const isFeatured = topic.attributes.type === 'featured';

        let media = res.data.included;
        media = media.map(m => {
          // 格式化时间
          if (m.attributes.publishedAt) {
            m.attributes.publishedAt = util.convertDate(new Date(m.attributes.publishedAt));
          } else {
            m.attributes.publishedAt = '';
          }
          return m;
        });

        // Determin tabs
        const tabs = topic.attributes.newTabs;
        tabs.unshift('动态');

        const mediumData = that.data.mediumData;
        // Push media into mediumData
        mediumData['动态'] = media;
        media.forEach(m => {
          if (m.attributes.contentTypes && m.attributes.contentTypes.length) {
            pushMedium(m, contentTypes, mediumData);
          }
        });

        //更新数据
        that.setData({
          topicId,
          topic,
          isFeatured,
          tabs
        });
        that.setData({
          mediumData
        });

        if (tabs.indexOf('相关专题') > -1) {
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
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})
// pages/topic/topic.js
const app = getApp(),
      util = require('../../utils/util.js');

const contentTypes = [
  ['观点', 'opinion'],
  ['推荐书籍', 'book'],
  ['资讯', 'information'],
  ['案例', 'case']
];

function initMediumData() {
  contentTypes.reduce((acc, c) => {
    acc[c[1]] = [];
    return acc;
  }, {});
}

function pushMedium(m, contentTypes, mediumData) {
  const s = m.attributes.contentTypes.join();
  contentTypes.forEach(type => {
    if (s.indexOf(type[0]) > -1) {
      mediumData[type[1]].push(m);
    }
  });
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    topicId: null,
    topic: {
      "type": "topics",
      "id": "6da57d2d-82c6-4ce8-8cc7-32cfab8c75ab",
      "attributes": {
        "name": "智能机器人有啥进展",
        "imgUrl": "http://ailingual-production.oss-cn-shanghai.aliyuncs.com/pics/%E4%B8%93%E9%A2%98%E5%9B%BE%E7%89%87/Rectangle%2018%20Copy%206%403x.png",
        "description": "这里有机器人的最新信息和专家点评",
        "mediaCount": 321,
        "type": "featured",
        "contentTypes": [
          "观点",
          "资讯",
          "推荐书籍"
        ],
        "tabs": [
          "观点",
          "资讯",
          "推荐书籍"
        ]
      }
    },
    isFeatured: true,
    media: [{
      "type": "media",
      "id": "98bc7790-67b1-11e7-82a5-bf71cd1429e6",
      "attributes": {
        "title": "智能仓储机器人Geek+宣布获得6000万美元B轮融资，华平投资领投",
        "link": "http://www.lieyunwang.com/archives/336788",
        "metaData": {},
        "author": "都保杰",
        "keywords": [],
        "labels": [],
        "source": "猎云网",
        "algoRating": 7,
        "editorRating": null,
        "rating": null,
        "ratingsCount": 0,
        "viewsCount": 1,
        "publishedAt": 1499939812000,
        "updatedAt": "2017-07-13T12:18:01.000Z",
        "createdAt": "2017-07-13T09:56:52.000Z",
        "summary": "物流机器人领域全球范围内所获得的最大单笔投资记录。",
        "picurl": null,
        "featuredPicUrl": null,
        "group": null,
        "editorComment": null,
        "fields": [
          "人工智能"
        ],
        "positions": [
          "CFO",
          "CEO"
        ],
        "hidden": 0,
        "showHtml": true,
        "relatedArticles": [],
        "labelledField": [],
        "labelledPosition": [],
        "labelledPerson": [],
        "labelledCompany": [],
        "labelledContentType": [],
        "labelledSentiment": [],
        "contentTypes": [],
        "video": null,
        "duration": null,
        "mediumType": "article"
      }
    },
    {
      "type": "media",
      "id": "89710c40-6763-11e7-82a5-bf71cd1429e6",
      "attributes": {
        "title": "丰田拟1亿美元投资人工智能和机器人技术公司",
        "link": "http://tech.qq.com/a/20170712/057546.htm",
        "metaData": {},
        "author": "腾讯科技",
        "keywords": [],
        "labels": [],
        "source": "腾讯科技",
        "algoRating": 7,
        "editorRating": null,
        "rating": null,
        "ratingsCount": 0,
        "viewsCount": 0,
        "publishedAt": 1499906286000,
        "updatedAt": "2017-07-13T00:38:06.000Z",
        "createdAt": "2017-07-13T00:38:06.000Z",
        "summary": "腾讯科技讯据国外媒体报道，7月12日日本丰田公司宣布成了丰田人工智能投资公司，而该公司将专注于投资给那些在人工智能领域刚起步的初创企业。目前，该公司已经从丰田研究中心（TRI）获得了1亿美元的初始资金，丰田研究中心成立于2015年，主要从事于人工智能、机器人和自动驾驶汽车的研发。这家人工智能投资公司将直接在人工智能、机器人技术、自动驾驶技术、数据和云技术领域进行投资。除了投资之外，还将向其在硅谷的",
        "picurl": "http://ailingual-production.oss-cn-shanghai.aliyuncs.com/medium_picurl/a36219a3-b0cd-461c-a16d-77bf45151fee.jpg",
        "featuredPicUrl": null,
        "group": null,
        "editorComment": null,
        "fields": [
          "人工智能"
        ],
        "positions": [
          "CFO",
          "CEO"
        ],
        "hidden": 0,
        "showHtml": true,
        "relatedArticles": [],
        "labelledField": [],
        "labelledPosition": [],
        "labelledPerson": [],
        "labelledCompany": [],
        "labelledContentType": [],
        "labelledSentiment": [],
        "contentTypes": [],
        "video": null,
        "duration": null,
        "mediumType": "article"
      }
    }],
    tabs: ['动态', "观点",
      "资讯",
      "推荐书籍"],
    mediumData: initMediumData(),
    selectedTab: '动态'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this,
          topicId = options.id;
    this.setData({
      topicId
    });
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
            m.attributes.publishedAt = Util.convertDate(new Date(m.attributes.publishedAt));
          } else {
            m.attributes.publishedAt = '';
          }
          return m;
        });

        // Determin tabs
        const tabs = $scope.topic.attributes.tabs;
        tabs.unshift('动态');

        const mediumData = that.data.mediumData;
        // Push media into mediumData
        media.forEach(m => {
          if (m.attributes.contentTypes && m.attributes.contentTypes.length) {
            pushMedium(m, contentTypes, mediumData);
          }
        });

        //更新数据
        that.setData({
          topic,
          isFeatured,
          media,
          tabs,
          mediumData
        });
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
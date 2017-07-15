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
    tabs: ['动态', "观点",
      "资讯",
      "推荐书籍", '相关专题'],
    mediumData: {
      '动态': [{
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
          "publishedAt": '1天前',
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
          "publishedAt": '1天前',
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
      }]
    },
    selectedTab: '动态',
    childTopics: [{
      "type": "topics",
      "id": "bbf50fa0-52fe-11e7-8121-87360f544894",
      "attributes": {
        "topicId": "bbf50fa0-52fe-11e7-8121-87360f544894",
        "name": "APP文案应该怎么玩",
        "imgUrl": "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1497675590829&di=2531aa461e316d79145cd6287e4e71da&imgtype=0&src=http%3A%2F%2Fimg.taopic.com%2Fuploads%2Fallimg%2F120418%2F94400-12041Q30T273.jpg",
        "description": "带你走进花样文案的背后",
        "subscriptionsCount": 1,
        "updatedAt": 1499672100290,
        "publishedAt": 1497665400000,
        "createdAt": 1497663968666,
        "mediaCount": 10,
        "proposedBy": "34393cb0-346f-11e7-991f-4b37dac6881a",
        "labels": [
          "Topic",
          "Visible",
          "UGC"
        ],
        "reviewStatus": 1,
        "category": "",
        "type": "",
        "matchRule": "APP&&文案",
        "updateFrequency": "",
        "productId": "",
        "price": 0
      },
      media: [{
        "type": "media",
        "id": "32f90820-5306-11e7-af0c-af027058a066",
        "attributes": {
          "title": "别具匠心的APP文案+灵感设计，这种不一样的体验很酸爽",
          "publishedAt": 1490572800000,
          "hidden": 0,
          "link": "https://mp.weixin.qq.com/s?__biz=MzA3OTY0ODM0Ng==&mid=2651139035&idx=1&sn=7a37cf64ffb75551cf603645704f7f17&chksm=8441c8eeb33641f8b66870cca0385daa6460f133dc800374f2aa82b471d0a3a3de0c17b681f2&mpshare=1&scene=1&srcid=06175nSaiKCwcB27bFmkO54p&key=f17d8322b1674f1f697b8c9c775d8d303dfaa33579cb8bd520a1388f2776320079bc93816611d7c1d87fedc879d9c9b043595a6976ef4507d7e75fcd606dc259add0a9f3b7e1e45844d2fec2157ba970&ascene=0&uin=ODY1MjQyOTIx&devicetype=iMac+MacBookPro12%2C1+OSX+OSX+10.11.6+build(15G1510)&version=12020110&nettype=WIFI&fontScale=100&pass_ticket=MSfnxunKij3WvTlQvbB2ALZlwubbTO4zHAPTiLuZ1pk0yzSBvN%2BIXn1%2B2p3kTatt",
          "topics": {
            "bbf50fa0-52fe-11e7-8121-87360f544894": {
              "name": "APP文案应该怎么玩",
              "imgUrl": "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1497675590829&di=2531aa461e316d79145cd6287e4e71da&imgtype=0&src=http%3A%2F%2Fimg.taopic.com%2Fuploads%2Fallimg%2F120418%2F94400-12041Q30T273.jpg",
              "id": "bbf50fa0-52fe-11e7-8121-87360f544894"
            }
          }
        }
      },
      {
        "type": "media",
        "id": "319faf20-5305-11e7-af0c-af027058a066",
        "attributes": {
          "title": "如何写出走心有灵魂的推送文案，提高APP的打开率？",
          "publishedAt": 1490054400000,
          "hidden": 0,
          "link": "https://mp.weixin.qq.com/s?__biz=MjM5OTEwNjI2MA==&mid=2651733787&idx=5&sn=367ec2c9b733d2ebcab45f460d11384b&chksm=bd3a1ca08a4d95b6467cf7b831a997bde55abb4dea4841877a9676ad63139791e3a4f0117900&mpshare=1&scene=1&srcid=0617X2rpob4cVmzvb0wv03I8&key=d6331003961a2cc40d3826ceec5dd2a2251a24f1a1e79c9cb733451d2536bd02d590332d63cd01b78d9e95fad326fcccfef84b257dd66ded33e4666e36b429e09c8a40a4f6307ea80a323198f5fd7d19&ascene=0&uin=ODY1MjQyOTIx&devicetype=iMac+MacBookPro12%2C1+OSX+OSX+10.11.6+build(15G1510)&version=12020110&nettype=WIFI&fontScale=100&pass_ticket=MSfnxunKij3WvTlQvbB2ALZlwubbTO4zHAPTiLuZ1pk0yzSBvN%2BIXn1%2B2p3kTatt",
          "topics": {
            "bbf50fa0-52fe-11e7-8121-87360f544894": {
              "name": "APP文案应该怎么玩",
              "imgUrl": "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1497675590829&di=2531aa461e316d79145cd6287e4e71da&imgtype=0&src=http%3A%2F%2Fimg.taopic.com%2Fuploads%2Fallimg%2F120418%2F94400-12041Q30T273.jpg",
              "id": "bbf50fa0-52fe-11e7-8121-87360f544894"
            }
          }
        }
      }]
    }]
  },

  selectTab(event) {
    const tab = event.target.dataset.tab;
    this.setData({
      selectedTab: tab
    });
  },

  goToMedium(event) {
    const mediumId = event.target.dataset.id;
    wx.navigateTo({
      url: `../medium/medium?id=${mediumId}`
    })
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
          tabs,
          mediumData
        });

        if (hasChildTopics) {
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
              that.setDate({
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
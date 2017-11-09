const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

Page({
  data: {
    dayList: ['1', '2', '3', '4', '5', '6','7'],
    selectedIndex: 4,
    albumAttributes: {},
    albumId: '',
    editorInfo: {},
    post: {},
    media: []
  },

  onLoad(options) {
    Auth.getLocalUserId() && this._load();
  },

  /**
   * 加载数据
   */
  _load() {
    request({
      url: `${app.globalData.apiBase}/albums/today`,
    }).then(res => {
      console.log(res);

      const albumAttributes = res.data.attributes;
      const post = res.data.relationships.post;

      this.setData({
        albumAttributes,
        editorInfo: albumAttributes.editorInfo,
        post,
        media: post.relationships.media.data,
        albumId: res.data.id
      })
    });
  },

  /**
   * 分享给好友 事件
   */
  onShareAppMessage: function () {
    const title = this.data.title;
    return {
      title: `七日辑: ${title}`
    };
  },

  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          index = this.data.selectedIndex,
          idx = event.currentTarget.dataset.index,
          count = this.data.media.length,
          userInfo = Auth.getLocalUserInfo(),
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_albumShowPage',
            el: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`,
            ev: 0
          };
    const key = 'day' + (this.data.posts.length - index);
    if (!this.data.dayLogs[key]) {
      this.data.dayLogs[key] = 1;
      this.data.achieveProcess = this.data.achieveProcess + 1;
      this.setData({achieveProcess: this.data.achieveProcess});
    }
    util.goToMedium(event, gaOptions, {
      dayIndex: key,
      mediumIndex: idx + 1,
      count: count,
      albumId: this.data.albumId,
      morningPostId: this._getMorningPostId()
    });
  },
})

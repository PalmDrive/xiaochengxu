const app = getApp(),
    util = require('../../utils/util'),
    Auth = require('../../utils/auth'),
    {request} = require('../../utils/request'),
    baseUrl = app.globalData.apiBase;

let albumId = undefined,
    postId = undefined;

Page({
  data: {
    dayList: [],
    selectedIndex: 4,
    albumAttributes: {},
    editorInfo: {},
    post: {},
    media: []
  },

  onLoad(options) {
    albumId = options.albumId;
    postId = options.postId;
    Auth.getLocalUserId() && this._load();
  },

  /**
   * 加载数据
   */
  _load() {
    let url = `${app.globalData.apiBase}/albums/post`;
    if (albumId && postId) {
      url += `?postId=${postId}&albumId=${albumId}`
    }
    request({
      url: url,
    }).then(res => {
      console.log(res);

      const albumAttributes = res.data.attributes || {},
            post = res.data.relationships.post.data || {},
            postRelationships = post.relationships || {};
      albumId = res.data.id;
      postId = post.id;
      this.setData({
        albumAttributes,
        editorInfo: albumAttributes.editorInfo,
        post,
        media: postRelationships.media.data,
        selectedIndex: post.attributes.dayIndex,
        dayList: res.meta.checkinStatus
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
  goToPost: function(event) {
    const index = event.currentTarget.dataset.index,
          newPostId = this.data.albumAttributes.postIds[index]
    wx.redirectTo({
      url: `./survey?postId=${newPostId}&albumId=${albumId}`
    });
  },

  //点击文章
  goToMedium: function(event) {
    const medium = event.currentTarget.dataset.medium,
          index = this.data.selectedIndex,
          idx = event.currentTarget.dataset.idx,
          count = this.data.media.length,
          userInfo = Auth.getLocalUserInfo(),
          gaOptions = {
            cid: Auth.getLocalUserId(),
            ec: `article_title:${medium.attributes.title},article_id:${medium.id}`,
            ea: 'click_article_in_albumShowPage',
            el: `album_name:${this.data.albumAttributes.title},album_id:${this.data.albumId}`,
            ev: 0
          };
    const key = 'day' + index;
    util.goToMedium(event, gaOptions, {
      dayIndex: key,
      mediumIndex: idx + 1,
      count: count,
      albumId: albumId,
      morningPostId: postId
    });
  },

  goToAlbumDetail: function(event) {
    wx.redirectTo({
      url: `./show?showDetail=true&id=${albumId}`
    });
  }
})

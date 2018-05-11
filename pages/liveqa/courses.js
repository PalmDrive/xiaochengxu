const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

Page({
  data: {
    courses: null,
  },

  onLoad(options) {
    wx.setNavigationBarTitle({title: '集思学院课程'});
    this._fetchData()
      .then(data => {
        this.setData({
          courses: data.courses,
        });
      });
  },

  _fetchData() {
    let query = `query courses($filter: JSON){
            courses(filter: $filter) {
              id, name, timeSubtitle, coverImgUrl
            }
          }`;
    return graphql(query, {filter: {recommendHomepage: true}})
      .then(res => {

        const data = {
          courses: res.data.courses
        };
        return data;
      });
  },
});

const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

Page({
  data: {
    rules: null,
  },

  onLoad(options) {
    wx.setNavigationBarTitle({title: '规则说明'});
    this._fetchData()
      .then(data => {
        this.setData({
          rules: data.rules,
        });
      });
  },

  _fetchData() {
    let query = `query {
            liveRules {
              title, titleIcon, content, index, actionTitle, actionUrl
            }
          }`;
    return graphql(query)
      .then(res => {

        const data = {
          rules: res.data.liveRules
        };
        return data;
      });
  },
});

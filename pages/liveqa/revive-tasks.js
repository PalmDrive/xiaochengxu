const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

let couponId;

Page({
  data: {
    user: null,
  },

  onLoad(options) {
    this._fetchData()
      .then(data => {
        this.setData({
          user: data.user,
        });
      });
  },

  gotoSharePage() {
    const url = `/pages/album/share?couponId=${couponId}&appName=qaXiaochengxu`;
    wx.navigateTo({
      url
    });
  },

  _fetchData() {
    let user = Auth.getLocalUserInfo(),
          query = `query($userId: ID, $couponFilter: JSON) {
            users(id: $userId) {
              id, qaReward, isSchoolVerified,
              mySchool {name},
              rtQAPoints, qaPointsThisWeek, qaPointsThisWeekRankPercent, extraQALives, streakDays
            }
            coupons(filter: $couponFilter) {
              id
            }
          }`,
          variables = {
            userId: user.id,
            couponFilter: {
              productType: 'ExtraLife'
            }
          };
    return graphql(query, variables)
      .then(res => {
        couponId = res.data.coupons[0].id;
        user = _.extend(res.data.users[0], user.attributes);

        const data = {
          user
        };
        return data;
      });
  },

  gotoSharedPoster() {

  }

});

const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

let couponId;

Page({
  data: {
    user: null,
    checkinReward: {}
  },

  onLoad(options) {
    this._fetchData()
      .then(data => {
        this.setData({
          user: data.user,
          checkinReward: data.checkinReward
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
    const start = new Date(new Date(new Date().toLocaleDateString()).getTime())
    const end = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24*60*60*1000 - 1);
    let user = Auth.getLocalUserInfo(),
          query = `query($userId: ID, $couponFilter: JSON, $checkFilter: JSON) {
            users(id: $userId) {
              id, qaReward, isSchoolVerified,
              mySchool {name},
              rtQAPoints, qaPointsThisWeek, qaPointsThisWeekRankPercent, extraQALives, streakDays
            }
            coupons(filter: $couponFilter) {
              id
            }
            userCheckins(filter: $checkFilter) {
              metaData
            }
          }`,
          variables = {
            userId: user.id,
            couponFilter: {
              name: '答题复活卡_邀请好友'
            },
            checkFilter: {
              userId: user.id,
              createdAt: {$between: [start, end]}
            }
          };
    return graphql(query, variables)
      .then(res => {
        couponId = res.data.coupons[0].id;
        user = _.extend(res.data.users[0], user.attributes);
        const obj = res.data.userCheckins.length > 0 ? res.data.userCheckins[0] : {}
        const data = {
          user, checkinReward: obj.metaData.checkinReward || null
        };
        return data;
      });
  },

  gotoSharedPoster() {

  }

});

const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

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

  _fetchData() {
    let user = Auth.getLocalUserInfo(),
          query = `query($userId: ID) {
            users(id: $userId) {
              id, qaReward, isSchoolVerified,
              mySchool {name},
              qaPoints, qaPointsThisWeek, qaPointsThisWeekRankPercent, extraQALives, streakDays
            }
            userCoupons(ownerId: $userId, redeemed: false, couponType: "QA") {
              id, redeemedAt,
              Coupon {
                id, value, name, couponType
              }
            }
          }`,
          variables = {userId: user.id};
    return graphql(query, variables)
      .then(res => {
        user = _.extend(res.data.users[0], user.attributes);
        user.userCoupons = res.data.userCoupons;

        const data = {
          user
        };
        return data;
      });
  },

  
});

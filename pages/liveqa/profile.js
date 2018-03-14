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
              rtQAPoints, qaPointsThisWeek, qaPointsThisWeekRankPercent, extraQALives, streakDays
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

        this._formatData(user);

        const data = {
          user
        };
        return data;
      });
  },

  _formatData(user) {
    user.qaReward = (user.qaReward / 100).toFixed(2);
    user.couponsReward = user.userCoupons.reduce((memo, uc) => {
      memo += uc.Coupon.value;
      return memo;
    }, 0);
    user.couponsReward = ((user.couponReward / 100) || 0).toFixed(0);
  }
});

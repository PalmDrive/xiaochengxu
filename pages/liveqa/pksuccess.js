const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');
let liveId,
    liveSchoolId;
Page({
  data: {
    user: null,
  },

  onLoad(options) {
    liveId = options.liveId
    liveSchoolId = options.liveSchoolId
    wx.setNavigationBarTitle({title: '炫耀战绩'});
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
              id, isSchoolVerified, profilePicUrl, wxUsername, qaPoints
            }
            userlives(userId: "${user.id}",liveId: "${liveId}", type: "pk") {
              points
            }
            liveSchools (id: "${liveSchoolId}") {
              id, name, profilePicUrl
            }
          }`,
          variables = {userId: user.id};
    return graphql(query, variables)
      .then(res => {
        user = _.extend(res.data.users[0], user.attributes);
        user.userLives = res.data.userlives;

        this._formatData(user);

        const data = {
          user
        };
        return data;
      });
  },

  _formatData(user) {
    user.userLives = _.chain(user.userLives)
                    .sortBy(obj => -obj.createdAt)
                    .filter(obj => obj.points || obj.cash)
                    .value();

    user.cash = user.userLives.reduce((memo, obj) => {
      // format userLive,
      // add date, rewards properties
      obj.date = utils.formatDateToDay(new Date(obj.createdAt), {year: false});
      if (obj.cash) {
        obj.rewards = obj.rewards || [];
        obj.rewards.push({
          type: '奖金', value: '￥' + (obj.cash / 100).toFixed(2)
        });
      }
      if (obj.points) {
        obj.rewards = obj.rewards || [];
        obj.rewards.push({
          type: '积分', value: obj.points
        });
      }

      memo += (obj.cash || 0);
      return memo;
    }, 0);
    user.cash = (user.rtCash / 100).toFixed(2);
    user.gecSchoolarship = (user.gecSchoolarship / 100).toFixed(2);
  }
});

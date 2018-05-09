const utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');
let liveId,
    liveSchoolId;
Page({
  data: {
    user: null,
    pkPoints: 0,
    liveSchool: {}
  },

  onLoad(options) {
    liveId = options.liveId
    liveSchoolId = options.liveSchoolId
    wx.setNavigationBarTitle({title: '炫耀战绩'});
    this._fetchData();
  },

  onShareAppMessage(options) {
    return {
      title: `${this.data.user.wxUsername}邀你参战为母校争光 瓜分50万大奖`,
      path: '/pages/liveqa/index',
      imageUrl: 'http://cdn.gecacademy.cn/miniprogram/version_2/share.jpg'
    };
  },

  backHome() {
    wx.navigateTo({
      url: `./index`
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

        const userLive = res.data.userlives.length > 0 ? res.data.userlives[0] : {},
              school = res.data.liveSchools.length > 0 ? res.data.liveSchools[0] : {};

        if (!school.profilePicUrl) {
          school.firstLetter = school.name.substr(0,1)
          school.hiddenImage = true
        }

        this.setData({
          user: user,
          pkPoints: userLive.points,
          liveSchool: school
        });
      });
  }
});

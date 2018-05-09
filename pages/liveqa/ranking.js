const mockData = require('../../utils/mockData'),
      utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql'),
      {saveFormId} = require('../../utils/user');

function querySchoolList(name) {
  return graphql(`query {
    schoolList (name: "${name}") {
      id, name
    }
  }`)
    .then(res => res.data.schoolList);
}

let couponId;

const page = Page({
  data: {
    live: null,
    user: null,
    liveSchools: null,
    students: null,
    schoolList: [], // for user select school
    selectedSchool: null,
    leaderboardType: 'schools',
    splashShown: false,
    checkinRewardModalShown: false,
    notificationSubscribed: false, // 订阅开赛通知
    ossUrl: 'http://cdn.gecacademy.cn/miniprogram/version_2/'
  },

  onLoad(options) {
  },

  onShow() {
    wx.showLoading({title: '', mask: true});

    this._fetchData()
      .then(data => {
        couponId = data.couponId;
         const states = {
          user: data.user,
          liveSchools: data.liveSchools,
          students: data.students
        };
        this.setData(states);
        wx.hideLoading();
      });
  },

  onShareAppMessage(options) {
    return {
      title: `${this.data.user.wxUsername}邀你参战为母校争光 瓜分50万大奖`,
      path: '/pages/liveqa/index',
      imageUrl: 'http://cdn.gecacademy.cn/miniprogram/version_2/share.jpg'
    };
  },

  changeLeaderboard(e) {
    const type = e.currentTarget.dataset.type;

    this.setData({
      leaderboardType: type
    });
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo(),
          query = `query q($userOrder: JSON, $userFilter: JSON) {
            liveSchools (order: [["points", "DESC"]]) {
              id, name, ranking, registeredUsersCount, points,profilePicUrl
            },
            users(id: "${user.id}") {
              myLiveSchool {
                name, rtRanking,profilePicUrl,points
              },
              rtQAPointsThisWeek
              rtCash
              extraQALives,profilePicUrl,
              qaPoints,
              rtRanking
            },
            students: users (filter: $userFilter, order: $userOrder) {
              profilePicUrl, wxUsername, qaPoints,profilePicUrl
            }
          }`,
          variables = {
            couponFilter: {name: '答题复活卡_邀请好友'},
            userOrder: [['qaPoints', 'DESC']],
            userFilter: {
              qaPoints: {$gt: 0}
            }
          };

    return graphql(query, variables)
      .then(res => {
        const userData = res.data.users ? res.data.users[0] : {},
              data = {
                user: _.extend(userData, user.attributes, {id: user.id}),
                liveSchools: res.data.liveSchools.map(school => {
                  if (!school.profilePicUrl) {
                    school.firstLetter = school.name.substr(0,1)
                    school.hiddenImage = true
                  }
                  return school
                }),
                students: res.data.students
              };
        return data;
      });
  }
});

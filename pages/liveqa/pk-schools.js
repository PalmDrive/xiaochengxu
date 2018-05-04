const graphql = require('../../utils/graphql'),
      Auth = require('../../utils/auth'),
      utils = require('../../utils/util');

const page = Page({
  data: {
    pkCount: 0,
    userSchool: {},
    liveSchools: [],
    ossUrl: 'http://cdn.gecacademy.cn/miniprogram/version_2/'
  },

  onLoad() {
    this._fetchData();
  },

  onShareAppMessage(options) {
    return {
      title: `${this.data.user.wxUsername}邀请你参加高校答题番位争夺战`,
      path: '/pages/liveqa/index',
      imageUrl: 'http://cdn.gecacademy.cn/miniprogram/version_2/share.jpg'
    };
  },

  startPK(e) {
    const liveSchoolId = e.currentTarget.dataset.item,
          ranking = e.currentTarget.dataset.ranking,
          liveId = utils.genRandomStr(),
          url = `/pages/liveqa/pk-school?liveId=${liveId}&liveSchoolId=${liveSchoolId}&ranking=${ranking}`;

    if (liveSchoolId === this.data.userSchool.id) {
      wx.showToast({
        title: '不可以挑战本校',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (this.data.pkCount <= 0) {
      wx.showToast({
        title: '今日挑战次数剩余为0，明日再战',
        icon: 'none',
        duration: 2000
      })
      return
    }
    // Create userLive
    const query = `mutation m($userLiveData: JSON, $schoolLiveData: JSON) {
      userLive(data: $userLiveData) {
        id
      }
      schoolLive: userLive(data: $schoolLiveData) {
        id
      }
    }`,
         variables = {
           userLiveData: {
             type: 'pk',
             userId: Auth.getLocalUserId(),
             liveId
           },
           schoolLiveData: {
             type: 'pk',
             liveId,
             userId: liveSchoolId,
             role: 100
           }
         };

    graphql(query, variables)
      .then(() => {
        wx.navigateTo({url});
      });
  },

  _fetchData() {
    const query = `query q($order: JSON) {
      liveSchools (order: $order, pageSize: 10) {
        id, name, points, ranking, profilePicUrl
      }
      users(id: "${Auth.getLocalUserId()}") {
        myLiveSchool {
          id, name, rtRanking, profilePicUrl, points
        }
      }
      pkCount(userId: "${Auth.getLocalUserId()}")
    }`,
          variables = {
            order: [['points', 'DESC']]
          };
    return graphql(query, variables)
      .then(res => {
        const schools = res.data.liveSchools,
              user = res.data.users.length > 0 ? res.data.users[0] : {},
              userSchool = user.myLiveSchool,
              pkCount = res.data.pkCount;

        schools.map((obj, index) => {
          if (obj.id === userSchool.id) {
            obj.pkButtonImage = this.data.ossUrl + 'pk_button_gray.png';
          } else {
            obj.pkButtonImage = this.data.ossUrl + 'pk_button.png';
          }

          if (index < 3) {
            obj.bgImage = `url(${this.data.ossUrl + 'top_bg.png'}) center center no-repeat/cover`;
          }
          return obj;
        })

        this.setData({
          liveSchools: schools,
          userSchool: userSchool,
          pkCount
        });
      });
  }
});

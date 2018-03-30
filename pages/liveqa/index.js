const mockData = require('../../utils/mockData'),
      utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore'),
      graphql = require('../../utils/graphql');

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
    //schoolList: [{id: 1, name: 'Stanford'}, {id: 2, name: '上海交通大学'}, {id: 3, name: 'Purdue University'}],
    schoolList: [], // for user select school
    selectedSchool: null,
    leaderboardType: 'schools',
    splashShown: false,
  },

  onLoad(options) {
    if (options.scene) {
      const sceneId = decodeURIComponent(options.scene);
      this._onOpenWithScene(sceneId);
    }

    if (Auth.getLocalUserId()) {
      this.setData({splashShown: true});

      // show and hide splash
      const audioCtx = wx.createInnerAudioContext();
      audioCtx.src = 'https://cdn.ailingual.cn/audios/liveqa/punch_audio.mp3';

      setTimeout(() => {
        audioCtx.play();
        setTimeout(() => {
          this.setData({
            splashShown: false
          });
        }, 800);
      }, 1400);
    }
  },

  onShow() {
    wx.showLoading({title: '', mask: true});

    this._fetchData()
      .then(data => {
        couponId = data.couponId;
        this.setData({
          live: data.live,
          user: data.user,
          liveSchools: data.liveSchools,
          students: data.students
        });
        wx.hideLoading();
        //this._timeToNextLiveCountDown();
      });
  },

  startQA() {
    wx.navigateTo({
      url: `./questions`
    });
  },

  inputSchoolName: _.debounce(function(e) { // 必须是function, 不能用 =>
    const name = e.detail.value;
    //console.log(`school: ${name}`);
    querySchoolList(name)
      .then(data => {
        this.setData({schoolList: data});
      });
  }, 500),

  selectSchool(e) {
    const school = e.target.dataset.item;
    this.setData({
      selectedSchool: school,
      schoolList: []
    });
  },

  saveSelectedSchool() {
    const user = this.data.user,
          school = this.data.selectedSchool;
    wx.showLoading({title: '', mask: true});

    const variables = {
      data: {
        schoolId: school.id
      }
    };
    return graphql(`mutation selectSchool($data: JSON) {
      user (id: "${user.id}", data: $data) {
        id
      },
      liveSchool (schoolId: "${school.id}", name: "${school.name}") {
        id
      }
    }`, variables)
      .then(() => this.onShow());
  },

  gotoSharedPoster() {
    const url = `/pages/album/share?couponId=${couponId}&appName=qaXiaochengxu`;
    wx.navigateTo({url});
  },

  gotoProfile() {
    const url = `/pages/liveqa/profile`;
    wx.navigateTo({url});
  },

  changeLeaderboard(e) {
    const type = e.currentTarget.dataset.type;

    this.setData({
      leaderboardType: type
    });
  },

  onShareAppMessage(options) {
    return {
      title: `${this.data.user.wxUsername}邀请你参加高校答题番位争夺战`,
      path: '/pages/liveqa/index',
      imageUrl: 'http://cdn.gecacademy.cn/miniprogram/qa_cover.jpg'
    };
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo(),
          query = `query q($couponFilter: JSON, $userOrder: JSON, $userFilter: JSON) {
            liveSchools (order: [["points", "DESC"]]) {
              id, name, ranking, registeredUsersCount, points
            },
            users (id: "${user.id}") {
              myLiveSchool {
                name, rtRanking
              },
              rtQAPointsThisWeek
              rtCash
              extraQALives
            },
            coupons(filter: $couponFilter) {
              id
            },
            students: users (filter: $userFilter, order: $userOrder) {
              profilePicUrl, wxUsername, qaPoints
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
                liveSchools: res.data.liveSchools,
                couponId: res.data.coupons[0].id,
                students: res.data.students
              };

        //this._setTimeToNextLive(mockData.live);
        //mockData.live.schedule = this._formatSchedule(mockData.live);

        return data;
      });
  },

  _formatSchedule(live) {
    const schedule = live.metaData.schedule.concat([]);
    schedule.unshift(+live.startAt);
    return schedule.map((timestamp, index) => {
      const date = new Date(timestamp),
            now = new Date(),
            obj = {time: utils.formatTime(date, true), label: '', bgColor: '#99E2FA'};

      if (utils.formatDateToDay(now) === utils.formatDateToDay(date)) {
        obj.label = '今';
        obj.bgColor = '#FF0000';
      } else {
        obj.label = utils.formatDateOfWeek(date);
      }
      return obj;
    });
  },

  _setTimeToNextLive(live) {
    const nextLiveStartAt = live.metaData.schedule[0],
          deltaTime = nextLiveStartAt - (+new Date());
    live.timeToNextLive = utils.convertTime(deltaTime / 1000);
    return live;
  },

  _timeToNextLiveCountDown() {
     const live = this.data.live;
     const loop = setInterval(() => {
       this._setTimeToNextLive(live);
       if (live.timeToNextLive === '00:00:00') {
         // @todo: clear the interval loop
       } else {
         this.setData({
           live
         });
       }
     }, 1000);
  },

  _onOpenWithScene(sceneId) {
    const query = `mutation {
      scanScene(id: ${sceneId}, appName: "QAXCX") {
        id
      }
    }`;
    return graphql(query);
  }
});

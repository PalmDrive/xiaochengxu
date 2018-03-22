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

const page = Page({
  data: {
    live: null,
    user: null,
    liveSchools: null,

    //schoolList: [{id: 1, name: 'Stanford'}, {id: 2, name: '上海交通大学'}, {id: 3, name: 'Purdue University'}],
    schoolList: [], // for user select school
    selectedSchool: null
  },

  onShow(options) {
    wx.showLoading({title: '', mask: true});
    this._fetchData()
      .then(data => {
        this.setData({
          live: data.live,
          user: data.user,
          liveSchools: data.liveSchools
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
      .then(() => this.onLoad());
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo(),
          query = `query {
            liveSchools (order: [["points", "DESC"]]) {
              id, name, ranking, registeredUsersCount, points
            },
            users (id: "${user.id}") {
              myLiveSchool {
                name, rtRanking
              },
              extraQALives
            }
          }`;

    return graphql(query)
      .then(res => {
        const userData = res.data.users ? res.data.users[0] : {},
              data = {
                user: _.extend(userData, user.attributes, {id: user.id}),
                liveSchools: res.data.liveSchools
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
});

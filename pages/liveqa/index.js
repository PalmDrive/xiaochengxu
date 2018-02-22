const mockData = require('../../utils/mockData'),
      utils = require('../../utils/util'),
      Auth = require('../../utils/auth'),
      _ = require('../../vendors/underscore');

Page({
  data: {
    live: null,
    user: null,
    liveSchools: null
  },

  onLoad(options) {
    this._fetchData()
      .then(data => {
        this.setData({
          live: data.live,
          user: data.user,
          liveSchools: data.liveSchools
        });

        this._timeToNextLiveCountDown();
      });
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo();
    return new Promise(resolve => {
      _.extend(mockData.user, user.attributes, {id: user.id});
      this._setTimeToNextLive(mockData.live);
      mockData.live.schedule = this._formatSchedule(mockData.live);
      resolve(mockData);
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
  }
});

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
      })
  },

  _fetchData() {
    const user = Auth.getLocalUserInfo();
    return new Promise(resolve => {
      _.extend(mockData.user, user.attributes, {id: user.id});
      mockData.live.schedule = this._formatSchedule(mockData.live);
      resolve(mockData);
    });
  },

  _formatSchedule(live) {
    live.metaData.schedule.unshift(+live.startAt);
    return live.metaData.schedule.map((timestamp, index) => {
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
});

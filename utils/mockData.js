module.exports = {
  live: {
    title: '集思高校番位战',
    status: 0,
    startAt: new Date('2018-02-10T20:00:00+0800'),
    rewardAmount: 100000,
    metaData: {
      schedule: [
        +new Date('2018-02-11T20:00:00+0800'),
        +new Date('2018-02-12T20:00:00+0800'),
      ]
    }
  },
  liveSchools: [
    {
      name: 'Stanford', registeredUsersCount: 10000, ranking: 1
    },
    {
      name: '上海交大', registeredUsersCount: 9000, ranking: 2,
    },
    {
      name: '清华', registeredUsersCount: 8000, ranking: 3
    },
    {
      name: '北大', registeredUsersCount: 7000, ranking: 4
    },
    {
      name: '浙大', registeredUsersCount: 6000, ranking: 5
    },
    {
      name: '复旦', registeredUsersCount: 5000, ranking: 6
    },
    {
      name: '中科大', registeredUsersCount: 4000, ranking: 7
    },
  ],
  user: {
    extraQALives: 3,
    liveSchool: {
      name: 'Stanford',
      ranking: 1
    }
  }
}

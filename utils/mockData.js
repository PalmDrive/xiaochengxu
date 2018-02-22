module.exports = {
  live: {
    title: '集思高校番位战',
    status: 0,
    startAt: new Date('2018-02-12T20:00:00+0800'),
    rewardAmount: 100000,
    metaData: {
      schedule: [
        +new Date('2018-02-13T20:00:00+0800'),
        +new Date('2018-02-14T20:00:00+0800'),
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
  },
  survey: {
    id: 'survey-1',
    liveId: 'live01',
    surveyQuestions: [
      {
        id: 'question-1',
        content: '集思学院的开设项目是面对多大年龄群的？',
        questionType: 'single-select',
        questionOrder: 1,
        options: [
          {
            label: 'A. 6-12岁',
            value: 'A'
          },
          {
            label: 'B. 12-24岁',
            value: 'B',
            isRight: true
          },
          {
            label: 'C. 60-80岁',
            value: 'C'
          }
        ]
      },
      {
        id: 'question-2',
        content: '相对论是谁提出的',
        questionType: 'single-select',
        questionOrder: 2,
        options: [
          {
            label: 'A. 牛顿',
            value: 'A'
          },
          {
            label: 'B. 爱因斯坦',
            value: 'B',
            isRight: true
          },
          {
            label: 'C. 伽利略',
            value: 'C'
          }
        ]
      },
      {
        id: 'question-3',
        content: '李白是哪个朝代的',
        questionType: 'single-select',
        questionOrder: 3,
        options: [
          {
            label: 'A. 唐朝',
            value: 'A',
            isRight: true
          },
          {
            label: 'B. 明朝',
            value: 'B',
            isRight: true
          },
          {
            label: 'C. 清朝',
            value: 'C'
          }
        ]
      }
    ]
  }
}

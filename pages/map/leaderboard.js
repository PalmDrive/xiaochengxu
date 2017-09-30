const AV = require('../../utils/av-weapp-min');

let lcUserId;

const alertMapping = [
  {
    min: 0,
    max: 0.5,
    text: '暂时未上榜，加油！'
  },
  {
    min: 0.5,
    max: 0.8,
    text: '潜力股，加油！'
  },
  {
    min: 0.8,
    max: 0.9,
    text: '您就是那二八比例里面的二，加油！！'
  },
  {
    min: 0.9,
    max: 1,
    text: '我叫您一声“吃王”，你敢答应吗?'
  }
];

Page({
  data: {
    users: [],
    alert: null
  },

  onLoad(options) {
    lcUserId = options.userId || '59cd1c9867f356003a56d1dd';
    console.log('lcUserId:', lcUserId);

    new AV.Query('WechatCampaignUser').get(lcUserId)
      .then(lcUser => {
        if (lcUser.get('currLocation')) {
          this._getAlert(lcUser)
            .then(alert => {
              this.setData({alert})
            });
        }
      });
  },

  onShow() {
    wx.showLoading({
      title: '刷新中'
    });
    this._fetchData()
      .then(users => {
        wx.hideLoading()
        this.setData({users});
      });
  },

  _fetchData() {
    const cql = `
      select name, profileImage, collectedUsersCount from WechatCampaignUser
      where currLocation is exists
      order by -collectedUsersCount, -createdAt 
      limit 10
    `;
    return AV.Query.doCloudQuery(cql)
      .then(res => res.results);
  },

  _getAlert(lcUser) {
    const count = lcUser.get('collectedUsersCount'),
          cql = `
            select count(*), * from WechatCampaignUser where currLocation is exists and collectedUsersCount < ?
          `,
          cql2 = `
            select count(*) from WechatCampaignUser where currLocation is exists
          `;

    return Promise.all([
      AV.Query.doCloudQuery(cql, [count]),
      AV.Query.doCloudQuery(cql2)
    ])
    .then(res => {
      let p = res[0].count / res[1].count;
      const alertObject = alertMapping.filter(o => o.min < p && p <= o.max)[0];
      p = p * 100;
      if (p % 1) {
        p = p.toFixed(1);
      }

      return `您收集了${count}个吃货，击败了${p}%的用户。${alertObject.text}`;
    });
  }
});
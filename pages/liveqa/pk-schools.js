const graphql = require('../../utils/graphql'),
      Auth = require('../../utils/auth'),
      utils = require('../../utils/util');

const page = Page({
  data: {
    liveSchools: []
  },

  onLoad() {
    this._fetchData()
      .then(data => {
        this.setData({
          liveSchools: data.liveSchools
        });
      });
  },

  startPK(e) {
    const liveSchoolId = e.currentTarget.dataset.item,
          liveId = utils.genRandomStr(),
          url = `/pages/liveqa/pk-school?liveId=${liveId}`;

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
        id, name, points, ranking
      }
    }`,
          variables = {
            order: [['points', 'DESC']]
          };
    return graphql(query, variables)
      .then(res => {
        return {
          liveSchools: res.data.liveSchools
        };
      });
  }
});

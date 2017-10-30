const app = getApp(),
      {request} = require('../../utils/request'),
      Auth = require('../../utils/auth');

const _createGroup = (groupName, creatorId) => {
  const url = `${app.globalData.apiBase}/users`,
        data = {
          attributes: {
            username: groupName,
            role: 'group'
          }
        };
  return request({
    url,
    method: 'POST',
    data: {
      data,
      meta: {
        action: 'create_app_user'
      }
    }
  })
    .then(res => {
      const group = res.data,
            data = {
              data: {
                attributes: {
                  groupId: group.id,
                  userId: creatorId,
                  role: 1
                }
              }
            };
      // create userGroup
      return request({
        url: `${app.globalData.apiBase}/user-groups`,
        method: 'POST',
        data
      })
        .then(() => group);
    });
};

Page({
  data: {
    groupName: '',
    processing: false
  },

  bindGroupNameInput(e) {
    this.setData({
      groupName: e.detail.value
    });
  },

  gotoSelectTopics() {
    const name = this.data.groupName
    if (name && !this.data.processing) {
      this.setData({processing: true});
      _createGroup(name, Auth.getLocalUserId())
        .then(g => {
          this.setData({processing: false});
          wx.navigateTo({
            url: `../topics/select-topics?groupId=${g.id}`
          });
        }, err => {
          this.setData({processing: false});
        });
    }
  }
});
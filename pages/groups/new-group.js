const app = getApp(),
      Auth = require('../../utils/auth');

const _createGroup = (groupName, creatorId) => {
  const url = `${app.globalData.apiBase}/users?from=miniProgram`,
        data = {
          attributes: {
            username: groupName,
            role: 'group'
          }
        };

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      data: {
        data,
        meta: {
          action: 'create_app_user'
        }
      },
      success(res) {
        const group = res.data.data,
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
        wx.request({
          url: `${app.globalData.apiBase}/user-groups?from=miniProgram`,
          method: 'POST',
          data,
          success(res2) {
            resolve(group);
          },
          fail(res2) {
            reject(res2);
          }
        });
      },
      fail(res) {
        reject(res);
      }
    });
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
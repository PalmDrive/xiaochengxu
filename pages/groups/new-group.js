const app = getApp();

const _createGroup = (groupName) => {
  const url = `${app.globalData.apiBase}/users`,
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
        resolve(res.data.data);
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
      _createGroup(name)
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
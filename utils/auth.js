const nameSpace = 'zdk_xiaochengxu';

const getLocalUserInfo = () => {
  return wx.getStorageSync(`${nameSpace}:userInfo`);
};

const setLocalUserInfo = userInfo => {
  wx.setStorageSync(`${nameSpace}:userInfo`, userInfo);
};

const getLocalUserId = () => {
  return wx.getStorageSync(`${nameSpace}:userId`);
};

const setLocalUserId = userId => {
  wx.setStorageSync(`${nameSpace}:userId`, userId);
};

module.exports = {
  getLocalUserInfo,
  setLocalUserInfo,
  getLocalUserId,
  setLocalUserId
};
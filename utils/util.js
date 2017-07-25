function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/*
Convert a date to a string for display
Example string: '刚刚', '20分钟前'
*/
function convertDate(date) {
  const paramDate = date.getTime();
  //获取js 时间戳
  let time = new Date().getTime();
  //去掉 js 时间戳后三位，与php 时间戳保持一致
  time = parseInt((time - paramDate) / 1000);

  //存储转换值
  let s;
  if (time < 60 * 1) {//十分钟内
    return '刚刚';
  } else if ((time < 60 * 60) && (time >= 60 * 1)) {
    //超过十分钟少于1小时
    s = Math.floor(time / 60);
    return s + '分钟前';
  } else if ((time < 60 * 60 * 24) && (time >= 60 * 60)) {
    //超过1小时少于24小时
    s = Math.floor(time / 60 / 60);
    return s + '小时前';
  } else if ((time < 60 * 60 * 24 * 3) && (time >= 60 * 60 * 24)) {
    //超过1天少于3天内
    s = Math.floor(time / 60 / 60 / 24);
    return s + '天前';
  } else {
    //超过3天
    return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
  }
}

function formatTopic(t) {
  //格式化时间
  if (t.attributes.lastMediumAddedAt) {
    t.attributes.lastMediumAddedAt = convertDate(new Date(t.attributes.lastMediumAddedAt));
  } else {
    t.attributes.lastMediumAddedAt = '';
  }
  // trim 文章标题
  if (t.attributes.lastMediumTitle) {
    t.attributes.lastMediumTitle = t.attributes.lastMediumTitle.slice(0, 15) + '...';
  }
}

function formatMedium(m) {
  if (Object.keys(m.attributes.topics).length === 0) {
    delete m.attributes.topics;
  } else {
    m.attributes.topic = m.attributes.topics[Object.keys(m.attributes.topics)[0]];
  }
}

function goToMedium(event) {
  const mediumId = event.currentTarget.dataset.id;
  wx.navigateTo({
    url: `../medium/medium?id=${mediumId}`
  });
}

function goToTopic(event) {
  const topicId = event.currentTarget.dataset.id;
  wx.navigateTo({
    url: `../topic/topic?id=${topicId}`
  });
}

function closeHint(that) {
  that.setData({showHint: false});
} 

module.exports = {
  formatTime,
  convertDate,
  formatTopic,
  formatMedium,
  goToMedium,
  goToTopic,
  closeHint
}

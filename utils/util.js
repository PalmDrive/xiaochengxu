const {request} = require('request');

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
/**
 * @return 'xxxx年x月x日'
 */
function formatDateToDay(date) {
  const year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();
  return year + '年' + month + '月' + day + '日';
}
function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * [将数字变短]
 * @param  {[number]} n [description]
 * @return {[number & string]}   [description]
 */
function shortNumber(n) {
  if (n < 1000) {
    return n;
  } else if (n >= 1000 && n < 10000) {
    let s = (n / 1000).toString();
    if (s.indexOf('.') > 0) s = s.toFixed(1);
    return s + 'k';
  } else {
    let s = (n / 1000).toString();
    if (s.indexOf('.') > 0) s = s.toFixed(1);
    return s + 'w';
  }
}

function convertTime(s) {
  var t = '';
  if(s > -1){
      var hour = Math.floor(s/3600);
      var min = Math.floor(s/60) % 60;
      var sec = s % 60;
      if (hour > 0) {
        if(hour < 10) {
            t = '0'+ hour + ':';
        } else {
            t = hour + ':';
        }
      }

      if(min < 10){t += '0';}
      t += min + ':';
      if(sec < 10){t += '0';}
      t += sec.toFixed(0);
  }
  return t;
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
  // // trim 文章标题
  // if (t.attributes.lastMediumTitle) {
  //   t.attributes.lastMediumTitle = t.attributes.lastMediumTitle.slice(0, 15) + '...';
  // }
}

function formatAlbum(t) {
  //格式化时间
  // let dateString = t.relationships.userAlbum.data.attributes.unlockedAt;
  // dateString = dateString.substr(0,19);
  // if (dateString) {
  //   let date1 = new Date(dateString).getTime();
  //   let now = new Date().getTime();
  //   let days = Math.floor((now - date1 ) / (24*3600*1000))
  //   days = days > 6 ? 6 : days;
  //   t.attributes.index = days;
  // } else {
  //   t.attributes.index = -1;
  // }
  //
  let days = t.meta.unlockedDays;
  days = days > 7 ? 7 : days;
  days = days < 1 ? 1 : days;
  t.attributes.index = days;
}

function getAchieveProgress(t) {
  // 阅读进度
  let logs = t.relationships.userAlbum.data.attributes.logs.days;
  let length = 0;
  for(var key in logs) {
    length = length + 1;
  }
  t.attributes.achieveProcess = length;
}

function formatMedium(m) {
  if (Object.keys(m.attributes.topics).length === 0) {
    delete m.attributes.topics;
  } else {
    m.attributes.topic = m.attributes.topics[Object.keys(m.attributes.topics)[0]];
  }

  // trimMediumTitle(m);
}

function formatPublishedAt(m) {
  if (m.attributes.publishedAt) {
    m.attributes.publishedAt = convertDate(new Date(m.attributes.publishedAt));
  } else {
    m.attributes.publishedAt = '';
  }
}

function goToMedium(event, gaOptions, options) {
  options = options || {};
  const albumId = options.albumId,
        idx = options.idx;

  if (gaOptions) {
    gaEvent(gaOptions);
  }

  const medium = event.currentTarget.dataset.medium;

  let url = `../medium/medium?id=${medium.id}`;

  if (medium.attributes.mediumType === 'video') {
    url = `../medium/video?id=${medium.id}`;
  }

  if (albumId) {
    url = `${url}&albumId=${albumId}&idx=${idx}`;
  }
  wx.navigateTo({
    url
  });
}

function goToTopic(event, gaOptions) {
  if (gaOptions) {
    gaEvent(gaOptions);
  }

  const topicId = event.currentTarget.dataset.topic.id;
  wx.navigateTo({
    url: `../topic/topic?id=${topicId}`
  });
}

function closeHint(that) {
  that.setData({showHint: false});
}

function ga(options) {
  if (getApp().globalData.env === 'dev') return;

  wx.request({
    method: 'POST',
    url: `https://www.google-analytics.com/collect?v=1&tid=UA-93993572-2&cid=${options.cid}&t=pageview&dh=xiaochengxu&dp=${options.dp}&dt=${options.dt}`,
    success() {
      // console.log('ga success');
    },
    fail() {
      console.log('ga pageview fail');
    }
  });
}

function gaEvent(options) {
  if (getApp().globalData.env === 'dev') return;

  wx.request({
    method: 'POST',
    url: 'https://www.google-analytics.com/collect',
    data: encodeURI(`v=1&tid=UA-93993572-2&cid=${options.cid}&t=event&ec=${options.ec}&ea=${options.ea}&el=${options.el}&ev=${options.ev}`),
    success() {
      // console.log('gaEvent success');
    },
    fail() {
      console.log('ga event fail');
    }
  });
}

//处理过长的文章标题
function trimMediumTitle(m) {
  const withPic = 20,
    noPic = 34;
  if (m.attributes.picurl) {
    m.attributes.trimmedTitle = m.attributes.title.length > withPic ? (m.attributes.title.slice(0, withPic) + '…') : m.attributes.title;
  } else {
    m.attributes.trimmedTitle = m.attributes.title.length > noPic ? (m.attributes.title.slice(0, noPic) + '…') : m.attributes.title;
  }
}

function reloadPage(page) {
  const options = page.options || {};

  // wx.showModal({
  //   title: 'page',
  //   content: JSON.stringify(page)
  // });

  let params = [],
      url = '/' + page.route;
  if (Object.keys(options).length) {
    for (let key in options) {
      params.push(`${key}=${options[key]}`);
    }
    params = params.join('&')
    url += `?${params}`;
  }
  wx.reLaunch({url});
}

function showHint(page) {
  page = page || getCurrentPages()[0];
  const systemInfo = wx.getSystemInfoSync();
  let title, content;
  console.log('sys platform:', systemInfo.platform);
  if (systemInfo.platform === 'ios') {
    title = 'iOS用户福利';
    content = 'App Store中下载“职得看”，获得更好体验。';
  } else {
    title = '小程序Tips';
    content = '点击右上角按钮，选择“添加到桌面”，可随时访问。';
  }
  page.setData({
    showHint: true,
    firstLoginHint: {title, content}
  });
};

function toPromise(fn) {
  return function(params) { // CANNOT USE =>, because need bind context
    const that = this;
    let p = new Promise((resolve, reject) => {
      params = params || {};
      params.success = resolve;
      // params.fail = (res) => {
      //   console.log('fail:');
      //   console.log(res);
      //   reject(res);
      // };
      params.fail = reject;

      fn.call(that, params);
    });
    if (params.complete) {
      p = p.then(params.complete);
    }
    return p;
  };
};

function genRandomStr() {
  return Math.random().toString(36).slice(2);
}

/**
 * objects in collection are unique with id
 */
function uniqPush(collection, object) {
  if (!collection.length) {
    return [object];
  }

  let flag = false;
  if (typeof collection[0] !== 'object') {
    flag = true;
    collection = collection.map(el => {
      return {id: el};
    });
    object = {id: object};
  }

  const map = {};
  for (let el of collection) {
    map[el.id] = el;
  }
  map[object.id] = object;
  const res = [];
  for (let key in map) {
    res.push(flag ? map[key].id : map[key]);
  }

  return res;
}

// If el in the collection,
// put the el in the first
function unshift(collection, el, key) {
  key = key || 'id';
  let res = [], tmpEl;
  collection.forEach(c => {
    if (c[key] === el[key]) {
      tmpEl = el;
    } else {
      res.push(c);
    }
  });
  if (tmpEl) {
    res.unshift(tmpEl);
  }
  return res;
}

/**
 * called in the mediumOnShow
 * @param  {dict} params
 *                params.userId
 *                params.mediumId
 *                [params.albumId]
 *                [params.index]
 */
function mediumPageOnShow(params) {
  const data = {
          data: {attributes: {
            userId: params.userId
          }}
        };

  if (params.albumId) {
    data.data.albumId = params.albumId;
    data.data.daysLog = {};
    data.data.daysLog[params.index] = +new Date();
  }
  if (params.userId && params.mediumId) {
    // console.log('记录足迹');
    request({
      method: 'POST',
      url: `${getApp().globalData.apiBase}/media/${params.mediumId}/views?from=miniProgram`,
      data
    }).then(null, err => {
      console.log('Medium page, onShow, record lastViewedAt fail');
    });
  }
}

module.exports = {
  formatTime,
  formatDateToDay,
  shortNumber,
  convertDate,
  formatPublishedAt,
  formatTopic,
  formatMedium,
  goToMedium,
  goToTopic,
  ga,
  gaEvent,
  trimMediumTitle,
  reloadPage,
  showHint,
  closeHint,
  toPromise,
  genRandomStr,
  uniqPush,
  unshift,
  formatAlbum,
  mediumPageOnShow,
  convertTime,
  getAchieveProgress
};

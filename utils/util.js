const {request} = require('request');

// 计算两个日期的相差天数
function getDays(date1, date2) {
  return Math.floor((date1 - date2) / (24 * 3600 * 1000));
}

function formatDateOfWeek(date) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
}

function formatTime(date, isShort) {
  const year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds();

  //return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
  const time = [hour, minute].map(formatNumber).join(':');
  if (isShort) {
    return time;
  } else {
    return [year, month, day].map(formatNumber).join('/') + ' ' + time;
  }
}

function startOfDay(date) {
  const year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();
  return new Date(`${year}-${month}-${day}T00:00:00+0800`);
}

/**
 * @return 'xxxx年x月x日'
 */
function formatDateToDay(date, options) {
  options = options || {
    year: true
  };

  const year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();
  let res;
  if (options.year) {
    res = year + '年' + month + '月' + day + '日';
  } else {
    res = month + '月' + day + '日';
  }
  return res;
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
  if (s >= 0) {
    let hour = Math.floor(s / 3600),
        min = Math.floor(s / 60 - hour * 60),
        sec = Math.floor(s % 60);
    if (hour < 10) hour = `0${hour}`;
    if (min < 10) min = `0${min}`;
    if (sec < 10) sec = `0${sec}`;
    return `${hour}:${min}:${sec}`;
  } else {
    return '00:00:00';
  }
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

function formatAlbumUnlockedAt(t) {
  //格式化时间
  let dateString = t.relationships.userAlbum.data.attributes.unlockedAt;
  dateString = dateString.substr(0,19);
  dateString = dateString.replace('T', '   ');
  t.attributes.unlockedAtString = dateString;
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
        dayIndex = options.dayIndex,
        mediumIndex = options.mediumIndex,
        count = options.count;

  if (gaOptions) {
    gaEvent(gaOptions);
  }

  const medium = event.currentTarget.dataset.medium;

  let url = `../medium/medium?id=${medium.id}&morningPostId=${options.morningPostId}`;

  if (medium.mediumType === 'video') {
    url = `../medium/video?id=${medium.id}`;
  }

  if (medium.mediumType === 'audio') {
    url = `../medium/audio?id=${medium.id}`;
  }

  if (albumId) { // for vidoe show
    url = `${url}&albumId=${albumId}&dayIndex=${dayIndex}&mediumIndex=${mediumIndex}&count=${count}`;
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
    content = 'App Store中下载“七日辑”，获得更好体验。';
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
      url: `${getApp().globalData.apiBase}/media/${params.mediumId}/views`,
      data
    }).then(null, err => {
      console.log('Medium page, onShow, record lastViewedAt fail');
    });
  }
}

function goToAlbum(album) {
  const {getPurchasedAlbumIdsMap} = require('user');
  wx.showLoading({
    title: '跳转中...',
    mask: true
  });
  getPurchasedAlbumIdsMap()
    .then(albumIdsMap => {
      wx.hideLoading();

      let url = `/pages/album/buy?id=${album.id}`;
      if (albumIdsMap[album.id]) {
        if (album.programStartAt || (album.attributes && album.attributes.programStartAt)) {
          url = `/pages/album/daily?albumId=${album.id}`;
        } else {
          url = `/pages/album/show?id=${album.id}`;
        }
      }
      wx.navigateTo({url});
    })
    .catch(err => wx.hideLoading());
}


//  1 2 3 4… 19
// ... 5 6 7… 19
// … 8 9 10 … 19
// … 11 12 13 … 19
// … 14 15 16 ... 19
// ... 15 16 17 18 19
/**
 * @param page {Number} The current page
 * @param pages {Number} The total pages
 * @param length {Number} The length of the pager, including symbol
 * @return pager {Array}
 */
function getPager(page, pages, length) {
   const delta = length - 3,
         symbol = '...',
         pager = [],
         minLast = pages - length + 2;

   let min = 2, index, max;
   if (page <= length - 2) {
     pager[0] = 1;
   } else {
     pager[0] = symbol;
   }

   if (page >= minLast) {
     for (let i = minLast; i <= pages; i++) {
       pager.push(i);
     }
   } else {
     index = Math.max(Math.floor((page - 2) /  delta) + 1, 1);
     min = 2 + (index - 1) * delta;
     max = min + delta - 1;
     for (let i = min; i <= max; i++) {
       pager.push(i);
     }
     pager.splice(pager.length, 0, symbol, pages)
   }

   return pager;
 }

module.exports = {
  formatTime,
  formatDateToDay,
  formatDateOfWeek,
  shortNumber,
  convertDate,
  startOfDay,
  formatPublishedAt,
  formatTopic,
  formatMedium,
  goToMedium,
  goToTopic,
  goToAlbum,
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
  getAchieveProgress,
  formatAlbumUnlockedAt,
  getDays,
  getPager
};

const _ = require('../../vendors/underscore'),
    Auth = require('../../utils/auth'),
    util = require('../../utils/util'),
    {getSubscribedTopicIds, subscribe, unsubscribe, getGroupSubscribedTopicIds} = require('../../utils/topic');

const app = getApp();

const _getFields = () => {
  const url = `${app.globalData.apiBase}/fields?from=miniProgram`;

  return new Promise((resolve, reject) => {
    wx.request({
      url, 
      success(res) {
        resolve(res.data.data);
      },
      fail(res) {
        reject(res);
      }
    });
  });
};

const _getTopicsByField = (fieldId, options) => {
  const defaultOptions = {
    size: 10,
    number: 1
  };

  _.extend(defaultOptions, options || {});

  const url = `${app.globalData.apiBase}/fields/${fieldId}/topics?page[size]=${defaultOptions.size}&page[number]=${defaultOptions.number}&from=miniProgram`;

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      success(res) {
        resolve(res.data.data);        
      },
      fail(res) {
        reject(res);
      }
    });
  });
};

// Add isSubscribed attribute in topic
const _updateTopicsIsSubscribed = (topics, subscribedTopicIds) => {
  topics.forEach(d => {
    d.attributes.isSubscribed = subscribedTopicIds.indexOf(d.id) !== -1;
  });
  return topics;
};

const pageSize = 8;

let groupId,
    groupSubscribedTopicIds = [];

Page({
  data: {
    /**
     * [{
     *   id: '',
     *   attributes: {}
     *   page: {size, number},
     *   loadedAllTopics: false,
     *   topics: [{}]
     * }]
     */
    fields: [],
    selectedFieldId: '',
    topics: [],
    loadingMore: false
  },

  onLoad(options) {
    groupId = options.groupId;

    Promise.all([
      _getFields(),
      getGroupSubscribedTopicIds(groupId)
    ])
      .then(res => {
        const data = res[0];
        groupSubscribedTopicIds = res[1];

        data.forEach(d => {
          d.page = {
            size: pageSize,
            number: 1
          };
          d.loadedAllTopics = false;
        });

        // Load the first field topics
        const e = {
          currentTarget: {
            dataset: {
              fieldId: data[0].id
            }
          }
        };
        this.setData({fields: data});
        return this.onSelectField(e);
      })
      .catch(console.log);
  },

  _getSelectedField(selectedFieldId) {
    selectedFieldId = selectedFieldId || this.data.selectedFieldId;
    //const defField = {topics: []};
    return this.data.fields.filter(f => f.id === selectedFieldId)[0];
  },

  _getTopic(id) {
    return this.data.topics.filter(t => t.id === id)[0];
  },

  goToTopic(e) {
    console.log('toToTopic called');
  },

  onSelectField(e) {
    const selectedFieldId = e.currentTarget.dataset.fieldId,
          fields = this.data.fields,
          selectedField = this._getSelectedField(selectedFieldId);

    let promise = new Promise((resolve, reject) => resolve(true));

    if (!selectedField.topics) {
      promise = _getTopicsByField(selectedFieldId, {
        size: selectedField.page.size,
        number: selectedField.page.number
      })
        // Lazy loading topic for field
        // This changes this.data.fields too
        .then(topics => selectedField.topics = topics);
    } else {
      console.log('cached'); 
    }

    return promise
      .then(() => {
      /**
       * 保证在订阅/取消订阅以后, 
       * 其他fields底下的topic.isSubscribed能都sync上
       * 否则如果订阅了一个topic, 而它还在不同的field下，
       * 则另外的field下它的isSubscribed还是false
       */
        _updateTopicsIsSubscribed(selectedField.topics, groupSubscribedTopicIds);
        return this.setData({
          selectedFieldId,
          fields,
          topics: selectedField.topics
        });
      });
  },
  
  /**
   * Load more topics
   */
  loadMore(e) {
    if (this.data.loadingMore) {
      return console.log('Still loading. Do nothing.');
    }

    //console.log('load more trigger');

    const selectedFieldId = this.data.selectedFieldId,
          fields = this.data.fields,
          selectedField = this._getSelectedField();

    if (selectedField.loadedAllTopics) {
      return console.log('all topics loaded');
    }

    this.setData({loadingMore: true});

    const currentPageNumber = selectedField.page.number + 1;
    _getTopicsByField(selectedField.id, {
      size: pageSize,
      number: currentPageNumber
    })
      .then(topics => {
        if (!topics.length) {
          selectedField.loadedAllTopics = true;
          return topics;
        } else {
          return _updateTopicsIsSubscribed(topics, groupSubscribedTopicIds);
        }
      })
      .then(topics => {
        selectedField.topics = selectedField.topics.concat(topics);
        selectedField.page.number = currentPageNumber;
        
        this.setData({
          loadingMore: false,
          fields,
          topics: selectedField.topics
        });
      });
  },

  subscribeTopic(e) {
    const topicId = e.currentTarget.dataset.topicId,
          topic = this._getTopic(topicId),
          isForGroup = true;

    if (!topic._processing) {
      topic._processing = true;

      if (!topic.attributes.isSubscribed) {
        //this.setData({subscribeButton: '订阅中...'});
        subscribe(groupId, topicId, isForGroup)
          .then(() => {
            groupSubscribedTopicIds.push(topicId);
            delete topic._processing;
            topic.attributes.isSubscribed = true;
            this.setData({topics: this.data.topics});
            //this.setData({subscribeButton: '已订阅'});
          }, () => delete topic._processing);
      } else {
        //this.setData({subscribeButton: '取消中...'});
        unsubscribe(groupId, topicId, isForGroup)
          .then(() => {
            groupSubscribedTopicIds = groupSubscribedTopicIds.filter(id => id !== topicId);
            delete topic._processing;
            topic.attributes.isSubscribed = false;
            this.setData({topics: this.data.topics});
          }, () => delete topic._processing);
      }
    }
  }
});
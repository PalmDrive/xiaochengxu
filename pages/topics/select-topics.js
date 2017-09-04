const _ = require('../../vendors/underscore');

const app = getApp();

const _getFields = () => {
  const url = `${app.globalData.apiBase}/fields`;

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

  const url = `${app.globalData.apiBase}/fields/${fieldId}/topics?page[size]=${defaultOptions.size}&page[number]=${defaultOptions.number}&from=app`;

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

const pageSize = 8;

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
    selectedField: {},
    loadingMore: false
  },

  onLoad(options) {
    _getFields()
      .then(data => {
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
              field: data[0]
            }
          }
        };
        this.setData({fields: data});
        return this.selectField(e);
      })
      .catch(console.log);
  },

  goToTopic(e) {
    console.log('toToTopic called');
  },

  selectField(e) {
    const field = e.currentTarget.dataset.field,
          fields = this.data.fields;

    if (!field.topics) {
      return _getTopicsByField(field.id, {
        size: field.page.size,
        number: field.page.number
      })
        .then(topics => {
          field.topics = topics; // this will not change this.data.fields

          fields.forEach(f => {
            if (f.id === field.id) {
              f.topics = topics;
            }
          });

          return this.setData({
            selectedField: field,
            fields
          });
        });
    } else {
      console.log('cached');
      return new Promise((resolve, reject) => {
        this.setData({
          selectedField: field
        });
        resolve(true);
      });
    }
  },
  
  /**
   * Load more topics
   */
  loadMore(e) {
    if (this.data.loadingMore) {
      return console.log('Still loading. Do nothing.');
    }

    //console.log('load more trigger');

    const selectedField = this.data.selectedField,
          fields = this.data.fields;

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
        }
        let index;
        fields.forEach((f, i) => {
          if (f.id === selectedField.id) {
            index = i;
            return;
          }
        });
        selectedField.topics = selectedField.topics.concat(topics);
        selectedField.page.number = currentPageNumber;
        fields[index] = selectedField; 
        this.setData({
          selectedField,
          loadingMore: false,
          fields
        });
      });
  }
});
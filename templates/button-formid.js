var template = {
  getFromId(e) {
    console.log(e);
    wx.showToast({
      title: e.detail.formId || 'null'
    })
  }
}
export default template

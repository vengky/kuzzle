const
  {
    defineSupportCode
  } = require('cucumber');

defineSupportCode(function ({When, Then}) {
  When(/^I list "([^"]*)" data collections(?: in index "([^"]*)")?$/, function (type, index) {
    return this.api.listCollections(index, type)
      .then(result => {
        this.result = result;
      });
  });

  Then(/^I can ?(not)* find a ?(.*?) collection ?(.*)$/, function (not, type, collection, callback) {
    if (!Array.isArray(this.result)) {
      return callback('Expected a collections list result, got: ' + this.result);
    }

    if (!collection) {
      if (this.result.length === 0) {
        if (not) {
          return callback();
        }

        return callback('Collection list is empty, expected collections to be listed');
      }
    }

    if (this.result.filter(item => item.type === type && item.name === collection).length !== 0) {
      if (not) {
        return callback('Expected collection ' + collection + ' not to appear in the collection list');
      }

      return callback();
    }

    callback('Expected to find the collection <' + collection + '> in this collections list: ' + JSON.stringify(this.result.collections));
  });

  Then(/^I change the mapping(?: in collection "([^"]*)")?(?: in index "([^"]*)")?$/, function (collection, index) {
    return this.api.updateMapping(collection, index);
  });

  Then(/^I truncate the collection(?: "(.*?)")?(?: in index "([^"]*)")?$/, function (collection, index) {
    return this.api.truncateCollection(index, collection);
  });

  When(/^I check if index "(.*?)" exists$/, function (index) {
    return this.api.indexExists(index)
      .then(response => {
        this.result = response;
      })
      .catch(error => {
        this.result = {error};
      });
  });

  When(/I check if collection "(.*?)" exists on index "(.*?)"$/, function (collection, index) {
    return this.api.collectionExists(collection, index)
      .then(response => {
        this.result = response;
      })
      .catch(error => {
        this.result = {error};
      });
  });
});

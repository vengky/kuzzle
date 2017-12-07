const
  {
    defineSupportCode
  } = require('cucumber'),
  async = require('async'),
  Bluebird = require('bluebird');

defineSupportCode(function ({When, Then}) {
  When(/^I create an index named "([^"]*)"$/, function (index) {
    return this.api.createIndex(index)
      .then(result => {
        this.result = result;
      });
  });

  Then(/^I'm ?(not)* able to find the index named "([^"]*)" in index list$/, function (not, index, callback) {
    var main = function (callbackAsync) {
      this.api.listIndexes()
        .then(indexes => {
          if (!indexes) {
            callbackAsync(not ? undefined : 'No result provided');
          }

          else if (indexes.indexOf(index) !== -1) {
            callbackAsync(not && 'Index ' + index + ' exists');
          }

          else {
            callbackAsync(not ? undefined : 'Index ' + index + ' is missing');
          }
        })
        .catch(error => {
          callbackAsync(not ? undefined : error);
        });
    };


    async.retry({times: 20, interval: 20}, main.bind(this), err => {
      callback(err && new Error(err.message || err));
    });
  });

  Then(/^I'm able to delete the index named "([^"]*)"$/, function (index) {
    return this.api.deleteIndex(index);
  });

  Then(/^I refresh the index( ".*?")?$/, function (index) {
    return this.api.refreshIndex(index);
  });

  When(/^I (enable|disable) the autoRefresh(?: on the index "(.*?)")?$/, function (enable, index) {
    const autoRefresh = (enable === 'enable');

    return this.api.setAutoRefresh(index, autoRefresh)
      .then(body => {
        if (body.error) {
          return Bluebird.reject(body.error.message || body.error);
        }

        this.result = body;

        return body;
      });
  });

  Then(/^I check the autoRefresh status(?: on the index "(.*?)")?$/, function (index) {
    return this.api.getAutoRefresh(index)
      .then(body => {
        if (body.error) {
          return Bluebird.reject(body.error.message || body.error);
        }

        this.result = body;

        return body;
      });
  });
});


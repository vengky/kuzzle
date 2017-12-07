const
  {
    defineSupportCode
  } = require('cucumber'),
  async = require('async'),
  Bluebird = require('bluebird');

defineSupportCode(function ({Then}) {
  Then(/^I count ([\d]*) documents(?: in collection "([^"]*)")?(?: in index "([^"]*)")?$/, function (number, collection, index, callback) {
    const main = callbackAsync => {
      setTimeout(() => {
        this.api.count({}, collection, index)
          .then(count => callbackAsync(count !== parseInt(number) && 'No correct value for count. Expected ' + number + ', got ' + count))
          .catch(error => callbackAsync(error));
      }, 100); // end setTimeout
    };

    async.retry(20, main, err => {
      callback(err && new Error(err.message || err));
    });
  });

  Then(/^I count ([\d]*) documents with "([^"]*)" in field "([^"]*)(?: in collection "([^"]*)")?(?: in index "([^"]*)")?"/, function (number, value, field, collection, index, callback) {
    const main = callbackAsync => {
      setTimeout(() => {
        const query = {
          query: {
            match: {}
          }
        };

        query.query.match[field] = value;

        this.api.count(query, collection, index)
          .then(count => callbackAsync(count !== parseInt(number) && 'Wrong document count received. Expected ' + number + ', got ' + count))
          .catch(error => callbackAsync(error));
      }, 100); // end setTimeout
    };

    async.retry(20, main, err => {
      callback(err && new Error(err.message || err));
    });
  });
});


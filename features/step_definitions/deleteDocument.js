const
  {
    defineSupportCode
  } = require('cucumber'),
  async = require('async'),
  Bluebird = require('bluebird');

defineSupportCode(function ({Then}) {
  Then(/^I remove the document(?: in collection "([^"]*)")?(?: in index "([^"]*)")?$/, function (collection, index) {
    return this.api.delete(this.result.id, collection, index);
  });

  Then(/^I remove documents with field "([^"]*)" equals to value "([^"]*)"(?: in collection "([^"]*)")?(?: in index "([^"]*)")?$/, function (field, value, collection, index, callback) {
    var main = function (callbackAsync) {
      setTimeout(() => {
        const query = {
          match: {
            [field]: value
          }
        };

        this.api.delete(query, collection, index)
          .then(() => {
            callbackAsync();
          })
          .catch(error => {
            callbackAsync(error);
          });
      }, 20); // end setTimeout
    };

    async.retry(20, main.bind(this), err => {
      if (err) {
        callback(err);
        return false;
      }

      callback();
    });
  });

  Then(/^I remove the documents '([^']+)'( and get partial errors)?$/, function (documents, withErrors) {
    documents = JSON.parse(documents);

    return this.api.mDelete(documents)
      .then(response => {
        if(withErrors) {
          return Bluebird.reject('Should get partial error');
        }
      })
      .catch(error => {
        if (withErrors && error.status === 206) {
          return Bluebird.resolve();
        }
        return Bluebird.reject(error);
      })
  });
});


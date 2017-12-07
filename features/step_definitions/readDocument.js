const
  {
    defineSupportCode
  } = require('cucumber'),
  async = require('async'),
  Bluebird = require('bluebird');

defineSupportCode(function ({Then}) {
  Then(/^I'm ?(not)* able to get the document(?: in collection "([^"]*)")?(?: in index "([^"]*)")?$/, function (not, collection, index, callback) {
    const main = callbackAsync => {
      this.api.get(this.result.id, collection, index)
        .then(doc => callbackAsync(not && 'Object with id '+ this.result.id + ' exists'))
        .catch(error => callbackAsync(not ? undefined : error));
    };


    async.retry({times: 20, interval: 20}, main, err => {
      callback(err && new Error(err.message || err));
    });
  });

  Then(/^my document has the value "([^"]*)" in field "([^"]*)"$/, function (value, field, callback) {
    const main = callbackAsync => {
      setTimeout(() => {
        this.api.get(this.result.id)
          .then(doc => {
            if (doc.content === undefined) {
              callbackAsync('Empty content');
              return false;
            }

            if (doc.content[field] === undefined) {
              callbackAsync('Undefined field ' + field);
              return false;
            }

            if (doc.content[field] !== value) {
              callbackAsync('Value in field ' + field + ' is ' + doc.content[field] + ' expected to be ' + value);
              return false;
            }

            callbackAsync();
          })
          .catch( error => callbackAsync(error));
      }, 100); // end setTimeout
    };

    async.retry(20, main, err => {
      callback(err && new Error(err.message || err));
    });
  });

  Then(/^I ?(don't)* find a document with "([^"]*)"(?: in field "([^"]*)")?(?: in index "([^"]*)")?(?: with scroll "([^"]*)")?$/, function (not, value, field, index, scroll) {
    var query = {query: { match: { [field]: (value === 'true' ? true : value) }}};
    var args = {};

    if (scroll) {
      args.scroll = scroll;
      args.from = 0;
      args.size = 1;
    }

    return this.api.search(query, args, this.fakeCollection, index)
      .then(result => {
        if (result && result.options && result.options.scrollId) {
          this.scrollId = result.options.scrollId;
        }

        if (result && result.documents && result.total !== 0) {
          if (not) {
            return Bluebird.reject(new Error('A document exists for the query'));
          }
          return Bluebird.resolve();
        }

        if (not) { return Bluebird.resolve(); }
        return Bluebird.reject(new Error('No result for query search'));
      });
  });

  Then(/^I am ?(not)* able to scroll previous search$/, function (not) {
    if (!this.scrollId) {
      if (not) {
        return Bluebird.resolve();
      }

      return Bluebird.reject(new Error('No scroll id from previous search available'));
    }

    return this.api.scroll(this.scrollId)
      .then(result => {
        if (result.documents && result.documents.length > 0) {
          if (not) { return Bluebird.reject(new Error('A document exists for the scrollId')); }
          return Bluebird.resolve();
        }

        if (not) { return Bluebird.resolve(); }
        return Bluebird.reject(new Error('No result for scrollId search'));
      })
      .catch(error => {
        if (not) { return Bluebird.resolve(); }
        return Bluebird.reject(error);
      });
  });

  Then(/^I should receive a document id$/, function (callback) {
    if (this.result && this.result.id) {
      callback();
      return false;
    }

    callback(new Error('No id information in returned object'));
  });

  Then(/^I get ([\d]+) documents '([^']+)'?$/, function (count, documents, callback) {
    this.api.mGet(JSON.parse(documents))
      .then(result => {
        if (result.total !== Number.parseInt(count)) {
          callback('Document count (' + result.total + ') not as expected (' + count + ')');
          return false;
        }
        callback();
      })
      .catch(error => callback(error));
  });

  Then(/^I check that the document "([^"]*)" ?(doesn't)* exists$/, function (id, not, callback) {
    this.api.exists(id)
      .then(result => {
        if (result) {
          return callback(not && new Error('The document exists'));
        }

        return callback(not ? undefined : new Error('The document doesn\'t exists'));
      })
      .catch(error => callback(error));
  });
});


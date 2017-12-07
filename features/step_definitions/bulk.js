const
  {
    defineSupportCode
  } = require('cucumber'),
  async = require('async'),
  Bluebird = require('bluebird');

defineSupportCode(function ({Then, When}) {
  Then(/^I can retrieve actions from bulk import$/, function (callback) {
    const main = callbackAsync => {
      setTimeout(() => {
        // execute in parallel both tests: test if create/update work well and test if delete works well
        async.parallelLimit({
          testUpdate: callbackAsyncParallel => {
            this.api.get('1')
              .then(doc => {
                if (doc.content.title === 'foobar') {
                  callbackAsyncParallel();
                  return false;
                }

                callbackAsyncParallel('Document was not updated or created successfully in bulk import');
              })
              .catch(error => callbackAsync(error));
          },
          testDelete: callbackAsyncParallel => {
            this.api.get('2')
              .then(doc => callbackAsyncParallel('Document still exists'))
              .catch(err => callbackAsyncParallel());
          }
        }, 1, error => {
          callbackAsync(error)
        }); // end async.parallel
      }, 20); // end setTimeout
    }; // end method main

    async.retry(20, main, err => {
      callback (err && new Error(err.message || err));
    });
  });

  When(/^I ?(can't)* do a bulk import(?: from index "([^"]*)")?$/, function (not, index) {
    return this.api.bulkImport(this.bulk, index)
      .then(body => {
        if (not) {
          return Bluebird.reject('User can do a bulk import on a restricted index');
        }
      }).catch(err => {
          if (not) {
            return Bluebird.resolve();
          }
          return Bluebird.reject(err);
      });
  });

  When(/^I do a global bulk import$/, function () {
    return this.api.globalBulkImport(this.globalBulk);
  });
});


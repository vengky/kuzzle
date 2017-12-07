const
  {
    defineSupportCode
  } = require('cucumber');

defineSupportCode(function ({When, Then}) {
  When(/^I publish a message$/, function (callback) {
    this.api.publish(this.documentGrace)
      .then(body => {
        if (body.error) {
          callback(new Error(body.error.message));
          return false;
        }

        if (!body.result) {
          callback(new Error('No result provided'));
          return false;
        }

        this.result = body;
        callback();
      })
      .catch(error => callback(error));
  });

  Then(/^I should receive a request id$/, function (callback) {
    callback((this.result && this.result.requestId) ? undefined : new Error('No request id returned'));
  });
});


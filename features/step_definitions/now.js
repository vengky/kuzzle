const
  {
    defineSupportCode
  } = require('cucumber');

defineSupportCode(function ({When, Then}) {
  When(/^I get the server timestamp$/, function() {
    return this.api.now()
      .then(result => {
        this.result = result;
      });
  });

  Then(/^I can read the timestamp$/, function(callback) {
    if (!this.result || !Number.isInteger(this.result)) {
      return callback('Expected a timestamp result, got: ' + this.result);
    }

    callback();
  });
});

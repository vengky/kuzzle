const
  {
    defineSupportCode
  } = require('cucumber');

defineSupportCode(function ({When, Then}) {
  When(/^I get the last statistics frame$/, function () {
    return this.api.getLastStats()
      .then(result => {
        this.result = result;
      });
  });

  When(/^I get the statistics frame from a date$/, function () {
    return this.api.getStats(new Date().getTime()-1000000)
      .then(result => {
        this.result = result;
      });
  });

  When(/^I get the statistics frame between 2 dates$/, function () {
    return this.api.getStats(new Date().getTime()-1000000, new Date().getTime()-500000)
      .then(result => {
        this.result = result;
      });
  });

  When(/^I get all statistics frames$/, function () {
    return this.api.getAllStats()
      .then(result => {
        this.result = result;
      });
  });

  Then(/^I get at least 1 statistic frame$/, function (callback) {
    if (!this.result) {
      return callback('Expected a statistics result, got: ' + this.result);
    }

    if (this.result &&
      this.result.length > 0 &&
      this.result[0].ongoingRequests &&
      this.result[0].completedRequests &&
      this.result[0].failedRequests &&
      this.result[0].connections) {
      return callback();
    }

    if (this.result.ongoingRequests &&
      this.result.completedRequests &&
      this.result.failedRequests &&
      this.result.connections) {
      return callback();
    }

    callback('Expected at least 1 statistic frame, found: ' + this.result);
  });
});


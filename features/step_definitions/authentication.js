const
  {
    defineSupportCode
  } = require('cucumber'),
  Bluebird = require('bluebird');

defineSupportCode(function ({Then, When}) {
  When(/^I( can't)? log in as (.*?):(.*?) expiring in (.*?)$/, function (cantLogin, login, password, expiration) {
    return this.api.login('local', {username: this.idPrefix + login, password: password, expiresIn: expiration})
      .then(result => {
        if (!result.jwt) {
          return Bluebird.reject('No token received');
        }
        if (cantLogin) {
          return Bluebird.reject('Should not be able to login');
        }
        this.jwt = result.jwt;
      })
      .catch(error => {
        if (cantLogin && error.statusCode === 401) {
          return Bluebird.resolve();
        }
        return Bluebird.reject(error);
      });
  });

  Then(/^I log ?out$/, function () {
    return this.api.logout();
  });

  Then(/^I check the JWT Token$/, function () {
    return this.api.checkToken(this.jwt)
      .then(result => {
        this.result = result;
      });
  });

  Then(/^I delete the jwt from SDK$/, function () {
    return this.api.unsetJwt();
  });

  Then(/^The token is (.*?)$/, function (state) {
    if (this.result.valid !== (state === 'valid')) {
      return Bluebird.reject('Expected token to be ' + state + ', got: ' + JSON.stringify(this.result));
    }
    return Bluebird.resolve();
  });

  Then(/^I update current user with data \{(.*?)}$/, function (dataBody) {
    return this.api.updateSelf(JSON.parse('{' + dataBody + '}'));
  });

  Then(/^I get the registrated authentication strategies$/, function () {
    return this.api.getAuthenticationStrategies()
      .then(result => {
        if (result.indexOf('local') === -1) {
          return Bluebird.reject('The default \'local\' authentication strategy wasn\'t found in the list of registrated strategies');
        }

        this.result = result;
      });
  });
});

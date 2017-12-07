const
  {
    defineSupportCode
  } = require('cucumber'),
  _ = require('lodash'),
  async = require('async'),
  Bluebird = require('bluebird');

defineSupportCode(function ({When, Then, Given}) {
  When(/^I get the user mapping$/, function () {
    return this.api.getUserMapping()
      .then(result => {
        this.result = result.mapping;
      });
  });

  Then(/^I change the user mapping$/, function () {
    return this.api.updateUserMapping();
  });

  When(/^I (can't )?create a (restricted )?user "(.*?)" with id "(.*?)"$/, {timeout: 20000}, function (not, isRestricted, user, id) {
    const userObject = this.users[user];

    const method = isRestricted ? 'createRestrictedUser' : 'createUser';

    return this.api[method](this.idPrefix + id, userObject)
      .then(res => {
        if (not) {
          return Bluebird.reject(res);
        }
      })
      .catch(error => {
        if (not) {
          return Bluebird.resolve();
        }
        return Bluebird.reject(error);
      });
  });

  Then(/^I am able to get the user "(.*?)"(?: matching {(.*)})?$/, function (id, match) {
    return this.api.getUser(this.idPrefix + id)
      .then(user => {
        if (match) {
          const
            matchString = match.replace(/#prefix#/g, this.idPrefix),
            matchObject = JSON.parse('{' + matchString + '}');

          if (!_.matches(matchObject)(user)) {
            return Bluebird.reject('Error: ' + JSON.stringify(user) + ' does not match {' + matchString + '}');
          }
        }
      });
  });

  Then(/^I search for {(.*?)} and find (\d+) users(?: matching {(.*?)})?$/, function (query, count, match) {
    if (count) {
      count = parseInt(count);
    }

    const main = callbackAsync => {
      query = query.replace(/#prefix#/g, this.idPrefix);

      this.api.searchUsers(JSON.parse('{' + query + '}'))
        .then(result => {

          if (count !== result.total) {
            return cb(new Error('Expected ' + count + ' results, got ' + result.total + '\n' + JSON.stringify(result.users)));
          }

          if (match) {
            const
              matchString = match.replace(/#prefix#/g, this.idPrefix),
              matchFunc = _.matches(JSON.parse('{' + matchString + '}'));

            if (!result.users.every(user => matchFunc(user))) {
              return cb(new Error('Error: ' + JSON.stringify(result.users) + ' does not match ' + matchString));
            }
          }

          cb(null);
        })
        .catch(error => cb(error));
    };

    async.retry({times: 40, interval: 50}, run, err => {
      if (err) {
        return callback(new Error(err.message));
      }

      return callback();
    });
  });

  Then(/^I replace the user "(.*?)" with data {(.*?)}$/, function (id, data) {
    return this.api.replaceUser(this.idPrefix + id, JSON.parse('{' + data + '}'));
  });

  Then(/^I delete the user "(.*?)"$/, function (id) {
    return this.api.deleteUser(this.idPrefix + id, true);
  });

  Then(/^I am getting the current user, which matches \{(.*?)}$/, function (match) {
    return this.api.getCurrentUser()
      .then(user => {
        const matchString = match.replace(/#prefix#/g, this.idPrefix);

        if (!_.matches(JSON.parse('{' + matchString + '}'))(user)) {
          return Bluebird.reject('Expected: ' + matchString + '\nGot: ' + JSON.stringify(user));
        }
      });
  });

  Then(/^I'm ?(not)* able to find rights for user "([^"]*)"$/, function (not, id) {
    return this.api.getUserRights(this.idPrefix + id)
      .then(rights => {
        if (not) {
          return Bluebird.reject(`User with id ${id} exists`);
        }
      })
      .catch(error => {
        if (not) {
          return Bluebird.resolve();
        }
        return Bluebird.reject(error);
      });
  });

  Then(/^I'm able to find my rights$/, function () {
    return this.api.getMyRights();
  });

  Given(/^A scrolled search on users$/, function () {
    this.scrollId = null;

    return this.api.searchUsers({}, {scroll: '1m'})
      .then(result => {
        this.scrollId = result.scrollId;
      });
  });

  Then(/^I am able to perform a scrollUsers request$/, function () {
    if (!this.scrollId) {
      return Bluebird.reject('No previous scrollId found');
    }

    return this.api.scrollUsers(this.scrollId)
      .then(result => {
        if (['hits', 'scrollId', 'total'].some(prop => result[prop] === undefined)) {
          return Bluebird.reject('Incomplete scroll results');
        }
      });
  });
});

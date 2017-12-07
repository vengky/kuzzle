'use strict';

const
  _ = require('lodash'),
  {defineSupportCode} = require('cucumber'),
  Bluebird = require('bluebird');

defineSupportCode(function ({After, Before}) {
  // before first
  Before(function (scenarioResult) {
    const
      scenario = scenarioResult.scenario,
      feature = scenario.feature;

    if (feature.scenarios[0] === scenario) {
      // 1st scenario
      const
        fixtures = require('../fixtures/functionalTestsFixtures.json'),
        promises = [];

      for (const index of Object.keys(fixtures)) {
        promises.push(() => this.api.deleteIndex(index)
          .catch(() => true));
      }
      promises.push(() => this.api.createIndex(this.fakeIndex));
      promises.push(() => this.api.createCollection(this.fakeCollection));
      promises.push(() => this.api.createCollection(this.fakeAltCollection));

      promises.push(() => this.api.createIndex(this.fakeAltIndex));
      promises.push(() => this.api.createCollection(this.fakeCollection, this.fakeAltIndex));
      promises.push(() => this.api.createCollection(this.fakeAltCollection, this.fakeAltIndex));

      return Bluebird.each(promises, promise => promise());
    }

  });

  // after last
  After(function (scenarioResult) {
    const
      scenario = scenarioResult.scenario,
      feature = scenario.feature;

    if (scenario !== feature.scenarios[feature.scenarios.length - 1]) {
      return;
    }

    const
      promises = [];

    for (const index of [
      this.fakeIndex,
      this.fakeAltIndex,
      this.fakeNewIndex
    ]) {
      promises.push(this.api.deleteIndex(index)
        .catch(() => true));
      promises.push(this.api.setAutoRefresh(index, false));
    }

    return Bluebird.all(promises)
      .finally(() => this.api.disconnect());
  });

  After(function () {
    return this.api.truncateCollection()
      .then(() => this.api.refreshIndex(this.fakeIndex))
      .then(() => true)
      .catch(() => true);
  });

  After({tags: '@realtime'}, function () {
    return this.api.unsubscribeAll()
      .catch(() => true);
  });

  Before({tags: '@security'}, function () {
    return cleanSecurity.call(this);
  });

  After({tags: '@security'}, function () {
    return cleanSecurity.call(this);
  });

  Before({tags: '@redis'}, function () {
    return cleanRedis.call(this);
  });

  After({tags: '@redis'}, function () {
    return cleanRedis.call(this);
  });

  Before({tags: '@validation'}, function () {
    return cleanValidations.call(this);
  });

  After({tags: '@validation'}, function () {
    return cleanValidations.call(this);
  });

});

function cleanSecurity () {
  if (this.currentUser) {
    delete this.currentUser;
  }

  this.api.unsetJwt();

  return this.api.refreshInternalIndex()
    .then(() => this.api.searchUsers({match_all: {}}, {from: 0, size: 999}))
    .then(results => {
      const
        regex = new RegExp('^' + this.idPrefix),
        users = results.users.filter(r => r.id.match(regex)).map(r => r.id);

      return users.length > 0
        ? this.api.deleteUsers(users)
        : Bluebird.resolve();
    })
    .then(() => this.api.searchProfiles({match_all: {}}, {from: 0, size: 999}))
    .then(results => {
      const
        regex = new RegExp('^' + this.idPrefix),
        profiles = results.profiles.filter(r => r.id.match(regex)).map(r => r.id);

      return profiles.length > 0
        ? this.api.deleteProfiles(profiles)
        : Bluebird.resolve();
    })
    .then(() => this.api.searchRoles({match_all: {}}, {from: 0, size: 999}))
    .then(results => {
      const
        regex = new RegExp('^' + this.idPrefix),
        roles = results.roles.filter(r => r.id.match(regex)).map(r => r.id);

      return roles.length > 0
        ? this.api.deleteRoles(roles)
        : Bluebird.resolve();
    });
}

function cleanRedis() {
  return this.api.msKeys(this.idPrefix + '*')
    .then(response => {
      if (_.isArray(response.result) && response.result.length) {
        return this.api.msDel(response.result)
      }

      return null;
    });
}

function cleanValidations() {
  return this.api.searchSpecifications({ query: {match_all: { boost: 1 }} })
    .then(body => Bluebird.all(body.result.hits
      .filter(r => r._id.match(/^kuzzle-test-/))
      .map(r => deleteSpecifications(r._id.split('#')[1], r._id.split('#')[0]))
    ));
}

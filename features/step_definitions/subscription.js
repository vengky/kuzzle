const
  {
    defineSupportCode
  } = require('cucumber');

defineSupportCode(function ({Given, Then}) {
  Given(/^A room subscription listening to "([^"]*)" having value "([^"]*)"(?: with client "([^"]*)")?$/, function (key, value, clientId) {
    const filter = {
      equals: {
        [key]: value
      }
    };

    return this.api.subscribe(filter, clientId)
      .then(room => {
        if (room.error) {
          throw room.error;
        }
      });
  });

  Given(/^A room subscription listening to the whole collection$/, function (callback) {
    this.api.subscribe({})
      .then(room => callback(room.error && new Error(room.error)))
      .catch(error => callback(new Error(error)));
  });

  Given(/^A room subscription listening field "([^"]*)" doesn't exists$/, function (key, callback) {
    var filter = {not: {exists: {field : key}}};

    this.api.subscribe(filter)
      .then(room => callback(room.error && new Error(room.error)))
      .catch(error => callback(new Error(error)));
  });

  Then(/^I unsubscribe(?: client "([^"]*)")?/, function (clientId, callback) {
    this.api.unsubscribe(null, clientId)
      .then(() => callback())
      .catch(error => callback(new Error(error)));
  });

  Then(/^I can count "([^"]*)" subscription/, function (number, callback) {
    this.api.countSubscription()
      .then(count => {
        if (count !== parseInt(number)) {
          return callback(new Error('No correct value for count. Expected ' + number + ', got ' + JSON.stringify(count)));
        }

        callback();
      })
      .catch(error => callback(new Error(error)));
  });

  Then(/^I get the list subscriptions$/, function (callback) {
    this.api.listSubscriptions()
      .then(response => {
        if (response.error) {
          return callback(new Error(response.error.message));
        }

        if (!response.result) {
          return callback(new Error('No result provided'));
        }

        this.result = response.result;
        callback();
      })
      .catch(error => callback(error));
  });

  Then(/^In my list there is a collection "([^"]*)" with ([\d]*) room and ([\d]*) subscriber$/, function(collection, countRooms, countSubscribers, callback) {
    var
      rooms = Object.keys(this.result[this.fakeIndex][collection]),
      count = 0;

    if (!this.result[this.fakeIndex]) {
      return callback(new Error('No entry for index ' + this.fakeIndex));
    }

    if (!this.result[this.fakeIndex][collection]) {
      return callback(new Error('No entry for collection ' + collection));
    }

    if (rooms.length !== parseInt(countRooms)) {
      return callback(new Error('Wrong number rooms for collection ' + collection + '. Expected ' + countRooms + ' get ' + rooms.length));
    }

    rooms.forEach(roomId => {
      count += this.result[this.fakeIndex][collection][roomId];
    });

    if (count !== parseInt(countSubscribers)) {
      return callback(new Error('Wrong number subscribers for collection ' + collection + '. Expected ' + countSubscribers + ' get ' + count));
    }

    callback();
  });
});


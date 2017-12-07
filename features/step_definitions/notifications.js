const
  {
    defineSupportCode
  } = require('cucumber'),
  async = require('async');

defineSupportCode(function ({Then}) {
  Then(/^I should receive a ?(.*?) notification with field "?(.*?)" equal to "([^"]*)"(?: on client "([^"]*)")?$/, function (type, field, value, clientId, callback) {
    const main = callbackAsync => {
      setTimeout(() => {
        const message = this.api.notification(type, clientId);

        if (message) {
          if (message[field] !== value) {
            return callbackAsync(`Expected notification field "${field}" to be equal to "${value}", but got "${message[field]}" instead.`);
          }

          this.notification = message;
          callbackAsync();
        } else {
          callbackAsync('No notification received');
        }
      }, 20);
    };

    async.retry(20, main, err => {
      if (err) {
        return callback(new Error(err.message || err));
      }

      callback();
    });
  });

  Then(/^The notification document should have ?(an empty|a fulfilled) content/, function (member, callback) {
    const empty = (member === 'an empty');

    if (this.notification.document === undefined
      || (!empty && Object.keys(this.notification.document.content).length === 0)
      || (empty && Object.keys(this.notification.document.content).length > 0)) {

      console.log('Wrong notification received: ');
      console.dir(this.notification, {colors: true, depth: null});
      callback('The document was supposed to contain ' + member + ' content');
      return false;
    }
    callback();
  });

  Then(/^The notification should have volatile/, function (callback) {
    if (!this.notification.volatile) {
      return callback('Expected volatile in the notification but none was found');
    }

    let diff = Object.keys(this.volatile).length !== Object.keys(this.notification.volatile).length;

    Object.keys(this.volatile).forEach(key => {
      if (!diff) {
        if (!this.notification.volatile[key]) {
          diff = true;
        } else {
          diff = JSON.stringify(this.volatile[key]).localeCompare(JSON.stringify(this.notification.volatile[key])) !== 0;
        }
      }
    });

    if (diff) {
      callback('Expected ' + JSON.stringify(this.notification.volatile) + ' to match ' + JSON.stringify(this.volatile));
    } else {
      callback();
    }

  });
});


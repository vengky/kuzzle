const
  {
    defineSupportCode
  } = require('cucumber'),
  Bluebird = require('bluebird');

defineSupportCode(function ({Then, When}) {
  When(/^I ?(can't)* write the document ?(?:"([^"]*)")?(?: in index "([^"]*)")?( with id "[^"]+")?$/, function (not, documentName, index, id) {
    const
      document = this[documentName] || this.documentGrace;

    return this.api.create(id, document)
      .then(doc => {
        this.result = doc;
      })
      .catch(err => {
        if (not) {
          return;
        }
        throw err;
      });
  });

  When(/^I createOrReplace it$/, function (callback) {
    const document = JSON.parse(JSON.stringify(this.documentGrace));

    this.api.createOrReplace(this.result.id, document)
      .then(doc => {
        this.updatedResult = doc;
        callback();
      })
      .catch(error => callback(error));
  });

  Then(/^I should have updated the document$/, function (callback) {
    if (this.updatedResult.id === this.result.id && this.updatedResult.version === (this.result.version + 1)) {
      this.result = this.updatedResult;
      callback();
      return false;
    }

    callback(new Error('The received document is not an updated version of the previous one. \n' +
      'Previous document: ' + JSON.stringify(this.result) + '\n' +
      'Received document: ' + JSON.stringify(this.updatedResult)));
  });

  Then(/^I update the document with value "([^"]*)" in field "([^"]*)"(?: in index "([^"]*)")?$/, function (value, field, index) {
    var body = {
      [field]: value
    };

    return this.api.update(this.result.id, body, this.fakeCollection, index)
      .then(doc => {
        if (doc.error) {
          return Bluebird.reject(doc.error);
        }
        if (!doc) {
          return Bluebird.reject(new Error('No result provided'));
        }
      });
  });

  Then(/^I replace the document with "([^"]*)" document$/, function (documentName) {
    var document = JSON.parse(JSON.stringify(this[documentName]));

    return this.api.replace(this.result.id, document)
      .then(doc => {
        if (doc.error) {
          return Bluebird.reject(doc.error);
        }

        if (!doc) {
          return Bluebird.reject(new Error('No result provided'));
        }

        this.updatedResult = doc;
      });
  });

  When(/^I create multiple documents '([^']+)'( and get partial errors)?$/, function (documents, withErrors, callback) {
    this.api.mCreate(documents)
      .then(response => callback(withErrors && 'Should get partial error'))
      .catch(error => {
        if (withErrors && error.status === 206) {
          return callback();
        }
        callback(error);
      });
  });

  When(/^I replace multiple documents '([^']+)'( and get partial errors)?$/, function (documents, withErrors, callback) {
    this.api.mReplace(documents)
      .then(response => callback(withErrors && 'Should get partial error'))
      .catch(error => {
        if (withErrors && error.status === 206) {
          return callback();
        }
        callback(error);
      });
  });

  When(/^I update multiple documents '([^']+)'( and get partial errors)?$/, function (documents, withErrors, callback) {
    this.api.mUpdate(documents)
      .then(response => callback(withErrors && 'Should get partial error'))
      .catch(error => {
        if (withErrors && error.status === 206) {
          return callback();
        }
        callback(error);
      });
  });

  When(/^I createOrReplace multiple documents '([^']+)'( and get partial errors)?$/, function (documents, withErrors, callback) {
    this.api.mCreateOrReplace(documents)
      .then(response => callback(withErrors && 'Should get partial error'))
      .catch(error => {
        if (withErrors && error.status === 206) {
          return callback();
        }
        callback(error);
      });
  });
});

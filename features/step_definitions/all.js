const
  {
    defineSupportCode
  } = require('cucumber'),
  should = require('should');

defineSupportCode(function ({Then}) {
  Then(/^The (sorted )?result should match the (regex|json) (.*?)$/, function (sorted, type, pattern) {
    let val = this.result.result;

    if (sorted && Array.isArray(val)) {
      val = val.sort();
    }

    switch (type) {
      case 'regex':
        const regex = new RegExp(pattern.replace(/#prefix#/g, this.idPrefix));
        if (! regex.test(val.toString())) {
          throw new Error('pattern mismatch: \n' + JSON.stringify(val) + '\n does not match \n' + regex);
        }
        break;
      case 'json':
        return should(JSON.parse(pattern.replace(/#prefix#/g, this.idPrefix))).be.eql(val);
        break;
    }
  });

  Then(/^The result should raise an error with message "(.*?)"$/, function (message) {
    const val = this.result && this.result.error;

    return should(val.message).be.eql(message);
  });
});

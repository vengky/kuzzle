/* eslint-disable no-console */

var
  rc = require('rc'),
  params = rc('kuzzle'),
  KuzzleServer = require('../../lib/api/kuzzleServer'),
  readlineSync = require('readline-sync'),
  fs = require('fs'),
  clc = require('cli-color');

module.exports = function (options) {
  var
    error = string => options.parent.noColors ? string : clc.red(string),
    warn = string => options.parent.noColors ? string : clc.yellow(string),
    notice = string => options.parent.noColors ? string : clc.cyanBright(string),
    userIsSure = false,
    kuzzle = new KuzzleServer();

  // check, if files are provided, if they exists
  if (params.fixtures) {
    try {
      JSON.parse(fs.readFileSync(params.fixtures, 'utf8'));
    }
    catch (e) {
      console.log(error('[✖] The file ' + params.fixtures + ' cannot be opened... aborting.'));
      process.exit(1);
    }
  }

  if (params.mappings) {
    try {
      JSON.parse(fs.readFileSync(params.mappings, 'utf8'));
    }
    catch (e) {
      console.log(error('[✖] The file ' + params.mappings + ' cannot be opened... aborting.'));
      process.exit(1);
    }
  }

  console.log(warn('[ℹ] You are about to reset Kuzzle and make it like a virgin.'));
  console.log(warn('[ℹ] This operation cannot be undone.\n'));

  if (!params.noint) {
    userIsSure = readlineSync.question('[❓] Are you sure? If so, please type "I am sure" (if not just press [Enter]): ') === 'I am sure';
  } else {
    // not intteractive mode
    userIsSure = true;
  }

  if (userIsSure) {
    console.log(notice('[ℹ] Processing...\n'));
    kuzzle.remoteActions.do('cleanAndPrepare', params);
  } else {
    console.log(notice('[ℹ] Nothing have been done... you do not look that sure...'));
  }
};

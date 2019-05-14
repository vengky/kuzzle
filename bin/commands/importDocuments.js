/*
 * Kuzzle, a backend software, self-hostable and ready to use
 * to power modern apps
 *
 * Copyright 2015-2018 Kuzzle
 * mailto: support AT kuzzle.io
 * website: http://kuzzle.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const
  fs = require('fs'),
  sendAction = require('./sendAction');

function commandImportDocuments (options) {
  fs.readFile(options.filePath, 'utf8', (error, rawData) => {
    if (error) {
      return reject(error);
    }
    try {
      console.log(rawData);
      const query = {
        index: options.index,
        collection: options.collection,
        controller: 'bulk',
        action: 'import',
        body: { 'bulkData': [{'_index': options.index, '_type':options.collections}, rawData] },
        suffix: 'cli'
      };
      sendAction(query, options);
    }
    catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
}

module.exports = commandImportDocuments;
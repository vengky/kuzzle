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

'use strict';

const
  Service = require('./service'),
  storageError = require('../util/errors').wrap('services', 'storage'),
  { Client: PGClient } = require('pg');

// Used for collection emulation
const
  INTERNAL_PREFIX = '%',
  PUBLIC_PREFIX = '&',
  NAME_SEPARATOR = '.';

const notAvailableMethods = [
  'scroll'
];

class Postgresql extends Service {
  static buildClient (clientConfig) {
    return new PGClient(clientConfig);
  }

  constructor (kuzzle, config, scope = 'public') {
    super('elasticsearch', kuzzle, config);

    this._scope = scope;
    this._tablePrefix = scope === 'internal'
      ? INTERNAL_PREFIX
      : PUBLIC_PREFIX;

    this._client = null;
    this._pgVersion = null;
  }

  get scope () {
    return this._scope;
  }

  /**
   * Initializes the postgresql client
   *
   * @override
   * @returns {Promise}
   */
  async _initSequence () {
    if (this._client) {
      return this;
    }

    this._client = Postgresql.buildClient(this._config.client);

    await this._client.connect();

    const result = await this._client.query('SELECT version()');

    this._pgVersion = result.rows[0];
  }

  /**
   * Returns some basic information about this service
   * @override
   *
   * @returns {Promise.<Object>} service informations
   */
  async info () {
    return {
      version: this._pgVersion,
      status: 'OK'
    };
  }

  async exists (index, collection, id) {
    const
      pgTable = this._getPgTable(index, collection),
      query = `SELECT exists(SELECT 1 FROM ${pgTable} WHERE id=$1)`,
      values = [id];

    const result = await this._client.query(query, values);

    return result.rows > 0;
  }

  async get (index, collection, id) {
    const
      pgTable = this._getPgTable(index, collection),
      query = `SELECT * FROM ${pgTable} WHERE _id=$1 LIMIT 1`,
      values = [id];

    const result = await this._client.query(query, values);

    if (result.rows === 0) {
      storageError.throw('document_not_found', id);
    }

    const
      _id = result.rows[0]._id;
      _source = result.rows[0];

    delete _source._id;

    return {
      _id,
      _source
    };
  }

  async delete (index, collection, id) {
    const
      pgTable = this._getPgTable(index, collection),
      query = `DELETE FROM ${pgTable} WHERE _id=$1`,
      values = [id];

    await this._client.query(query, values);

    return null;
  }

  async createOrReplace (index, collection, id, content, options) {
    const
      pgTable = this._getPgTable(index, collection),
      query = `INSERT INTO ${pgTable} (_id, name) VALUES (1, 'ad'), (2, 'bc')`,
      values = [id];
  }

  async create (index, collection, content, { id } = {}) {

  }

  async createIndex (index) {

  }

  async createCollection (index, collection, schema) {

  }

  async listIndexes () {

  }

  async listCollections (index) {

  }

  _insertQuery (pgTable, content, id = null) {
    const columnNames = Object.keys(content);

    let columns = '';

    if (id) {
      columns += '_id, ';
    }

    columns += columnNames.join(', ');

    let
      idx = 0,
      placeholders = '';

    if (id) {
      placeholders += '$1, ';
      idx = 1;
    }

    for (let i = 0; i < columnNames.length; i++) {
      placeholders += `$${i + idx}, `;
    }

    placeholders = placeholders.substr(0, placeholders.length - 2);

    return `INSERT INTO ${pgTable} (${columns}) VALUES (${placeholders})`;
  }

  _getPgTable (index, collection) {
    if (! index || ! collection) {
      return null;
    }

    return `${this._tablePrefix}${index}${NAME_SEPARATOR}${collection}`;
  }

}

for (const method of notAvailableMethods) {
  Postgresql.prototype[method] = () => {
    throw new Error('Not available');
  }
}

module.exports = Postgresql;

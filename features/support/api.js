const
  Bluebird = require('bluebird'),
  io = require('socket.io-client'),
  KuzzleSDK = require('kuzzle-sdk');

window = undefined;

class KuzzleApi {
  constructor (world) {
    this.world = world;

    if (world.config.protocol === 'socketio') {
      window = {io};
    }

    this.subscribedRooms = {};
    this.responses = null;

    this.clients = {};
    initClient(this, 'default');
  }

  bulkImport (bulk, index, collection) {
    const query = {
      controller: 'bulk',
      action: 'import',
      index: index || this.world.fakeIndex,
      collection: collection || this.world.fakeCollection
    };

    return this.clients.default.sdk.queryPromise(query, {body: {bulkData: bulk}});
  }

  checkToken (jwt) {
    return this.clients.default.sdk.checkTokenPromise(jwt || 'empty-token');
  }

  collectionExists (collection, index) {
    return this.clients.default.sdk.queryPromise({controller: 'collection', action: 'exists', index, collection});
  }

  count (query, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).countPromise(query);
  }

  countSubscription () {
    const
      client = this.clients.default,
      roomIds = Object.keys(client.rooms),
      room = client.rooms[roomIds[0]];

    return room.countPromise();
  }

  create (id, document, collection, index) {
    if (id && typeof id !== 'string') {
      index = collection;
      collection = document;
      document = id;
      id = null;
    }
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).createDocumentPromise(id, document);
  }

  createCollection (collection, index) {
    return this.clients.default.sdk.collection(collection, index).createPromise();
  }

  createIndex (index) {
    return this.clients.default.sdk.createIndexPromise(index);
  }

  createOrReplace (id, document, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).document(id, document).savePromise();
  }

  createRestrictedUser (id, content) {
    return this.clients.default.sdk.security.createRestrictedUserPromise(id, content);
  }

  createUser (id, content) {
    return this.clients.default.sdk.security.createUserPromise(id, content);
  }

  delete (query, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).deleteDocumentPromise(query);
  }

  deleteIndex (index) {
    return this.clients.default.sdk.deleteIndexPromise(index);
  }

  deleteIndexes () {
    const
      msg = {
        controller: 'index',
        action: 'mdelete'
      };

    return this.send(msg);
  }

  deleteProfiles (ids, waitFor = false) {
    const options = waitFor && {refresh: 'wait_for'} || {};
    return this.clients.default.sdk.queryPromise({controller: 'security', action: 'mDeleteProfiles'}, ids, options);
  }

  deleteRoles (ids, waitFor = false) {
    const options = waitFor && {refresh: 'wait_for'} || {};
    return this.clients.default.sdk.queryPromise({controller: 'security', action: 'mDeleteRoles'}, ids, options);
  }

  deleteSpecifications (collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).deleteSpecificationsPromise();
  }

  deleteUser (id, waitFor = false) {
    const options = waitFor && {refresh: 'wait_for'} || {};
    return this.clients.default.sdk.security.deleteUserPromise(id, options);
  }

  deleteUsers (ids, waitFor = false) {
    const options = waitFor && {refresh: 'wait_for'} || {};
    return this.clients.default.sdk.queryPromise({controller: 'security', action: 'mDeleteUsers'}, {body: {ids}}, options);
  }

  disconnect () {
    return this.clients.default.sdk.disconnect();
  }

  exists (id, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).documentExistsPromise(id);
  }

  get (id, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).fetchDocumentPromise(id);
  }

  getAllStats () {
    return this.clients.default.sdk.getAllStatisticsPromise();
  }

  getAuthenticationStrategies () {
    return this.clients.default.sdk.queryPromise({controller: 'auth', action: 'getStrategies'});
  }

  getAutoRefresh (index) {
    return this.clients.default.sdk.getAutoRefreshPromise(index);
  }

  getCurrentUser () {
    return this.clients.default.sdk.whoAmIPromise();
  }

  getLastStats () {
    return this.clients.default.sdk.getStatisticsPromise();
  }

  getMyRights () {
    return this.clients.default.sdk.getMyRightsPromise();
  }

  getServerConfig () {
    return this.clients.default.sdk.queryPromise({controller: 'server', action: 'getConfig'});
  }

  getServerInfo () {
    return this.clients.default.sdk.queryPromise({controller: 'server', action: 'info'});
  }

  getStats (startTime, stopTime) {
    return this.clients.default.sdk.getStatisticsPromise(startTime, stopTime);
  }

  getUser (id) {
    return this.clients.default.sdk.security.fetchUserPromise(id);
  }

  getUserMapping () {
    return this.clients.default.sdk.queryPromise({controller: 'security', action: 'getUserMapping'});
  }

  getUserRights (id) {
    return this.clients.default.sdk.security.getUserRightsPromise(id);
  }

  globalBulkImport (bulk) {
    return this.clients.default.sdk.queryPromise({controller: 'bulk', action: 'import'}, {body: {bulkData: bulk}});
  }

  healthCheck () {
    return this.clients.default.sdk.queryPromise({controller: 'server', action: 'healthCheck'});
  }

  indexExists (index) {
    return this.clients.default.sdk.queryPromise({controller: 'index', action: 'exists', index});
  }

  listCollections (index, type) {
    return this.clients.default.sdk.listCollectionsPromise(index || this.world.fakeIndex, {type});
  }

  listIndexes () {
    return this.clients.default.sdk.listIndexesPromise();
  }

  listSubscriptions () {
    return this.clients.default.sdk.queryPromise({controller: 'realtime', action: 'list'});
  }

  login (strategy, opts) {
    const
      credentials = {
        username: opts.username,
        password: opts.password
      },
      expiresIn = opts.expiresIn;

    return this.clients.default.sdk.loginPromise(strategy, credentials, expiresIn);
  }

  logout () {
    return this.clients.default.sdk.logoutPromise();
  }

  mCreate (documents, collection, index) {
    return doMultipleAction(this, 'mCreateDocumentPromise', documents, collection, index);
  }

  mCreateOrReplace (documents, collection, index) {
    return doMultipleAction(this, 'mCreateOrReplaceDocumentPromise', documents, collection, index);
  }

  mDelete (ids, index, collection) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).mDeleteDocumentPromise(ids);
  }

  mGet (documents, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).mGetDocumentPromise(documents);
  }

  mReplace (documents, collection, index) {
    return doMultipleAction(this, 'mReplaceDocumentPromise', documents, collection, index);
  }

  msDel (key) {
    return this.clients.default.sdk.memoryStorage.delPromise(key);
  }

  msKeys (pattern) {
    return this.clients.default.sdk.memoryStorage.keysPromise(pattern);
  }

  mUpdate (documents, collection, index) {
    return doMultipleAction(this, 'mUpdateDocumentPromise', documents, collection, index);
  }

  now () {
    return this.clients.default.sdk.nowPromise();
  }

  publish (document, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).publishMessagePromise(document);
  }

  refreshIndex (index) {
    return this.clients.default.sdk.refreshIndexPromise(index);
  }

  refreshInternalIndex () {
    return this.clients.default.sdk.queryPromise({controller: 'index', action: 'refreshInternal'});
  }

  replace (id, document, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).replaceDocumentPromise(id, document);
  }

  replaceUser (id, content) {
    return this.clients.default.sdk.security.replaceUserPromise(id, content);
  }

  scroll (scrollId, scroll) {
    return this.clients.default.sdk.collection(this.world.fakeCollection).scrollPromise(scrollId, {scroll});
  }

  scrollUsers (scrollId, scroll) {
    return this.clients.default.sdk.security.scrollUsersPromise(scrollId, {scroll});
  }

  search (query, args, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).searchPromise(query, args);
  }

  searchProfiles (query, args) {
    return this.clients.default.sdk.security.searchProfilesPromise(query, args);
  }

  searchSpecifications (body, args) {
    return this.clients.default.sdk.queryPromise({controller: 'collection', action: 'searchSpecifications'}, {body}, args);
  }

  searchRoles (query, args) {
    return this.clients.default.sdk.security.searchRolesPromise(query, args);
  }

  searchUsers (query, args) {
    return this.clients.default.sdk.security.searchUsersPromise(query, args);
  }

  setAutoRefresh (index, autoRefresh) {
    return this.clients.default.sdk.setAutoRefreshPromise(index, autoRefresh);
  }

  notification(type, clientId) {
    const client = initClient(this, clientId || 'default');
    return client.notifications[type];
  }

  subscribe (filters, clientId, collection, index) {
    const
      options = {
        scope: 'all',
        state: 'all',
        users: 'all'
      },
      client = initClient(this, clientId || 'defaut'),
      room = client.sdk.collection(collection || this.world.fakeCollection, index).room(filters, options || {});

    room.on('document', data => {
      client.notifications.document = data;
    });
    room.on('user', data => {
      client.notifications.user = data;
    });

    return room.subscribePromise()
      .then(() => {
        client.rooms[room.roomId] = room;
        return room;
      });
  }

  truncateCollection (collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).truncatePromise();
  }

  unsetJwt() {
    return this.clients.default.sdk.unsetJwt();
  }

  unsubscribe (roomId, clientId, waitForResponse = false) {
    const
      client = initClient(this, clientId || 'default'),
      rooms = Object.keys(client.rooms);

    if (rooms.length === 0) {
      return Bluebird.reject('Cannot unsubscribe: no subscribed rooms');
    }

    const
      id = roomId || rooms[rooms.length - 1],
      room = client.rooms[id];

    return room.unsubscribePromise()
      .then(() => {
        delete client.rooms[id];
      });

  }


  unsubscribeAll () {
    const promises = [];

    for (const clientId of Object.keys(this.clients)) {
      const client = this.clients[clientId];
      for (const roomId of Object.keys(client.rooms)) {
        promises.push(this.unsubscribe(roomId, clientId));
      }
    }

    return Bluebird.all(promises);
  }

  update (id, body, collection, index) {
    return this.clients.default.sdk.collection(collection || this.world.fakeCollection, index).updateDocumentPromise(id, body);
  }

  updateMapping (collection, index) {
    const
      coll = this.clients.default.sdk.collection(collection || this.world.fakeCollection, index),
      mapping = coll.collectionMapping(this.world.mapping);

    return mapping.applyPromise();
  }

  updateSelf (content) {
    return this.clients.default.sdk.updateSelfPromise(content);
  }

  updateUserMapping () {
    return this.clients.default.sdk.queryPromise({controller: 'security', action: 'updateUserMapping'}, this.world.securitymapping);
  }
}

function doMultipleAction(api, method, documents, collection, index) {
  const
    body = [],
    parsed = JSON.parse(documents),
    col = api.clients.default.sdk.collection(collection || api.world.fakeCollection, index);

  Object.keys(parsed).forEach(key => {
    body.push(col.document(key, this[parsed[key]]));
  });

  return col[method](body);
}

function initClient(api, clientId) {
  if (api.clients[clientId] === undefined) {
    api.clients[clientId] = {
      sdk: new KuzzleSDK(api.world.config.host, {
        protocol: api.world.config.protocol || 'websocket',
        port: api.world.config.port,
        defaultIndex: api.world.fakeIndex,
        volatile: api.world.volatile
      }),
      rooms: {},
      notifications: {
        document: null,
        user: null
      }
    };
  }
  return api.clients[clientId];
}

function deleteClient(api, clientId) {
  delete api.clients[clientId];
}

module.exports = KuzzleApi;

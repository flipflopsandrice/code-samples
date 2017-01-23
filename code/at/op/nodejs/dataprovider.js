'use strict';

var extend = require('util')._extend;

/**
 * The DataProvider constructor
 *
 * @param {SocketServer}    server            Instance of a SocketServer
 * @param {Array}           initialData       An array with data that will be sent to the client on-connect
 * @param {Array}           broadcastData     An array with data that will be sent piece by piece periodically
 * @constructor
 */
var DataProvider = function (server, initialData, broadcastData) {
    this.server = server;
    this.initialData = initialData || [];
    this.broadcastData = broadcastData || [];
    this._broadcastInterval = 5000;
};

/**
 * Define terminal logging colors
 * @type {string}
 */
DataProvider.prototype.COLOR_REGULAR = '\x1b[0m';
DataProvider.prototype.COLOR_YELLOW = '\x1b[33m';
DataProvider.prototype.COLOR_GREEN = '\x1b[32m';
DataProvider.prototype.COLOR_RED = '\x1b[31m';

/**
 * Define payload types
 * @type {string}
 */
DataProvider.prototype.BROADCAST_TYPE_INITIAL = 'initial';
DataProvider.prototype.BROADCAST_TYPE_UPDATE = 'update';

/**
 * Start the server
 */
DataProvider.prototype.start = function () {
    this.server.setHandlers(
        this._onConnect.bind(this),
        this._onDisconnect.bind(this)
    ).start();
};

/**
 * Handle client connecting
 *
 * @param client
 * @private
 */
DataProvider.prototype._onConnect = function (client) {
    this._log('Client connected');

    /**
     * Add onData listener
     */
    client.on('data', this._onClientData.bind(this));

    /**
     * Write initial data to client
     */
    if (this.initialData.length) {
        this._writeData(client, this.initialData, this.BROADCAST_TYPE_INITIAL);
    }

    /**
     * Set the mock broadcast data on the client object, so manipulating the array won't affect other clients
     *
     * [1] Remove one so we get additional data when this._broadcastData is out of data
     */
    client._mockData = extend([], this.broadcastData);
    client._mockData.pop(); // [1]
    this._broadcastData(client);
};

/**
 * Handle client disconnect
 *
 * @param client
 * @private
 */
DataProvider.prototype._onDisconnect = function (client) {
    this._log('Client disconnected', false, this.COLOR_RED);

    /**
     * Remove onData listener
     */
    client.removeListener('data', this._onClientData);

    /**
     * Set `_disconnected` flag, so `this._broadcastData()` won't try to write to a non-existing client
     */
    client._disconnected = true;
};

/**
 * Handle incoming data from client
 *
 * @param data
 * @private
 */
DataProvider.prototype._onClientData = function (data) {
    this._log('Received client data:' + this.COLOR_YELLOW, data);
};

/**
 * Queue the data broadcasting based on the interval
 *
 * @param client
 * @private
 */
DataProvider.prototype._broadcastData = function (client) {
    setTimeout(
        this._onBroadcastData.bind(this, client),
        this._broadcastInterval
    );
};

/**
 * This method will write mock data to a client, until it runs out of data to send
 *
 * @param client
 * @returns {boolean}
 * @private
 */
DataProvider.prototype._onBroadcastData = function (client) {
    /**
     * Cancel broadcast if client has disconnected
     */
    if (client._disconnected === true) {
        return false;
    }

    /**
     * Send a broadcast with existing data if there is no data left
     */
    if (client._mockData.length === 0) {
        var updateData = extend([], this.broadcastData);
        this._writeData(client, updateData, this.BROADCAST_TYPE_UPDATE);
        return false;
    }

    /**
     * Shift the client's mock data array
     */
    var data = client._mockData.shift();

    /**
     * Broadcast data to client
     */
    this._log('Broadcasting data to client');
    this._writeData(client, data, this.BROADCAST_TYPE_UPDATE);


    /**
     * Queue next data transfer
     */
    this._broadcastData(client);

    return true;
};

/**
 *
 * @param client
 * @param payload
 * @private
 */
DataProvider.prototype._writeData = function (client, payload) {
    var data = {
        "took": 1,
        "timed_out": false,
        "_shards": {
            "total": 5,
            "successful": 5,
            "failed": 0
        },
        "hits": {
            "total": 2,
            "max_score": 1,
            "hits": payload
        }
    };
    this.server.broadcast(client, data);
};

/**
 * Small console.log wrapper
 *
 * @param {string}  msg
 * @param {*=}      data     (optional)
 * @param {string=} color    (optional)
 * @private
 */
DataProvider.prototype._log = function (msg, data, color) {
    color = color || this.COLOR_GREEN;
    var date = new Date(),
        time = date.getHours() + ':' + date.getMinutes();
    console.log(
        color + '[SOCKET] ' + this.COLOR_REGULAR +
        this.COLOR_YELLOW + '[' + time + '] ' + this.COLOR_REGULAR +
        msg,
        data || ''
    );
};

/**
 * Export the object
 *
 * @type {DataProvider}
 */
module.exports = DataProvider;

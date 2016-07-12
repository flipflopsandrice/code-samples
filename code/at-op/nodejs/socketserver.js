'use strict';

var Primus = require('primus'),
    SSE = require('sse'),
    http = require('http');

/**
 * The Socket Server constructor
 *
 * The `type` can be any of the supported Primus frameworks, or alternatively can be set to 'SSE', in which case
 * the server will fallback to Server Side Events.
 *
 * @param host    Host or IP to listen to
 * @param type    Type of socket handler to be, see https://github.com/primus/primus#supported-real-time-frameworks
 * @param port    The port to listen to
 * @constructor
 */
var SocketServer = function(host, type, port) {
    this.host = host || '127.0.0.1';
    this.type = type || 'websockets';
    this.port = port || 3333;
    this._onConnectCallback = null;
    this._onDisconnectCallback = null;
};

/**
 * Define server types
 * @type {string}
 */
SocketServer.prototype.TYPE_WEBSOCKETS = 'websockets';
SocketServer.prototype.TYPE_SSE = 'sse';

/**
 * Set the connect/disconnect callback handlers
 *
 * @param onConnectCallback
 * @param onDisconnectCallback
 * @returns {SocketServer}
 */
SocketServer.prototype.setHandlers = function (onConnectCallback, onDisconnectCallback) {
    this._onConnectCallback = onConnectCallback;
    this._onDisconnectCallback = onDisconnectCallback;

    /**
     * Return self so consumer may chain
     */
    return this;
};

/**
 * Start a server based on the type (SSE or sockets)
 */
SocketServer.prototype.start = function () {
    switch(this.type) {
        case this.TYPE_WEBSOCKETS:
            this._startSocketServer();
            break;
        case this.TYPE_SSE:
            this._startSSE();
            break;
        default:
            throw 'Unknown SocketServer type: ' + this.type;
    }
};

SocketServer.prototype.broadcast = function (client, data) {
    switch(this.type) {
        case this.TYPE_WEBSOCKETS:
            client.write(data);
            break;
        case this.TYPE_SSE:
            client.send(JSON.stringify(data));
            break;
        default:
            throw 'Cannot broadcast data, unknown SocketServer type: ' + this.type;
    }
};

/**
 * Start a Server Side Events server
 *
 * @private
 */
SocketServer.prototype._startSSE = function () {
    /**
     * Override the SSEClient.initialize() prototype to support CORS headers
     * @see https://github.com/einaros/sse.js/issues/2
     */
    SSE.Client.prototype.initialize = function () {
        this.req.socket.setNoDelay(true);
        this.res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        this.res.write(':ok\n\n');
    };

    /**
     * Start HTTP server
     */
    var server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
        res.end('okay');
    });

    /**
     * Attach SSE to HTTP server
     */
    server.listen(this.port, this.host, function () {
        var sse = new SSE(server);
        sse.on('connection', this._onConnectCallback);
        sse.on('disconnection', this._onDisconnectCallback);
    }.bind(this));
};

/**
 * Start Socket server using Primus library
 * @private
 */
SocketServer.prototype._startSocketServer = function () {
    var server = Primus.createServer({
        pathname: '/sock',
        transformer: this.type,
        port: this.port,
        iknowhttpsisbetter: true
    });
    server.on('connection', this._onConnectCallback);
    server.on('disconnection', this._onDisconnectCallback);
};

/**
 * Export class
 */
module.exports = SocketServer;

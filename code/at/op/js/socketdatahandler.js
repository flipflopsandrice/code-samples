/**
 * Socket Data Handler: This library handles simplex and duplex communication with a Websockets or SSE back-end
 *
 * Changing between simplex (one-way) and duplex (two-way) can be done by passing the `connectionType` in the
 * constructor config.
 */
;var SocketDataHandler = (function ($, window) {
    'use strict';

    /**
     * SocketDataHandler constructor
     *
     * @param {object} config
     */
    var SocketDataHandler = function (config) {
        config = config || {};

        this._host = config.host || 'localhost';
        this._port = config.port || 3333;
        this._ssl = config.ssl || false;
        this._connectionType = config.connectionType || this.CONNECTION_DUPLEX;
        this._relativeEndpoint = config.relativeEndpoint || '';
        this._duplexJs = config.duplexJs || '/sock/primus.js';
        this._handler = null;

        /**
         * Return ourselves so consumer may chain
         */
        return this;
    };

    /** Simplex mode constant */
    SocketDataHandler.prototype.CONNECTION_SIMPLEX = 'simplex';

    /** Duplex mode constant */
    SocketDataHandler.prototype.CONNECTION_DUPLEX = 'duplex';

    /**
     * Start the data handling
     *
     * @param {function=} onDataCallback
     */
    SocketDataHandler.prototype.start = function (onDataCallback) {
        this._onDataCallback = onDataCallback;
        switch (this._connectionType) {
            case this.CONNECTION_SIMPLEX:
                this._startSimplex();
                break;
            case this.CONNECTION_DUPLEX:
                this._startDuplex();
                break;
        }
    };

    /**
     * Send data to server
     *
     * @param data
     * @returns {boolean}
     */
    SocketDataHandler.prototype.send = function (data) {
        /**
         * Make sure the handler is in duplex mode
         */
        if (this._connectionType !== SocketDataHandler.prototype.CONNECTION_DUPLEX) {
            console.log('Handler is not in duplex mode');
            return false;
        }

        /**
         * Make sure the handler has been initialized
         */
        if (this._handler === null) {
            console.log('Handler has not been initialized');
            return false;
        }


        this._handler.write(data);
    };

    /**
     * Start in simplex mode
     *
     * @private
     */
    SocketDataHandler.prototype._startSimplex = function () {
        /**
         * Make sure EventSource is supported, we're using the polyfill
         * @see https://www.npmjs.com/package/event-source-polyfill
         * @see https://github.com/Yaffle/EventSource
         */
        if (window.EventSource === undefined) {
            console.log('EventSource is not supported by this browser');
            return false;
        }

        /**
         * Otherwise, initialize straightaway
         */
        this._onStartSimplex();
    };

    /**
     * Initialize in simplex mode using Server Side Events
     *
     * @private
     */
    SocketDataHandler.prototype._onStartSimplex = function () {
        this._handler = new EventSource(this._getEndpoint(this._relativeEndpoint));
        this._handler.onmessage = this._onData.bind(this);
    };

    /**
     * Start in full duplex mode
     *
     * @private
     */
    SocketDataHandler.prototype._startDuplex = function () {
        /**
         * Inject Primus if it is not present in the window object
         */
        if (window.Primus === undefined) {
            return this._injectDuplexJs();
        }

        /**
         * Otherwise, initialize straightaway
         */
        this._onStartDuplex();
    };

    /**
     * Initialize the socket connection and attach the event listeners
     *
     * @private
     */
    SocketDataHandler.prototype._onStartDuplex = function () {
        this._handler = window.Primus.connect(this._getEndpoint(this._relativeEndpoint));
        this._handler.on('data', this._onData.bind(this));
    };

    /**
     * Handle incoming data
     *
     * @param {*} payload
     * @returns {boolean}
     * @private
     */
    SocketDataHandler.prototype._onData = function (payload) {
        if (
            this._onDataCallback === undefined ||
            typeof this._onDataCallback !== 'function'
        ) {
            console.log('Received data, yet no onDataCallback defined:', data);
            return false;
        }

        var data = payload.data;

        /**
         * Parse JSON if we are in Simplex mode
         */
        if (this._connectionType === this.CONNECTION_SIMPLEX) {
            data = JSON.parse(payload.data);
        }

        /**
         * Get from ElasticSearch data array
         */
        data = data.hits.hits;

        /**
         * Call our defined callback with data
         */
        this._onDataCallback(data);
    };

    /**
     * Inject Primus and call the `_onStartDuplex` method when done
     *
     * @private
     * @todo Do we really need jQuery just so we can do an async getScript call?
     */
    SocketDataHandler.prototype._injectDuplexJs = function () {
        $.getScript(
            this._getEndpoint(this._duplexJs),
            this._onStartDuplex.bind(this)
        );
    };

    /**
     * Construct the endpoint based on the class variables
     *
     * @param   {string=} append   Anything to append to the endpoint URL
     * @returns {string}           The constructed endpoint string, including the appended text
     * @private
     */
    SocketDataHandler.prototype._getEndpoint = function (append) {
        return 'http' + (this._ssl ? 's' : '') + '://' + this._host + ':' + this._port + (append || '');
    };

    /** Expose the SocketDataHandler */
    return SocketDataHandler;

})(jQuery, window);

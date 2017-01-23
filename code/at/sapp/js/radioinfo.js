/**
 *
 * AT RadioBox querier
 *  - Used by playlist
 *  - Used by homepage currently playing
 *
 * Usage:
 *      var radioinfo = new RadioInfo(37);
 *      radioinfo.currentTrack(function(track) {
 *          console.log('Currently playing: ' + track.title);
 *       });
 */
;(function ($, _, window) {
    'use strict';

    var RadioInfo;

    /**
     * Construct the library
     * @param channelId
     * @constructor
     */
    RadioInfo = function (channelId) {
        this._channelId = channelId;
        this._endpoint  = _.template('//rb.redacted.nl/${ type }/${ id }.json');
        this._blacklist = ['redacted', 'redacted2'];
    };

    /**
     * Call _endpoint with data
     * @param type
     * @param id
     * @param params
     * @param callback
     * @private
     */
    RadioInfo.prototype._get = function (type, id, params, callback) {
        var url = this._endpoint({type: type, id: id ? 'rest/' + id : 'search'});

        /** REMOVE when radiobox returns the proper programmes (instead of non-stop) */
        if (type === 'broadcast') {
            url = '/schedule';
        }

        $.get(url, params, callback, 'json');
    };

    /**
     * Parses RadioBox track data
     * @param data
     * @param callback
     * @param context
     * @returns {*}
     * @private
     */
    RadioInfo.prototype._parseTrack = function (callback, context, data) {
        var result, response;
        if (data.results.length > 0) {
            result = data.results[0];

            if (this._blacklist.indexOf( result.songfile.title.toUpperCase() ) === -1) {
                response = {
                    title: result.songfile.title,
                    artist: result.songfile.artist,
                    start: result.startdatetime,
                    stop: result.stopdatetime
                };
            }
        }
        return (typeof callback === 'function' && callback(response, context)) || response;
    };

    /**
     * Parse multiple RadioBox track data
     * @param callback
     * @param data
     * @returns {boolean|*|Array}
     * @private
     */
    RadioInfo.prototype._parseTracks = function (callback, data) {
        var response = [], track;
        if (data.results.length > 0) {
            data.results.forEach(function(result) {
                var track = this._parseTrack(null, 'track', { results: [ result ] });
                if (track !== undefined) {
                    response.push(track);
                }
            }.bind(this));
        }
        return (typeof callback === 'function' && callback(response, 'tracks')) || response;
    };

    /**
     * Parses RadioBox broadcast search data
     * @param callback
     * @param data
     * @returns {*}
     * @private
     */
    RadioInfo.prototype._parseBroadcastSearch = function (callback, data) {
        var result, response;
        if (data.results.length > 0) {
            result = data.results[0];
            response = {
                id: result.id,
                programme: result.name,
                image: result.image || false
            };
        }
        return (typeof callback === 'function' && callback(response)) || response;
    };

    /**
     * Parses RadioBox broadcast data
     * @param callback
     * @param data
     * @returns {*}
     * @private
     */
    RadioInfo.prototype._parseBroadcastPresenter = function (callback, data) {
        var response = {}, fullname = [], imgname = [];
        if (data.presenter !== undefined && data.presenter.length > 0) {
            data.presenter.forEach(function(presenter) {
                fullname.push(presenter.full_name);
                imgname.push(presenter.full_name.split(' ').shift());
                response.image = presenter.image;
            });
            response.name  = fullname.join(', ');

            if (response.image === undefined) {
                response.image = 'Presentator-' + imgname.join('&');
            }
        }

        return (typeof callback === 'function' && callback(response)) || response;
    };

    /**
     * Get the current track
     * @param callback
     */
    RadioInfo.prototype.track = function (callback) {
        var params = { q: "channel.id:'" + this._channelId + "' AND startdatetime<NOW AND stopdatetime>NOW AND songfile.id>'0'" };
        this._get("track", null, params, this._parseTrack.bind(this, callback, 'track'));
    };

    /**
     * Get the current track
     * @param callback
     */
    RadioInfo.prototype.tracks = function (callback) {
        var params = { q: "channel.id:'" + this._channelId + "' AND startdatetime<NOW AND songfile.id>'0'", order: "startdatetime:desc", 'max-results': 40 };
        this._get("track", null, params, this._parseTracks.bind(this, callback));
    };

    /**
     * Get the next track
     * @param callback
     */
    RadioInfo.prototype.nextTrack = function (callback) {
        var params = { q: "channel.id:'" + this._channelId + "' AND startdatetime>NOW AND songfile.id>'0'", order: 'startdatetime:desc', 'max-results': 1};
        this._get("track", null, params, this._parseTrack.bind(this, callback, 'nexttrack'));
    };

    /**
     * Get the current programme
     * @param callback
     * @todo less callback hell
     */
    RadioInfo.prototype.programme = function (callback) {
        var querystring = "channel.id:'" + this._channelId + "' AND startdatetime<NOW AND stopdatetime>NOW&order=startdatetime:desc&max-results=1";
        querystring= '';
        this._get("broadcast", null, querystring, function (res)
        {
            var broadcast = this._parseBroadcastSearch(null, res);
            if (broadcast === undefined) {
                return callback();
            }
            this._get("broadcast", broadcast.id, null, function (res)
            {
                var presenter = this._parseBroadcastPresenter(null, res);
                callback({
                    presenter: presenter.name,
                    programme: broadcast.programme,
                    image: broadcast.image || presenter.image
                });
            }.bind(this));
        }.bind(this));
    };

    /**
     * Starts a polling function
     * @param func
     * @param callback
     * @param interval
     * @return {number} pollId
     */
    RadioInfo.prototype.poll = function (func, callback, interval) {
        func.call(this, callback);
        return setInterval(
            func.bind(this, callback),
            interval
        );
    };

    /**
     * End a polling function
     * @param pollId
     */
    RadioInfo.prototype.endpoll = function (pollId) {
        clearInterval(pollId);
    };

    /** Expose library */
    window.RadioInfo = RadioInfo;

})(jQuery, _, window);

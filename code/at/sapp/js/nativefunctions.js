/**
 *
 * AT Native Functions caller
 *  - Used to play/stop native cordova redacted
 *
 * Pre-requisites:
 *  - Redacted Cordova library
 *
 * Usage: Create an element
 *      <div class="button" data-native-function="play">Play</div>
 * On-click the mapped 'native-function' called 'play' is called.
 *
 * Usage: JS
 *      var canPlayVideo = nativeFunctions.callNative('supports', 'Native.Video.play');
 */
;(function ($, window, _) {
    'use strict';

    /**
     * Native Functions constructor
     * @constructor
     */
    var NativeFunctions = function () {
        this._$elements = $('[data-native-function]');
        this._defaultImageOptions = {
            quality: 75,
            destinationType: Native.Camera.DestinationType.FILE_URI,
            sourceType: Native.Camera.PictureSourceType.CAMERA,
            allowEdit: false,
            encodingType: Native.Camera.EncodingType.JPEG,
            targetWidth: 512,
            targetHeight: 512,
            saveToPhotoAlbum: false
        };
        this._defaultAudioOptions = {
            limit: 1,
            duration: 60
        };
    };

    /**
     * Maps commands to native functions.
     * @type {object}
     * @private
     */
    NativeFunctions.prototype._map = {
        'play': function () {
            return Native.Audio.playChannel(37);
        },
        'stop': function () {
            return Native.Audio.stop();
        },
        'play-video': function () {
            return Native.Video.playChannel(4);
        },
        'stop-video': function () {
            return Native.Video.stop();
        },
        'supports': function (method) {
            return Native.Application.supportsMethod(method);
        },
        'upload-camera': function (onSuccess, onError, options) {
            var nativeOptions = $.extend(this._defaultImageOptions, options);
            nativeOptions.sourceType = Native.Camera.PictureSourceType.CAMERA;
            return Native.Camera.getPicture(onSuccess, onError, nativeOptions);
        },
        'upload-gallery': function (onSuccess, onError, options) {
            var nativeOptions = $.extend(this._defaultImageOptions, options);
            nativeOptions.sourceType = Native.Camera.PictureSourceType.SAVEDPHOTOALBUM;
            return Native.Camera.getPicture(onSuccess, onError, nativeOptions);
        },
        'upload-audio': function(onSuccess, onError, options) {
            var nativeOptions = $.extend(this._defaultAudioOptions, options);
            return Native.Audio.capture(onSuccess, onError, nativeOptions);
        }
    };

    /**
     * Initializes the Native library and binds the callbacks
     */
    NativeFunctions.prototype.init = function () {
        Native.init(
            this.onDeviceReady.bind(this),
            this.onError.bind(this)
        );
    };

    /**
     * Bind the onClick to our elements
     */
    NativeFunctions.prototype.onDeviceReady = function () {
        this._$elements.on('click', this.onClick.bind(this));

        $('body').trigger('nativefunctions:ready');
    };

    /**
     * Handle the onClick event for an element
     * @param event
     */
    NativeFunctions.prototype.onClick = function (event) {
        var $el = $(event.currentTarget),
            func = $el.data('native-function');
        this.callNative(func);
    };

    /**
     * Call a native function, passing any additional arguments to it
     * @param nativeFunction
     * @returns {boolean}
     */
    NativeFunctions.prototype.callNative = function (nativeFunction) {
        if (this._map[nativeFunction] === undefined) {
            return false;
        }
        var args = _.values(arguments);
        return this._map[nativeFunction].apply(this, args.slice(1, args.length));
    };

    /**
     * Native library error handler
     */
    NativeFunctions.prototype.onError = function () {
        console.log('[NativeFunctions] Error');
    };

    /** Initialize on-load */
    window.onload = function() {
        if (window.Native === undefined) {
            return false;
        }

        var nativeFunctions = new NativeFunctions();
        nativeFunctions.init();

        /** Expose to outside */
        window.nativeFunctions = nativeFunctions;
    };

}(jQuery, window, _));

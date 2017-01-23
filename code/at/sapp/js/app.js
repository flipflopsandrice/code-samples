/**
 *
 * AT <redacted>
 *
 */
;(function ($, window) {
    'use strict';

    /**
     * Constructor
     * @param $button
     * @param $targetTile
     * @constructor
     */
    var MediaFileSelector = function ($button, $targetTile) {
        /**
         * The (local) media URL, if filled a media file has been selected, but not uploaded.
         * @type {null|string}
         */
        this.mediaURL = null;

        /** @private */
        this._$button = $button;
        this._$tile = $targetTile;
        this._$input = $targetTile.siblings('input[type="hidden"]');
        this._source = $button.data('app-source');

        /**
         * The ajax endpoint for uploading media
         * @type {string}
         * @private
         */
        this._uploadEndpoint = $targetTile.parents('form').data('app-upload');

    };

    /**
     * Init function that binds click events
     */
    MediaFileSelector.prototype.init = function () {
        /** Bind the launch button */
        this._$button
            .on('click', this._launch.bind(this));

        /** Bind the empty selection buttons */
        this._$tile
            .siblings('.form-empty-value-button')
            .on('click', this._empty.bind(this));
    };

    /**
     * Upload a local file to a remote endpoint
     * @param onSuccessCallback
     */
    MediaFileSelector.prototype.upload = function (onSuccessCallback) {
        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = this.mediaURL.substr(this.mediaURL.lastIndexOf('/') + 1);
        options.mimeType = 'image/jpeg';

        var ft = new FileTransfer();
        ft.upload(
            this.mediaURL,
            encodeURI(this._uploadEndpoint),
            this._uploadSuccess.bind(this, onSuccessCallback),
            this._uploadError.bind(this),
            options
        );
    };

    /**
     * Call the appropriate nativeFunction method and bind the onsuccess/onerror
     * @private
     */
    MediaFileSelector.prototype._launch = function () {
        window.nativeFunctions.callNative(
            'upload-' + this._source,
            this._onSuccess.bind(this),
            this._onError.bind(this)
        );
    };

    /**
     * Handles a successful nativeFunction call
     * @param result
     * @private
     */
    MediaFileSelector.prototype._onSuccess = function (result) {
        var file;
        if (
            this._source === 'audio' &&
            typeof result === 'object' &&
            result[0] instanceof MediaFile
        ) {
            file = result[0].localURL;
        } else if (typeof result === "string") {
            file = result;
        }

        /** Check we've got a go */
        if (typeof file !== "string" || file.length < 1) {
            return this._showError();
        }

        /** Hide any modals still open */
        this._hideModal();

        /** Set the element to selected */
        this._$tile
            .addClass('is--selected');

        /** Expose the value to the outside */
        this.mediaURL = file;
    };

    /**
     * Handles a failed nativeFunction call
     * @param e
     * @private
     */
    MediaFileSelector.prototype._onError = function (e) {
        if (
            e === "Camera cancelled." || // Camera cancelled
            e === 'Selection cancelled.' || // Gallery selection cancelled
            (e.code !== undefined && e.code === 3) // Audio cancelled
        ) {
            return; // User cancellation, ignore error
        }

        /**
         * Probably couldn't launch a sound recorder on Android 6:
         * 'No Activity found to handle Intent { act=android.provider.MediaStore.RECORD_SOUND }'
         * */
        if (this._source === 'audio') {
            return this._showError('Er is iets misgegaan met het starten van de audiorecorder.');
        }
        this._showError();
    };

    /**
     * Show an error modal
     * @param message
     * @private
     */
    MediaFileSelector.prototype._showError = function (message) {
        if (message === undefined) {
            message = 'Het is niet gelukt deze actie uit te voeren.';
        }

        this._hideModal();

        $.disclosure({
            mode: 'create',
            modal_class: 'disclosure type--error',
            content: '' +
                '<h1>Helaas!</h1>' +
                '<p>' + message + '</p>' +
                '<button class="button-optional disclosure-close-button">Ik begrijp het</button>'
        });
    };

    /**
     * Hide any modals still active
     * @private
     */
    MediaFileSelector.prototype._hideModal = function (callback) {
        $('body').trigger('disclosure:close', [callback]);
    };

    /**
     * Store the upload result
     * @param result
     * @param callback
     * @private
     */
    MediaFileSelector.prototype._uploadSuccess = function (callback, result) {
        /** Unset the cached media URL */
        this.mediaURL = null;

        /** Parse the JSON, because Cordova refuses to do so */
        if (result.response.length > 0) {
            result.response = JSON.parse(result.response);
        }

        /** Set the response to the element */
        if (result.response['mediaid'] !== undefined) {
            this._$input
                .val(result.response.mediaid);
        } else {
            /** Display an error when we get a 200 OK, but no mediaid */
            return this._uploadError();
        }

        if (typeof callback === "function") {
            callback();
        }
    };

    /**
     * Handle an upload error
     * @param error
     * @private
     */
    MediaFileSelector.prototype._uploadError = function (error) {
        $('body').html(JSON.stringify(error));
        var type = this._source === 'audio' ? 'opname' : 'foto';
        this._showError('Er is iets misgegaan met het versturen van je ' + type + '.');
        this._empty();
    };

    /**
     * Empty the current selection
     * @private
     */
    MediaFileSelector.prototype._empty = function () {
        this._$tile.removeClass('is--selected');
        this._$input.val('');
    };

    /**
     * Initialize on nativeFunctions ready trigger
     */
    $('body').on('nativefunctions:ready', function () {
        var $photoTile = $('.form-item-tile-button[data-app="#camera-modal"]'),
            $audioTile = $('.form-item-tile-button[data-app-source="audio"]'),
            $buttons = $('[data-app-source]'),
            $form = $('form'),
            mediaFileSelectors = [];

        /** Attach MediaFileSelectors to all appropriate buttons */
        $buttons.each(function () {
            var $button = $(this),
                source = $button.data('app-source'),
                $targetTile;

            /** Define the target tile based on the source */
            if (source === 'audio') {
                $targetTile = $audioTile;
            } else {
                $targetTile = $photoTile;
            }

            /** Initialize a MediaFileSelector */
            var mediaFileSelector = new MediaFileSelector($button, $targetTile);
            mediaFileSelector.init();
            mediaFileSelectors.push(mediaFileSelector);
        });

        /** Handle form submit uploads */
        $form.on('submit', function(e) {

            /** Show uploading modal */
            if ($('.disclosure.is--active').length < 1) {
                $.disclosure({
                    mode: 'create',
                    modal_class: 'disclosure',
                    content: '' +
                        '<h1>Even geduld aub</h1>' +
                        '<p>Je inzending wordt verzonden.</p>'
                });
            }

            /** Loop through mediaFileSelectors to see if any still need uploading */
            var $form = $(this);
            for(var key in mediaFileSelectors) {
                var selector = mediaFileSelectors[key];
                if (selector.mediaURL !== null) {
                    /**
                     * Bind the form submit as the upload callback, which will cause recursion.
                     * Recursion will stop on any upload error and will end when all uploads have completed.
                     */
                    selector.upload($form.submit.bind($form));

                    /** Make sure the form is not submitted */
                    e.preventDefault();
                    return false;
                }
            }

            /** When all media files are uploaded, allow the form to be submitted */
            $form.off('submit');
        });
    });

}(jQuery, window));

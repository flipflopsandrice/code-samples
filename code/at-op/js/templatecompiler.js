;var TemplateCompiler = (function ($) {
    'use strict';

    /**
     * TemplateCompiler constructor
     *
     * @param {object}    $target       Wrapper where rendered templates will be injected
     * @param {object}    _template     A lodash template
     * @param {string=}   idDataField   (optional) ID data field attribute of incoming data
     * @param {Deferrer=} deferrer      (optional) An instance of Deferrer
     * @param {object=}   config        (optional) Configuration array
     */
    var TemplateCompiler = function ($target, _template, idDataField, deferrer, config) {
        config = config || {};

        this._$target = $target;
        this.__template = _template;
        this._deferrer = deferrer;
        this._idDataField = idDataField || 'id';
        this._renderInterval = config.renderInterval || 1000;

        /**
         * Return ourselves so user can chain
         */
        return this;
    };

    /**
     * Handle incoming broadcast
     *
     * @param {object|Array} data
     */
    TemplateCompiler.prototype.compile = function (data) {
        /**
         * Wrap a single incoming object in an array so we can map the `_render` function
         */
        if (!(data instanceof Array)) {
            data = [data];
        }

        /**
         * Map rendering to the incoming data array
         */
        data.map(this._render.bind(this));

        /**
         * Set initial state to false
         *
         * @type {boolean}
         * @private
         */
        this._initial = false;
    };

    /**
     * Render the lodash template with the broadcasted data
     *
     * @param {Array}  data
     * @param {int}    index
     * @private
     */
    TemplateCompiler.prototype._render = function (data, index) {
        var $renderedTemplate = $(this.__template(data)),
            id = data[this._idDataField],
            $dupes = this._$target.find('[data-broadcast-id="' + id + '"]'),
            type;

        /**
         * Define the type base don the context
         */
        if (this._initial === undefined) {
            type = 'initial';
        } else if ($dupes.length > 0) {
            type = 'existing';
        } else {
            type = 'update';
        }

        /**
         * Tag the rendered template with an id
         */
        $renderedTemplate
            .attr('data-broadcast-id', id)
            .attr('data-broadcast-type', type)
            .show();

        /**
         * Throttle injecting the template so they appear slowly into the interface
         */
        setTimeout(
            this._throttledRender.bind(this, $renderedTemplate, $dupes),
            type === 'index' ? this._renderInterval * index : 0
        );
    };

    /**
     * Either prepend or replace the rendered template
     *
     * @param {jQuery} $renderedTemplate   The rendered template in a jQuery object
     * @param {jQuery} $dupes              jQuery array of possible duplicates
     */
    TemplateCompiler.prototype._throttledRender = function ($renderedTemplate, $dupes) {

        var doRender = function () {
            if ($dupes.length === 1) {
                $dupes.replaceWith($renderedTemplate);
            } else {
                this._$target.prepend($renderedTemplate);
            }

            /**
             * If a deferred loader is available, run it
             */
            this._deferrer && this._deferrer.load();
        }.bind(this);

        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(doRender);
        } else {
            doRender();
        }
    };

    /** Expose the TemplateCompiler */
    return TemplateCompiler;

})(jQuery);

/**
 * LazyDefer
 * This module lazily adds any html attribute as soon as an element is in viewport.
 * Supports breakpoints.
 *
 * EXAMPLE
 * This example will set the `src` tag to `mobile.jpg` when `breakpoint-mobile` is true, otherwise it falls back on
 * the value of `default` which is `default.jpg`:
 *
 *      <img data-lazy-defer='{"src": {"breakpoint-mobile": "mobile.jpg", "default": "default.jpg"}}' />
 *
 * Additional configuration can be added with the `data-lazy-defer-config`, for example:
 *
 *      <img data-lazy-defer-config='{ "debounce_timeout": 500 }' data-lazy-defer=' ... ' />
 *
 */
;var LazyDefer = (function ($, _, window) {

    /**
     * LazyDefer constructor
     *
     * @param $target
     * @param options
     * @param config
     * @constructor
     */
    var LazyDefer = function ($target, options, config) {
        /**
         * Check for lodash
         */
        if (_ === undefined) {
            throw '[lazy-defer] lodash is required';
        }

        /**
         * Check for jquery
         */
        if ($ === undefined) {
            throw '[lazy-defer] jquery is required';
        }

        /**
         * Check for window.breakpoint
         */
        if (window.breakpoint === undefined) {
            throw '[lazy-defer] window.breakpoint is required';
        }

        /**
         * Set local variables
         */
        this.$target = $target;
        this.options = options;
        this.config = $.extend(true, LazyDefer.defaultConfig, config);

        /**
         * Attach listeners
         */
        this._initListeners();

        /**
         * Always call the event handler on load, so the image can be deferred when already in viewport
         */
        this._handleEvent();
    };

    /**
     * Default configuration
     *
     * @type {object}
     */
    LazyDefer.defaultConfig = {
        init_timeout: 0,
        debounce_timeout: 25,
        after_defer_class: 'is--deferred'
    };

    /**
     * Attach debounced listeners
     *
     * @private
     */
    LazyDefer.prototype._initListeners = function () {
        /**
         * Trigger `_handleEvent` on:
         * - window.scroll
         * - window.resize
         * - window.lazy-defer (custom event)
         */
        $(window).on('scroll resize lazy-defer', _.debounce(this._handleEvent.bind(this), this.config.debounce_timeout));

        /**
         * Trigger `_handleEvent` on nearest `.mobile-scrollable` (horizontal scrolling element):
         * - element.scroll
         */
        this.$target.parents('.mobile-scrollable').on('scroll', _.debounce(this._handleEvent.bind(this), this.config.debounce_timeout));
    };

    /**
     * Handle a defer event
     *
     * @returns {boolean}
     * @private
     */
    LazyDefer.prototype._handleEvent = function () {
        /**inView
         * Stop when element is not in viewport
         */
        if (!this._inViewport()) {
            return false;
        }

        /**
         * Grab the current breakpoint
         */
        var breakpoint = window.breakpoint ? window.breakpoint() : 'default';

        /**
         * Loop through all args and defer the breakpoint calls
         */
        for (var attr in this.options) {
            /**
             * Grab the value for the current breakpoint (falls back to default when breakpoint not in map)
             *
             * @type string
             */
            var value = this.options[attr][breakpoint] || this.options[attr]['default'] || '';

            /**
             * Defer setting the value
             */
            this._defer(attr, value);
        }
    };

    /**
     * Check whether the element is in viewport
     *
     * @returns {boolean}
     * @private
     */
    LazyDefer.prototype._inViewport = function () {
        /**
         * If module `InViewPort` is not available, return true
         */
        if (window.inviewport === undefined) {
            return true;
        }

        return window.inviewport(this.$target[0]);
    };

    /**
     * Execute the defer
     *
     * @param tag
     * @param value
     * @returns {boolean}
     * @private
     */
    LazyDefer.prototype._defer = function (tag, value) {
        /**
         * Only alter value if changed or not equal
         */
        if (this.$target.attr(tag) !== value) {
            this.$target.attr(tag, value)
        }

        /**
         * Set the class
         */
        this.$target.addClass(this.config.after_defer_class);
    };

    /**
     * On DOM ready
     */
    $(function () {

        /**
         * Initialize lazy deferrers for all elements tagged with `[data-lazy-defer]`
         */
        var initLazyDefer = function () {
            $('[data-lazy-defer]').each(function () {
                var $target = $(this),
                    options = $target.data('lazy-defer'),
                    config = $target.data('lazy-defer-config');
                new LazyDefer($target, options);
            })
        };

        /**
         * Timeout if the init_timeout is set
         */
        if (LazyDefer.defaultConfig.init_timeout > 0) {
            setTimeout(initLazyDefer, LazyDefer.defaultConfig.init_timeout);
        } else {
            initLazyDefer();
        }
    });

    /**
     * Expose to outer context
     */
    return LazyDefer;

})(jQuery, _, window);

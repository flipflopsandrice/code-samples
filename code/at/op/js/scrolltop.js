(function($, window) {
    /**
     * Constructor
     * @param {jQuery} $
     * @param {window} window
     * @param {object} config
     * @constructor
     */
    var Scrolltop = function($, window, config) {
        this._$ = $;
        this._$window = $(window);
        this._config = $.extend(this._config, config);

        this._injectElement();
        this._attachListener();
    };

    /**
     * Default configuration, override on instantiation
     * @type {{triggerPx: number, appendTarget: string, className: string, activeClass: string}}
     * @private
     */
    Scrolltop.prototype._config = {
        triggerPx: 0,
        appendTarget: 'body',
        className: 'scrolltop',
        activeClass: 'is--active'
    };

    /**
     * Inject the scroll element into the body
     * @private
     */
    Scrolltop.prototype._injectElement = function() {
        /* Initialize the element */
        this._$element = this._$('<div />');

        /* Set styles on the element */
        this._$element.addClass(this._config.className);

        /* Append to target */
        this._$(this._config.appendTarget)
            .append(this._$element);
    };

    /**
     * Attach run method to the scroll event
     * @private
     */
    Scrolltop.prototype._attachListener = function() {
        this._$window.on('scroll', this.run.bind(this));
        this._$element.on('click', this.top.bind(this));
    };

    /**
     * Detach run method from the scroll event
     * @private
     */
    Scrolltop.prototype._detachListener = function() {
        this._$window.off('scroll');
        this._$element.off('click');
    };

    /**
     * Run the scroll validation, sets a class based on the
     * @returns {jQuery}
     */
    Scrolltop.prototype.run = function() {
        var distance = this._$window.scrollTop();
        if (distance > this._config.triggerPx) {
            return this._$element.addClass(this._config.activeClass);
        }
        return this._$element.removeClass(this._config.activeClass);
    };

    /**
     * Scroll to top animation
     */
    Scrolltop.prototype.top = function() {
        this._$('html,body').animate({
            scrollTop: 0
        }, 400);
    };

    /**
     * Expose the object
     * @type {Scrolltop}
     */
    window.Scrolltop = Scrolltop;

    /**
     * On document ready
     */
    $(function() {
        /**
         * Initialize the module on document ready
         * @type {Scrolltop}
         */
        if (breakpoint() !== 'breakpoint-mobile') {
            var scrolltop = new Scrolltop($, window);
        }
    });
})(jQuery, window);

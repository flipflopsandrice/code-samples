/**
 * Return the requested pseudo element property of a jquery object
 * @param pseudo    'before' or 'after'
 * @param prop      'content' or any other css property
 * @returns {*}
 */;var pseudoProperty = (function($) {

    /**
     * Return pseudo property value
     *
     * @param pseudo
     * @param prop
     * @returns {*}
     */
    var func = function (pseudo, prop) {
        var afterEl = window.getComputedStyle ? window.getComputedStyle(this[0], ':' + pseudo) : false;
        if (!afterEl || !prop) return false;
        return afterEl.getPropertyValue(prop).replace(/^["']|["']$/g, '');
    };

    /**
     * Set pseudoProperty as jQuery plugin
     *
     * @type {func}
     */
    $.fn.pseudoProperty = func;

    /**
     * Expose to global
     */
    return func;
})(jQuery);

/**
 * Export for unit tests
 */
if ("object" == typeof module && "object" == typeof module.exports) {
    module.exports = pseudoProperty;
}

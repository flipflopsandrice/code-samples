/**
 * InViewPort module
 * - Returns whether an element is in viewport
 */
;var inviewport = (function($, window) {
    /**
     * Return whether an element is in viewport
     * @param element
     * @returns {string|*}
     */
    return function (element) {
        /**
         * If client doesn't support `getBoundingClientRect` always return true
         */
        if (element === undefined || element.getBoundingClientRect === undefined) {
            return true;
        }

        /**
         * Get element and window bounds
         * @type {ClientRect}
         */
        var bounds = element.getBoundingClientRect(),
            vpWidth = $(window).width(),
            vpHeight = $(window).height();

        /**
         * Return whether the bounds are within the viewport
         */
        return (
            (bounds.top > 0 || bounds.bottom > 0) && (bounds.left > 0 || bounds.right > 0) &&
            (bounds.top < vpHeight || bounds.bottom < vpHeight) && (bounds.left < vpWidth || bounds.right < vpWidth)
        );
    };
})(jQuery, window);

/**
 * Export for unit tests
 */
if ("object" == typeof module && "object" == typeof module.exports) {
    module.exports = inviewport;
}

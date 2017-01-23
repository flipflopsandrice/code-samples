/**
 * TextOverflow module
 * - looks at elements with `:after` with content `text-overflow:true`
 * - line clamps them to max height (cross browser)
 */
;var TextOverflow = (function($) {

    /**
     * TextOverflow constructor
     * @constructor
     */
    TextOverflow = function() {
        /**
         * Throw an error if 'pseudo-property.js' is not in the project
         */
        if ($.fn.pseudoProperty === undefined) {
            throw 'pseudoProperty module not loaded';
        }

        /**
         * Throw an error if dotdotdot is not present
         */
        if ($.fn.dotdotdot === undefined) {
            throw 'dotdotdot not loaded';
        }
    };

    /**
     * Initialize line clamping
     *
     * @param idx
     * @param el
     */
    TextOverflow.prototype.clamp = function (idx, el) {
        /**
         * Dotdotdot will automatically grab the max-height set in CSS
         */
        $(el).dotdotdot({
            watch: true
        });
    };

    /**
     * Return if clampable
     *
     * @param idx
     * @param el
     * @returns {boolean}
     */
    TextOverflow.prototype.isClampable = function(idx, el) {
        return $(el)
                .pseudoProperty('after', 'content')
                .indexOf('text-overflow:') === 0;
    };

    TextOverflow.prototype.builder = function () {
        var textOverflow = new TextOverflow();
        $('*')
            .filter(textOverflow.isClampable)
            .map(textOverflow.clamp);
    };

    return TextOverflow;
})(jQuery);

;var Deferrer = (function ($) {

    /**
     * Construct the deferrer
     *
     * @param attributeKey
     * @param valueKey
     * @returns {Deferrer}
     * @constructor
     * @todo research lazy loading implementation
     */
    var Deferrer = function (attributeKey, valueKey) {
        this._attributeKey = attributeKey || 'defer-attr';
        this._valueKey = valueKey || 'defer-value';
        return this;
    };

    /**
     * Map deferrer on the matching DOM elements
     * @returns {Deferrer}
     */
    Deferrer.prototype.load = function () {
        var $target = $('[' + this._attributeKey + ']');
        $target.map(this._performDefer.bind(this));
        return this;
    };

    /**
     * Perform defer on mapped element attributes
     * @param index
     * @param element
     * @private
     */
    Deferrer.prototype._performDefer = function (index, element) {
        var $el = $(element),
            attr = $el.attr(this._attributeKey),
            val = $el.attr(this._valueKey);
        $el.attr(attr, val);
    };

    /**
     * Expose outside scope
     */
    return Deferrer;

})(jQuery);

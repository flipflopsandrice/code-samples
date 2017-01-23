(function ($, modules) {
    'use strict';
    modules.general = function () {
        var common = require('common');
        common.initCommonMethods();

        $('*[data-ga]').on('click', function () {
            var $this = $(this),
                value = $this.attr('data-ga'),
                category = $this.attr('data-cat');
            if (category === undefined) {
                category = 'Nav';
            }
            ga('send', 'event', category, 'Click', value);
        });
    };
})(jQuery, modules);

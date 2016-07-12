(function ($, modules) {
    'use strict';
    modules.details = function () {
        var common = require('common');

        common.initToggleMethods();

        $('.container').addClass('auto-height-mobile');

        $('.radio-buttons__span').on('click', function () {
            $(this).parents('.radio-button').find('input').prop('checked', true);
        });

        $('input,select').on('change', function (event) {
            $(this).validate(event);
        });

        $('input[type=radio]').on('click', function (event) {
            $(this).validate(event);
        });

        $('.form-progress__item_checkbox').on('click', function () {
            var checkbox = $(this).children('.checkbox').find('input').focus();
            checkbox.prop('checked', !checkbox.prop('checked'));
        });

        $('input[type="number"]').on('keyup', handleDate);

        $('.personal-details__submit-button').on('click', function (event) {
            event.preventDefault();
            $('.form-progress_post').submit();
        });

        $('.form-progress_post').on('submit', submitForm);

        setTimeout(function () {
            $('.form-progress_post input').map(function () {
                var $input = $(this);
                if ($input.val() !== '' && $input.attr('required') && $input.attr('type') !== "radio") {
                    $input.validate();
                }
            });
        }, 500);

        $.each($('.autocomplete'), implementAutocomplete);

        $('.form-progress__item_country').hide();

        if (window.recaptchaCallback === undefined) {
            window.recaptchaCallback = recaptchaCallback;
        }
    };

    function submitForm(event) {
        var $country = $('*[name="form[country]"]'),
            $city    = $('input#element-city'),
            $recaptcha = $('.g-recaptcha'),
            $response = $('.g-recaptcha-response'),
            $fields = $('.form-progress_post input, .form-progress_post select'),
            $invalids;

        $fields.map(function () {
            $(this).validate(event);
        });

        $invalids = $('.form-progress__item_invalid');

        if ($city.val().length > 0 && $country.val().length === 0) {
            event.preventDefault();
            autoSearch($city, function () {
                $('.form-progress_post').submit();
            });
            return;
        }

        if ($recaptcha.length && !$response.val().length && !$invalids.length) {
            toggleCaptcha($recaptcha);
            event.preventDefault();
        }

        if ($invalids.length) {
            event.preventDefault();
        }
    }

    function toggleCaptcha($field) {
        var $overlay = $field.closest('.overlay'),
            $checkout = $('.checkout');

        if ($overlay.filter(':hidden').length) {
            $overlay.on('click', function () {
                $overlay.off('click');
                toggleCaptcha($field);
            });
        }
        $overlay.fadeToggle(250);
        $checkout.slideToggle(250);
    }

    function recaptchaCallback() {
        var $recaptcha = $('.g-recaptcha'),
            $overlay = $recaptcha.closest('.overlay'),
            $form = $('.form-progress_post');

        $overlay.fadeOut(250, function () {
            $form.submit();
        });
    }

    function handleDate(event) {
        var $self         = $(this),
            charCode      = event.which,
            maxNumber     = ($self.hasClass('two-numbers')) ? 2 : 4,
            $inputToFocus = ($self.hasClass('two-numbers')) ? $self.next('.divider').next('input') : $self.parents('div').next().find('input');

        if (((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) && ($self.val().length === maxNumber)) {
            $inputToFocus.focus();
        }
    }

    function implementAutocomplete(idx, element) {
        var $element = $(element),
            container = $($element.closest('div').next()),
            searchTimer;

        $element.keyup(function () {
            if (searchTimer) {
                clearInterval(searchTimer);
            }
            if (this.value.length > 0) {
                searchTimer = setTimeout(startSearch.bind(this, $element, onSearchResult), 200);
            } else if (this.value.length === 0) {
                container.empty();
                container.hide();
            }
        });
    }

    function startSearch($element, searchCallback, onComplete) {
        var fuzzy = 0.3;

        // jscs:disable
        var lang =  $element.closest('form').attr('data-language').toUpperCase(),
                    data = {
                        q:  $element.val(),
                        fuzzy: fuzzy,
                        maxRows: 5,
                        style: 'full',
                        username: 'redacted',
                        lang: lang,
                        featureClass: 'P',
                        type: 'json'
                    };
        // jscs:enable

        $.ajax({
            dataType: 'jsonp',
            url: location.protocol + '//secure.geonames.net/search',
            data: data,
            timeout: 2000,
            success: searchCallback.bind(this, $element, onComplete),
            error: searchError.bind(this, $element)
        });
    }

    function searchError($element) {
        var $fallback = $('.form-progress__item_country'),
            $hidden = $element.closest('.form-progress__block').next('input[type="hidden"]'),
            $select = $fallback.find('select');

        $element.unbind('keyup');
        $hidden.remove();
        $fallback.show();
        $select.removeAttr('disabled')
            .attr('required', 'required')
            .validate();
        $select.on('change', function () {
            $('#element-country_code').val($(this).val());
        });
    }

    function onSearchResult($element, onComplete, data) {
        var container = $($element.closest('div').next()),
            length    = data.geonames.length,
            result,
            $triangle,
            $item,
            i;

        container.empty();

        if (!length) {
            return container.hide();
        }

        $triangle = $('<div>').addClass('options__triangle');
        container.append($triangle);

        for (i = 0; i < length; i += 1) {
            result = data.geonames[i];
            $item = $('<a>')
                .addClass('option')
                .text(result.name + ', ' + result.adminName1 + ', ' + result.countryName)
                .attr('href', '#')
                .attr('data-city', result.name)
                .attr('data-lat', result.lat)
                .attr('data-lon', result.lng)
                .attr('data-province', result.adminName1)
                .attr('data-country-code', result.countryCode)
                .attr('data-country-name', result.countryName);

            $item.on('click', selectCityOption.bind(this, container));

            if (container) {
                container.append($item);
            }
        }
        if (container) {
            container.show();
        }
    }

    function selectCityOption(container, event) {
        var $self = $(event.currentTarget);
        event.preventDefault();

        setCountryData(
            $self.attr('data-city'),
            $self.attr('data-lat'),
            $self.attr('data-lon'),
            $self.attr('data-country-name'),
            $self.attr('data-country-code')
        );

        if (container) {
            container.hide();
        }

        $self.parents('#form-progress__element-city')
            .siblings('#form-progress__element-date_of_birth')
            .find('input:first-child').focus();
    }

    function autoSearch($city, onComplete) {
        startSearch($city, onAutoSearch, onComplete);
    }

    function onAutoSearch($city, onComplete, data) {
        var result = data.geonames[0];

        if (data.geonames.length === 0) {
            searchError($city);
            return false;
        }

        setCountryData(
            result.name,
            result.lat,
            result.lng,
            result.countryName,
            result.countryCode
        );

        onComplete();
    }

    function setCountryData(city, lat, lon, countryName, countryCode) {
        $('#element-city').val(city);
        $('#element-lat').val(lat);
        $('#element-lon').val(lon);
        $('#element-country').val(countryName);
        $('#element-country_code').val(countryCode);
    }


})(jQuery, modules);

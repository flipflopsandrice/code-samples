'use strict';

var chai = require('chai'),
    expect = chai.expect;

describe('pseudo-property', function () {

    var pseudoProperty,
        mockPropertyValue = 'test-pseudo-property-value';

    before(function() {
        /**
         * Mock jQuery fn
         * @type {{}}
         */
        $.fn = {};

        /**
         * Mock window.getComputedStyle and element.getPropertyValue
         *
         * @returns {{getPropertyValue: getPropertyValue}}
         */
        window.getComputedStyle = function() {
            return {
                getPropertyValue: function () {
                    return mockPropertyValue;
                }
            }
        };

        pseudoProperty = require('../../sources/scripts/modules/pseudo-property.js');
    });

    it('is defined', function() {
        expect(typeof pseudoProperty).to.exist;
    });

    it('is a function', function() {
        expect(typeof pseudoProperty).to.equal('function');
    });

    it('should return the mock pseudo property value', function() {
        expect(pseudoProperty('after', 'content')).to.equal(mockPropertyValue);
    });

    it('should return false when window.getComputedStyle is not available', function() {
        window.getComputedStyle = undefined;
        expect(pseudoProperty('after', 'content')).to.equal(false);
    });

    it('should have set itself on $.fn', function() {
        expect($.fn.pseudoProperty).to.exist;
        expect($.fn.pseudoProperty).to.equal(pseudoProperty);
    });
});

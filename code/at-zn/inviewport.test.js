'use strict';

var jsdom = require('jsdom'),
    chai = require('chai'),
    expect = chai.expect;

describe('inviewport', function () {

    var inviewport,
        mockElement,
        mockWidth = 999,
        mockHeight = 111,
        mockBoundingRect = {
            top: 1,
            right: mockWidth - 1,
            bottom: mockHeight - 1,
            left: 1
        };

    before(function () {
        inviewport = require('../../sources/scripts/modules/inviewport.js');

        /**
         * Mock jQuery.width()
         * @returns {number}
         */
        global.fn.width = function () {
            return mockWidth;
        };

        /**
         * Mock jQuery.height()
         * @returns {number}
         */
        global.fn.height = function () {
            return mockHeight;
        };

        /**
         * Mock Element
         * @type {{getBoundingClientRect: mockElement.getBoundingClientRect}}
         */
        mockElement = {
            getBoundingClientRect: function () {
                return mockBoundingRect;
            }
        }
    });

    it('is defined', function () {
        expect(typeof inviewport).to.exist;
    });

    it('is a function', function () {
        expect(typeof inviewport).to.equal('function');
    });

    it('should return true when element is undefined', function () {
        expect(inviewport()).to.equal(true);
    });

    it('should return true when element.getBoundingClientRect is undefined', function () {
        expect(inviewport({})).to.equal(true);
    });

    it('should return true when element is within bounds', function () {
        expect(inviewport(mockElement)).to.equal(true);
    });

    it('should return false when element is outside of bounds', function () {
        /**
         * Set position to out of bounds
         */
        mockBoundingRect.top = -10;
        mockBoundingRect.right = -1;
        mockBoundingRect.bottom = -1;
        mockBoundingRect.left = -10;

        expect(inviewport(mockElement)).to.equal(false);
    });
});

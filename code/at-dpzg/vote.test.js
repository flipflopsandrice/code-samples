'use strict';

var chai = require('chai'),
    expect = chai.expect,
    rewire = require('rewire');

describe('vote', function () {

    var Vote,
        mockConfig,
        mockElement,
        mockChildElement;

    beforeEach(function () {
        mockConfig = {
            data: {uid: 1, rid: 1},
            endpoint: '/index.json',
            action: 'vote'
        };

        mockChildElement = {
            each: function () {
                return 'Child element';
            }
        };

        mockElement = {
            data: function () {
                return 'Data attribute';
            },
            find: function () {
                return mockChildElement;
            }
        };

        /**
         * Rewire jQuery
         */
        global.jQueryRewire();

        /**
         * Include our module
         */
        Vote = rewire('../../sources/scripts/modules/vote.js');
    });

    it('is defined and is a function', function () {
        expect(typeof Vote).to.exist;
        expect(typeof Vote).to.equal('function');
    });

    it('should have a buildSelector prototype property', function () {
        expect(Vote.prototype).to.have.property('buildSelector');
    });

    it('should have a builder prototype function', function () {
        expect(Vote.prototype).to.have.property('builder');
        expect(typeof Vote.prototype.builder).to.equal('function');
    });

    it('should have a build prototype function', function () {
        expect(Vote.prototype).to.have.property('build');
        expect(typeof Vote.prototype.build).to.equal('function');
    });

    it('should call $.fn.map() when calling builder', function () {
        var mapCalled = false;
        global.$.map = function () {
            return mapCalled = true;
        };

        /**
         * Call builder
         */
        Vote.prototype.builder();

        /**
         * Assert against mock jQuery object
         */
        expect(mapCalled).to.equal(true);
    });

    it('should call $.fn.map() with Vote.prototype.build when calling `builder`', function () {
        var mapCalledWithVoteFunction = false;
        global.$.fn.map = function (func) {
            mapCalledWithVoteFunction = (
                typeof func === 'function' &&
                func === Vote.prototype.build
            );
        };
        Vote.prototype.builder();
        expect(mapCalledWithVoteFunction).to.equal(true);
    });

    it('should throw an error calling `build` with missing config', function () {
        expect(Vote.prototype.build).to.throw(Error);
    });

    it('should throw an error calling `Vote()` with missing config', function () {
        expect(function () {
            new Vote;
        }).to.throw(Error);
    });

    it('should have a setState function', function () {
        expect(Vote.prototype).to.have.property('setState');
        expect(typeof Vote.prototype.setState).to.equal('function')
    });

    it('should POST to the check endpoint with our data on initiation', function () {
        var calledPostEndpoint = false,
            calledPostData = false;

        /**
         * Override jQuery `post`
         */
        global.$.post = function (endpoint, data) {
            calledPostEndpoint = endpoint;
            calledPostData = data;

            /**
             * Return a chaining jQuery element
             */
            return {
                done: function () {
                    return {
                        fail: function () {
                        }
                    }
                }
            };
        };

        new Vote(mockElement, mockConfig);

        /**
         * Expect $.post to be called with our config endpoint and an additional state called `mode` === "check"
         */
        expect(calledPostEndpoint).to.equal(mockConfig.endpoint);
        expect(calledPostData).to.not.equal(false);
        expect(calledPostData).to.have.property('mode');
        expect(calledPostData.mode).to.equal('check');
    });
});

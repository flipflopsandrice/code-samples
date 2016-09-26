/**
 * == VOTE MODULE ==
 *
 * This module handles three different states:
 * - Voting
 * - Revoking/removing a vote
 * - Revoting (removing a vote server-side by voting on something else)
 *
 * Internally it has an additional state called `voted`, which contains a flash-message thanking the user for the vote.
 *
 * == CONFIGURATION ==
 * ... <redacted> ...
 *
 * == BUILDER ==
 * ... <redacted> ...
 *
 * == VOTE ACTIONS ==
 * ... <redacted> ...
 *
 * == ERROR HANDLING ==
 * ... <redacted> ...
 *
 */
;var Vote = (function ($) {

    /**
     * Constructor
     *
     * @param {Object} $target
     * @param {Object} config
     * @constructor
     */
    var Vote = function ($target, config) {
        this._$states = {};
        this._config = config;

        /**
         * Check the initial state
         */
        if (this._config.data === undefined) {
            throw '[Vote] POST data not defined in config';
        }

        /**
         * Check endpoint is present in config
         */
        if (this._config.endpoint === undefined) {
            throw '[Vote] endpoint not defined in config';
        }

        /**
         * Check for vote action
         */
        if (this._config.action === undefined) {
            throw '[Vote] action not defined in config';
        }

        /**
         * Specify the active class for vote states
         * @type {string}
         */
        this._config.active_class = this._config.active_class || 'is--active';

        /**
         * Store the state elements in a state map
         */
        $target.find('[data-vote-state]').each(function (idx, obj) {
            var $state = $(obj),
                state = $state.data('vote-state');
            this._$states[state] = $state;
        }.bind(this));

        this._checkState();
    };

    /**
     * The DOM selector for a vote block wrapper
     *
     * @note Can be overwritten by changing the prototype
     * @type {string}
     */
    Vote.prototype.buildSelector = '[data-vote]';

    /**
     * Window event that will be fired when an error occurs
     * @type {string}
     */
    Vote.prototype.errorEvent = 'vote-error';

    /**
     * Static method for builder pattern
     *
     * @param selector
     * @returns {Array}
     */
    Vote.prototype.builder = function (selector) {
        try {
            return $(selector || Vote.prototype.buildSelector).map(Vote.prototype.build);
        } catch (e) {
            console.log(e);
        }
    };

    /**
     * Build a new instance
     *
     * @returns {Vote}
     */
    Vote.prototype.build = function () {
        var $target = $(this);
        return new Vote($target, $target.data('vote'));
    };

    Vote.prototype._checkState = function () {
        var data = $.extend({}, this._config.data, { mode: 'check' });

        $.post(this._config.endpoint, data)
            .done(this._initialize.bind(this))
            .fail(this._initialize.bind(this));
    };

    /**
     * Do some damage control when voting endpoint is broken
     *
     * @private
     */
    Vote.prototype._onCheckStateFail = function () {
        /**
         * Loop through the states objects
         */
        for (var key in this._$states) {
            /**
             * Set every state to inactive
             */
            this._$states[key].removeClass(this._config.active_class);
        }
    };

    /**
     * Initialize the listeners on voting action
     *
     * @private
     */
    Vote.prototype._initialize = function (res) {
        var data = this._parseJSON(res.responseText || res);

        /**
         * Assume voting endpoint is broken if we did not get a valid response
         */
        if (data === undefined || data.success === undefined) {
            return this._onCheckStateFail();
        }

        $(this._config.action).on('click', this._action.bind(this));
        this._config.state = data.success ? 'vote' : 'remove';
        this._setState(this._config.state);
    };

    Vote.prototype._action = function (event) {
        var $target = $(event.currentTarget),
            action = $target.data('vote-action');

        /**
         * Compile the data to send
         */
        var data = $.extend({}, this._config.data, { mode: action });

        /**
         * Perform action request
         */
        $.post(this._config.endpoint, data)
            .done(this._onActionSuccess.bind(this, action)) // <- when HTTP == 200
            .fail(this._onActionFailed.bind(this, action)); // <- when HTTP != 200
    };

    /**
     * Handle successful response from endpoint
     *
     * @param action
     * @param res
     * @private
     */
    Vote.prototype._onActionSuccess = function (action, res) {
        var data = this._parseJSON(res);

        /**
         * Fail when result data is not as expected
         */
        if (data.success === undefined || !data.success) {
            return this._onActionFailed(action, { responseText: res });
        }

        /**
         * Handle specific voting action
         */
        switch (action) {
            case 'vote':
            case 'revote':
                this._setState('voted');
                setTimeout(
                    this._setState.bind(this, 'remove'),
                    this._config.votedTimeout || 2000
                );
                break;
            case 'remove':
                this._setState('vote');
                break;
            default:
                /**
                 * Fail gracefully
                 */
                this._onActionFailed(action);
        }
    };

    /**
     * Handle failures by triggering a window event, passing the error message
     *
     * @param action
     * @param res
     * @private
     */
    Vote.prototype._onActionFailed = function (action, res) {
        var modal = this._$states[action] && this._$states[action].data('vote-error-message'),
            data = this._parseJSON(res.responseText || res);

        var error = {
            header: this._config.errorHeader || 'Helaas!',
            content: ((data.error && this._config.errors[data.error]) || 'Er is iets misgegaan bij het verwerken van je stem. Probeer het later nog eens.')
        };

        /**
         * Attach the `revote` message modal when we detect a duplicate vote
         */
        if (
            modal !== false &&
            action === 'vote' &&
            data.error === 'duplicate'
        ) {
            error.modal = modal;
        }

        /**
         * Trigger a window event, passing the error message with it
         */
        return $(window).trigger(this.errorEvent, error);
    };

    /**
     * Set the voting state in the UI
     *
     * @param state
     * @private
     */
    Vote.prototype._setState = function (state) {
        this._config.state = state;

        for (var key in this._$states) {
            this._$states[key].removeClass(this._config.active_class);
        }

        this._$states[state].addClass(this._config.active_class);
    };

    /**
     * Parse JSON, return an empty object on error
     *
     * @param obj
     * @returns {{}}
     * @private
     */
    Vote.prototype._parseJSON = function (obj) {
        /**
         * Attempt to parse the JSON response
         */
        try {
            return JSON.parse(obj) || {};
        } catch (e) {
            return {}
        }
    };

    return Vote;
})(jQuery);

/**
 * Export for unit tests
 */
if ('object' == typeof module && 'object' == typeof module.exports) {
    module.exports = Vote;
}

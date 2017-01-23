import { throttle as throttler } from 'lodash';

/**
 * Max items in queue within throttle window
 * @type {number}
 */
const QUEUE_LENGTH = 20;

/**
 * Throttle timeout (ms)
 * @type {number}
 */
const TIMEOUT = 1000;

/**
 * Throttle middleware
 * This limits the amount of actions matching a filter to `QUEUE_LENGTH` per `TIMEOUT`.
 */
function throttleMiddleware() {
  let queue = [];

  /**
   * Map queue elements to `next` and reset queue
   */
  const handleQueue = throttler(next => {
    queue.map(next);
    queue = [];
  }, TIMEOUT);

  /**
   * Handle incoming actions, add to queue if match
   */
  return next => action => {
    const { throttle } = action;

    if (!throttle) {
      return next(action);
    }

    /**
     * Add to end of queue
     */
    queue.push(action);

    /**
     * Limit the queue size to `QUEUE_LENGTH` by splicing it
     * @type {Array.<*>}
     */
    queue = queue.slice(-QUEUE_LENGTH);

    /**
     * Pass next to throttled handler
     */
    return handleQueue(next);
  };
}

export { throttleMiddleware, QUEUE_LENGTH, TIMEOUT };

export default throttleMiddleware;

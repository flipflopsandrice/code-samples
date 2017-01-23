import {
  CONNECT_SOCKET,
  DISCONNECT_SOCKET,
  SOCKET_LOCK_TITLE,
  SOCKET_UNLOCK_TITLE
} from '../actions/const';
import io from 'socket.io-client';
import config from 'config';
import { receiveSocketMessage, ACCEPTED_TYPES } from '../actions/receiveSocketMessage';
import { connectInit, connectSuccess, connectError } from '../actions/connectSocket';
import { disconnectInit, disconnectSuccess } from '../actions/disconnectSocket';

export function socketIoMiddleware(store) {
  let socket = null;
  const { dispatch } = store;

  return next => action => {
    switch (action.type) {
      case CONNECT_SOCKET: {
        /**
         * Dispatch init action
         */
        dispatch(connectInit());

        /**
         * Silent fail if no token was passed
         */
        if (
          action.parameters === undefined ||
          action.parameters.token === undefined
        ) {
          break;
        }

        /**
         * Disconnect socket if already opened
         */
        if (socket !== null) {
          socket.close();
        }

        /**
         * Connect to socket.io endpoint
         */
        const options = {
          path: config.socket.path,
          query: { token: localStorage.getItem('accessToken') }
        };
        socket = io.connect.apply(null, [config.socket.url, options].filter((p) => p));
        socket.on('connect', () => dispatch(connectSuccess()));
        socket.on('disconnect', () => dispatch(disconnectSuccess()));
        socket.on('connect_error', (e) => dispatch(connectError(e)));

        /**
         * Map the accepted types to the dispatchMessage cb
         */
        ACCEPTED_TYPES.map(
          type => socket.on(type, params => dispatch(receiveSocketMessage(type, params)))
        );
        break;
      }
      case DISCONNECT_SOCKET: {
        /**
         * Dispatch init action
         */
        dispatch(disconnectInit());

        /**
         * Close socket if open
         */
        if (socket !== null) {
          socket.close();
        }
        break;
      }
      case SOCKET_UNLOCK_TITLE:
      case SOCKET_LOCK_TITLE: {
        socket.emit('locks', action.payload);
        break;
      }
      default:
    }
    return next(action);
  };
}

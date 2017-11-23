import * as debug from './debug.js';
import Controller from './Controller.js';

export const MSG_TYPE = {
    SESSION_CREATE: 'session-create',
    SESSION_CREATED: 'session-created',
    SESSION_JOIN: 'session-join',
    SESSION_STATE: 'session-state',
    SESSION_DESTROYED: 'session-destroyed',

    UPDATE_STATE: 'update-state',
};

export default class ConnectionManager {

    /**
     * @param {Controller} controller 
     */
    constructor(controller) {
        this._controller = controller;
        this._conn = null;

        this._peers = new Map();
    }

    /**
     * 
     * @param {String} address 
     */
    connect(address) {
        this._conn = new WebSocket(address);

        this._conn.addEventListener('open', () => {
            debug.log('Connection established');

            this.initSession();
        });

        this._conn.addEventListener('message', event => {
            const { type, data } = JSON.parse(event.data);

            this._onReceived(type, data);
        });
    }

    initSession() {
        const sessionId = window.location.hash.split('#')[1];
        if (sessionId) {
            // join a room/session
            this._send(MSG_TYPE.SESSION_JOIN, { id: sessionId });
        } else {
            // create new room/session
            this._send(MSG_TYPE.SESSION_CREATE);
        }
    }

    /**
     * 
     * @param {Object} state 
     */
    sendUpdate(state) {
        this._send(MSG_TYPE.UPDATE_STATE, state);

        // check if local tetris has ended then if all tetrises are ended and show winner(s)
        this._checkEnded(state);
    }

    /**
     * 
     * @param {String} type 
     * @param {Object} data 
     */
    _onReceived(type, data) {
        debug.log('Message received', type, ' ', data);

        switch (type) {
            case MSG_TYPE.SESSION_CREATED:
                this._onReceivedSessionCreated(data.id, this._deserializeMap(data.pieces));
                break;
            case MSG_TYPE.SESSION_STATE:
                this._onReceivedSessionState(data.current, data.peers, this._deserializeMap(data.pieces));
                break;
            case MSG_TYPE.SESSION_DESTROYED:
                this._onReceivedSessionDestroyed();
                break;
            case MSG_TYPE.UPDATE_STATE:
                this._onReceivedUpdateState(data.peer, data.state);
                break;
        }
    }

    /**
     * @param {[Number, Number][]} [pieces]
     * @returns {Map<Number, Number>}
     */
    _deserializeMap(pieces) {
        return pieces && new Map(pieces);
    }

    /**
     * 
     * @param {String} sessionId
     * @param {Map<Number, Number>} pieces
     */
    _onReceivedSessionCreated(sessionId, pieces) {
        window.location.hash = sessionId;

        this._controller.init(pieces);
    }

    /**
     * 
     * @param {String} currentPeer 
     * @param {String[]} allPeers 
     * @param {Map<Number, Number>} [pieces]
     */
    _onReceivedSessionState(currentPeer, allPeers, pieces) {
        // it will be sent only once on the first MSG_TYPE.SESSION_JOIN request
        if (pieces) {
            this._controller.init(pieces);
        }

        const others = allPeers.filter(id => currentPeer !== id);

        // add all newly connected peers and draw a Tetris for them
        others.forEach(peer => {
            if (!this._peers.has(peer)) {
                this._peers.set(peer, this._controller.createTetris());
            }
        });

        // remove disconnected ones
        this._peers.forEach((tetris, peer) => {
            // this current tetris/peer is not in the latest session/room state
            // so remove it
            if (-1 === others.indexOf(peer)) {
                this._peers.delete(peer);
                this._controller.removeTetris(tetris);
            }
        });
    }

    _onReceivedSessionDestroyed() {
        this._controller.destroy();
    }

    /**
     * 
     * @param {String} peer 
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state 
     */
    _onReceivedUpdateState(peer, state) {
        if (peer) {
            const tetris = this._peers.get(peer);
            if (tetris) {
                // send the update state to the specific tetris
                tetris.update(state);
            } else {
                debug.warn(`No tetris found for peer ${peer}`);
                return;
            }
        } else {
            debug.warn('Illegal update-state message for unspecified peer');
            return;
        }

        // check if local tetris has ended then if all tetrises are ended and show winner(s)
        this._checkEnded(state);
    }

    /**
     * 
     * @param {String} type 
     * @param {Object} data 
     */
    _send(type, data) {
        debug.log('Message send', type, ' ', data);
        const msg = { type };
        if (data) {
            msg.data = data;
        }
        this._conn.send(JSON.stringify(msg));
    }

    /**
     * 
     * @param {Object} data 
     */
    _checkEnded(state) {
        // check if all tetrises are finally ended
        if (state.ended) {
            const all = [...this._peers.values(), this._controller.tetris];
            if (all.every(tetris => tetris.getEnded())) {
                const winners = all.reduce((acc, tetris) => {
                    if (acc.length) {
                        const winnersScore = acc[0].getScore();
                        const score = tetris.getScore();
                        if (score > winnersScore) {
                            // this is the new winner
                            acc = [tetris];
                        } else if (score === winnersScore) {
                            //this is also a winner
                            acc.push(tetris);
                        }
                    } else {
                        // this is the first - assume it's a winner 
                        acc.push(tetris);
                    }

                    return acc;
                }, []);
                this._controller.winTetris(winners);
            }
        }
    }

}
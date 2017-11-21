const isLOG = true;
function log() {
    if (isLOG) {
        // eslint-disable-next-line
        console.log(...arguments);
    }
}

function warn() {
    // eslint-disable-next-line
    console.log(...arguments);
}

export const MSG_TYPE = {
    SESSION_CREATE: 'session-create',
    SESSION_CREATED: 'session-created',
    SESSION_JOIN: 'session-join',
    SESSION_STATE: 'session-state',
    SESSION_DESTROYED: 'session-destroyed',

    UPDATE_STATE: 'update-state',
};

// TODO: Merge the TetrisManager and the 'controller', TetrisManager to be som-kind of controller,
// not just GUI manager

export default class ConnectionManager {

    /**
     * 
     * @param {{init: Function, destroy: Function}} controller 
     * @param {TetrisManager} tetrisManager 
     */
    constructor(controller, tetrisManager) {
        this._controller = controller;
        this._tetrisManager = tetrisManager;
        this._conn = null;

        this._peers = new Map();
    }

    connect(address) {
        this._conn = new WebSocket(address);

        this._conn.addEventListener('open', () => {
            log('Connection established');

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
            this.send(MSG_TYPE.SESSION_JOIN, { id: sessionId });
            this._controller.init();
        } else {
            // create new room/session
            this.send(MSG_TYPE.SESSION_CREATE);
        }
    }

    /**
     * 
     * @param {String} type 
     * @param {Object} data 
     */
    _onReceived(type, data) {
        log('Message received', type, ' ', data);

        switch (type) {
            case MSG_TYPE.SESSION_CREATED:
                this._onReceivedSessionCreated(data.id);
                break;
            case MSG_TYPE.SESSION_STATE:
                this._onReceivedSessionState(data.current, data.peers);
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
     * 
     * @param {String} sessionId 
     */
    _onReceivedSessionCreated(sessionId) {
        window.location.hash = sessionId;

        this._controller.init();
    }

    /**
     * 
     * @param {String} currentPeer 
     * @param {String[]} allPeers 
     */
    _onReceivedSessionState(currentPeer, allPeers) {
        const others = allPeers.filter(id => currentPeer !== id);

        // add all newly connected peers and draw a Tetris for them
        others.forEach(peer => {
            if (!this._peers.has(peer)) {
                this._peers.set(peer, this._tetrisManager.create());
            }
        });

        // remove disconnected ones
        this._peers.forEach((tetris, peer) => {
            // this current tetris/peer is not in the latest session/room state
            // so remove it
            if (-1 === others.indexOf(peer)) {
                this._peers.delete(peer);
                this._tetrisManager.remove(tetris);
            }
        });
    }

    _onReceivedSessionDestroyed() {
        this._controller.destroy();
        this._tetrisManager.destroy();
    }

    /**
     * 
     * @param {String} peer 
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state 
     */
    _onReceivedUpdateState(peer, state) {
        const { ended } = state;
        if (peer) {
            const tetris = this._peers.get(peer);
            if (tetris) {
                // send the update state to the specific tetris
                tetris.update(state);
            } else {
                warn(`No tetris found for peer ${peer}`);
                return;
            }
        } else {
            // this means that the message is for this current peer
            // Note it should be only with the server-time ended property set
            if (ended) {
                // TODO: set owner's end time
            } else {
                warn('Illegal update-state message for the current owner');
                return;
            }
        }

        if (ended) {
            // TODO: check if all tetrises are finally ended
        }
    }

    /**
     * 
     * @param {String} type 
     * @param {Object} data 
     */
    send(type, data) {
        log('Message send', type, ' ', data);
        const msg = { type };
        if (data) {
            msg.data = data;
        }
        this._conn.send(JSON.stringify(msg));
    }

}
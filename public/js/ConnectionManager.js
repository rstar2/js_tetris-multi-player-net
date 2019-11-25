/**
 * @typedef { import("./Controller").default } Controller
 */

import * as debug from "./debug.js";

export const MSG_TYPE = {
    SESSION_CREATE: "session-create",
    SESSION_CREATED: "session-created",
    SESSION_JOIN: "session-join",
    SESSION_STATE: "session-state",
    SESSION_DESTROYED: "session-destroyed",

    UPDATE_STATE: "update-state"
};

export default class ConnectionManager {

    /**
     * 
     * @param {Controller} controller 
     */
    constructor(controller) {
        this._controller = controller;
        this._conn = null;
    }

    /**
     * @param {String} address
     * @param {String} [sessionId]
     */
    connect(address, sessionId) {
        this._conn = new WebSocket(address);

        this._conn.addEventListener("open", () => {
            debug.log("Connection established");

            if (sessionId) {
                // join a session/game
                this._send(MSG_TYPE.SESSION_JOIN, { id: sessionId });
            } else {
                // create new session/game
                this._send(MSG_TYPE.SESSION_CREATE);
            }
        });

        this._conn.addEventListener("message", event => {
            const { type, data } = JSON.parse(event.data);
            this._onReceived(type, data);
        });
    }

    disconnect() {
        // close the WebSocket connection
        if (this._conn) {
            this._conn.close();
        }
    }

    /**
     * Send update for the game - only the creator can do this
     * @param {Number} state 
     */
    sendGameUpdate(state) {
        this._send(MSG_TYPE.SESSION_STATE, {state});
    }

    /**
     * Send update for the current player/peer
     * @param {Object} state 
     */
    sendPeerUpdate(state) {
        this._send(MSG_TYPE.UPDATE_STATE, state);
    }


    /**
     * @param {String} type 
     * @param {Object} data 
     */
    _onReceived(type, data) {
        debug.log("Message received", type, " ", data);

        switch (type) {
            case MSG_TYPE.SESSION_CREATED:
                this._onReceivedSessionCreated(data);
                break;
            case MSG_TYPE.SESSION_STATE:
                this._onReceivedSessionState(data);
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
     * @param {String} id
     * @param {String} client
     * @param {Map<Number, Number>} pieces
     */
    _onReceivedSessionCreated({id: sessionId, pieces}) {
        // we are the creator
        this._controller.init(deserializeMap(pieces), true , sessionId);
    }

    /**
     * @param {String} [creatorPeer] creator client (that one that created the game/session)
     * @param {String} [currentPeer] current client
     * @param {String[]} [allPeers] all clients, including current
     * @param {Map<Number, Number>} [pieces]
     * @param {Number} [state] current session/game state
     */
    _onReceivedSessionState({ creator: creatorPeer, current: currentPeer, peers: allPeers, pieces, state }) {
        // it will be sent only once on the first MSG_TYPE.SESSION_JOIN request
        if (pieces) {
            // we are NOT the creator
            this._controller.init(deserializeMap(pieces), false);
        }

        // update peers/players
        if (allPeers)
            this._controller.updateGamePlayers(allPeers, currentPeer, creatorPeer);

        // update current game's state
        if (state !== undefined)
            this._controller.updateGameState(state);
    }

    _onReceivedSessionDestroyed() {
        this._onReceivedSessionState()
        this._controller.destroy();
    }

    /**
     * @param {String} peer
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state
     */
    _onReceivedUpdateState(peer, state) {
        this._controller.updatePlayer(peer, state);
    }

    /**
   *
   * @param {String} type
   * @param {Object} data
   */
    _send(type, data) {
        debug.log("Message send", type, data);
        const msg = { type };
        if (data) {
            msg.data = data;
        }
        this._conn.send(JSON.stringify(msg));
    }

}

/**
 * @param {[Number, Number][]} [pieces]
 * @returns {Map<Number, Number>}
 */
function deserializeMap(pieces) {
    return pieces && new Map(pieces);
}

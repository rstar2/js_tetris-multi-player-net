/**
 * @typedef { import("./session") } Session
 */

const log = require('./debug').log;
const logError = require('./debug').error;

class Client {
    /**
     * 
     * @param {WebSocket} conn
     * @param {String} id 
     */
    constructor(conn, id) {
        this._conn = conn;
        this._id = id;
        this._session = null;
        this._isCreator  = false;
    }

    /**
     * @return {String}
     */
    get id() {
        return this._id;
    }

    /**
     * @return {Session}
     */
    get session() {
        if (!this._session) {
            throw new Error(`Cannot request session from a not-attached client ${this._id}`);
        }
        return this._session;
    }

    /**
     * @return {String}
     */
    get sessionId() {
        return this._session && this._session.id;
    }

    /**
     * @return {Boolean}
     */
    get isCreator() {
        return this._isCreator;
    }

    /**
     * @param {Session} session
     * @return {Boolean}
     */
    isAttachedTo(session) {
        if (session) {
            return this._session === session;
        }
        return !!this._session;
    }

    /**
     * @param {Session} session
     */
    attachTo(session, isCreator = false) {
        if (this._session) {
            throw new Error(`Session is already attached to client ${this._id}`);
        }
        this._session = session;
        this._isCreator = isCreator;
    }

    detach() {
        this._session = null;
    }

    close() {
        this._conn.close();
    }

    /**
     * 
     * @param {String} type 
     * @param {Object} data 
     */
    send(type, data) {
        log('Client', this._id, 'Send message', type, data);
        const msg = { type };
        if (data) {
            msg.data = data;
        }
        this._conn.send(JSON.stringify(msg), function ack(err) {
            if (err) {
                logError('Message failed', type, data);
            }
        });
    }

}

module.exports = Client;
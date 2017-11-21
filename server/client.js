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

    get id() {
        return this._id;
    }

    get session() {
        if (!this._session) {
            throw new Error(`Cannot request session from a not-attached client ${this._id}`);
        }
        return this._session;
    }

    get sessionId() {
        return this._session && this._session.id;
    }

    get isCreator() {
        return this._isCreator;
    }

    isAttachedTo(session) {
        if (session) {
            return this._session === session;
        }
        return !!this._session;
    }

    attachTo(session, isCreator = false) {
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
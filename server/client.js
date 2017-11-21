const log = require('./debug').log;

class Client {
    constructor(conn, id) {
        this._conn = conn;
        this._id = id;
        this._session = null;
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

    isAttachedTo(session) {
        if (session) {
            return this._session === session;
        }
        return !!this._session;
    }

    attachTo(session) {
        this._session = session;
    }

    detach() {
        this._session = null;
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
                console.error('Message failed', type, data);
            }
        });
    }

}

module.exports = Client;
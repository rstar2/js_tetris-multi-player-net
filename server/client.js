class Client {
    constructor(conn) {
        this._conn = conn;
        this._session = null;
    }

    get session() {
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

}

module.exports = Client;


class Session {
    constructor(id) {
        this._id = id;
        this._clients = new Set();
    }

    get id() {
        return this._id;
    }

    get isEmpty() {
        return this._clients.size === 0;
    }

    /**
     * 
     * @param {Client} client 
     */
    join(client) {
        if (client.isAttachedTo()) {
            throw new Error(`Client is already in a session ${client.sessionId}.`);
        }

        client.attachTo(this);

        this._clients.add(client);
    }

    leave(client) {
        if (!client.isAttachedTo(this)) {
            throw new Error(`Client is not attached to this session ${this._id}.`);
        }

        client.detach();

        this._clients.delete(client);
    }

}
Session.generateId = function (len = 6, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let id = '';
    while (len--) {
        id += chars[Math.random() * chars.length | 0];
    }

    return id;
};

module.exports = Session;
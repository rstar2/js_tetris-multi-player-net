class Session {
    constructor(id) {
        this._id = id;
        this._clients = new Set();
    }

    get id() {
        return this._id;
    }

    get size() {
        return this._clients.size;
    }

    get isEmpty() {
        return this.size === 0;
    }

    get clients() {
        return [...this._clients];
    }

    /**
     * 
     * @param {Client} client 
     * @param {Boolean} isCreator 
     */
    join(client, isCreator) {
        if (client.isAttachedTo()) {
            throw new Error(`Client is already in a session ${client.sessionId}.`);
        }

        client.attachTo(this, isCreator);

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

module.exports = Session;
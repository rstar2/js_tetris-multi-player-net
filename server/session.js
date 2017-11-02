class Session {
    constructor(id) {
        this._id = id;
    }

    get id() {
        return this._id;
    }
}

module.exports = Session;
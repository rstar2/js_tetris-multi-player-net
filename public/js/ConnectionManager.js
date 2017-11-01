export default class ConnectionManager {

    constructor() {
        this._connection = null;
    }

    connect(address) {
        this._connection = new WebSocket(address);
    }
}
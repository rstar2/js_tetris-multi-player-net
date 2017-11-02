export default class ConnectionManager {

    constructor() {
        this._conn = null;
    }

    connect(address) {
        this._conn = new WebSocket(address);

        this._conn.addEventListener('open', () => {
            console.log('Connection established');

            const msg = { type: 'session-create' };
            this._conn.send(JSON.stringify(msg));
        });
    }
}
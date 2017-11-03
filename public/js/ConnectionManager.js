
const isLOG = true;
function log() {
    if (isLOG) {
        console.log.apply(this, arguments);
    }
}

const MSG_TYPE = {
    SESSION_CREATE: 'session-create',
    SESSION_CREATED: 'session-created',

    SESSION_JOIN: 'session-join',
};

export default class ConnectionManager {

    constructor() {
        this._conn = null;
    }

    connect(address) {
        this._conn = new WebSocket(address);

        this._conn.addEventListener('open', () => {
            log('Connection established');

            this.initSession();
        });

        this._conn.addEventListener('message', event => {
            const { type, data } = JSON.parse(event.data);

            this.onReceived(type, data);
        });
    }

    initSession() {
        const sessionId = window.location.hash.split('#')[1];
        if (sessionId) {
            // join a room/session
            this.send(MSG_TYPE.SESSION_JOIN, { id: sessionId });
        } else {
            // create new room/session
            this.send(MSG_TYPE.SESSION_CREATE);
        }
    }

    /**
     * 
     * @param {String} type 
     * @param {Object} data 
     */
    onReceived(type, data) {
        log('Message received', type, ' ', data);

        switch (type) {
            case MSG_TYPE.SESSION_CREATED:
                window.location.hash = data.id;
                break;
        }
    }

    /**
     * 
     * @param {String} type 
     * @param {Object} data 
     */
    send(type, data) {
        log('Message send', type, ' ', data);
        const msg = { type };
        if (data) {
            msg.data = data;
        }
        this._conn.send(JSON.stringify(msg));
    }

}
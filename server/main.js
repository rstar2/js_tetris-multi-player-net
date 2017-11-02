const WebSocketServer = require('ws').Server;

const Client = require('./client.js');
const Session = require('./session.js');

const server = new WebSocketServer({ port: 9000 });

const isLOG = true;
function log() {
    if (isLOG) {
        console.log.apply(this, arguments);
    }
}

const MSG_TYPE = {
    SESSION_CREATE: 'session-create',
    SESSION_DESTROY: 'session-destroy',
};

const sessions = new Map();

server.on('connection', conn => {
    log('Connection established');

    const client = new Client(conn);

    conn.on('close', () => {
        log('Connection closed');
        const session = client.session;
        if (session) {
            session.leave(client);
            if (session.isEmpty) {
                log('Session destroyed ', session.id);
                sessions.delete(session.id);
            }
        }
    });

    conn.on('message', (event) => {
        const { type, data } = JSON.parse(event);
        log('Message received', type, data);

        switch (type) {
            case MSG_TYPE.SESSION_CREATE:
                onSessionCreate(client);
                break;
            case MSG_TYPE.SESSION_DESTROY:
                break;
        }

    });
});

/**
 * 
 * @param {Client} client 
 */
function onSessionCreate(client) {
    const id = Session.generateId();
    const session = new Session(id);
    sessions.set(session.id, session);
    log('Session created ', session.id);

    session.join(client);
}

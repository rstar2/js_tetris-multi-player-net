const WebSocketServer = require('ws').Server;

const Session = require('./session.js');

const server = new WebSocketServer({ port: 9000 });

const MSG_TYPE = {
    SESSION_CREATE: 'session-create',
    SESSION_DESTROY: 'session-destroy',
};

const sessions = new Map();

server.on('connection', conn => {
    console.log('Connection established');

    conn.on('close', () => {
        console.log('Connection closed');
    });

    conn.on('message', (event) => {
        const { type, data } = JSON.parse(event);
        console.log('Message received', type, data);

        switch (type) {
            case MSG_TYPE.SESSION_CREATE:
                onSessionCreate()
                break;
            case MSG_TYPE.SESSION_DESTROY:
                break;
        }

    });
});

function onSessionCreate() {
    const session = new Session('todo');
    sessions.set(session.id, session);
    console.log('Session created ', session.id);
}

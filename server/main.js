const WebSocketServer = require('ws').Server;

const Client = require('./client');
const Session = require('./session');
const generateId = require('./guid').generateId;
const log = require('./debug').log;

const server = new WebSocketServer({ port: 9000 });

const MSG_TYPE = {
    SESSION_CREATE: 'session-create',
    SESSION_CREATED: 'session-created',
    SESSION_JOIN: 'session-join',
    SESSION_STATE: 'session-state',

    UPDATE_STATE: 'update-state',
};

const sessions = new Map();

server.on('connection', conn => {
    const client = createClient(conn);

    conn.on('close', () => {
        log('Client disconnected', client.id);

        const session = client.session;
        if (session) {
            session.leave(client);
            if (session.isEmpty) {
                log('Session destroyed ', session.id);
                sessions.delete(session.id);
            }

            // broadcast the current room's/session's state
            broadcastSessionState(session);
        }
    });

    conn.on('message', event => {
        const { type, data } = JSON.parse(event);
        log('Message received', type, data);

        // handle special messages first
        switch (type) {
            case MSG_TYPE.SESSION_CREATE:
                onSessionCreate(client);
                break;
            case MSG_TYPE.SESSION_JOIN:
                onSessionJoin(client, data.id);
                break;
            case MSG_TYPE.UPDATE_STATE:
                onUpdateState(client, data);
                break;
        }

    });
});

/**
 * @param {WebSocket} conn
 * @param {String} id
 * @returns {Client}
 */
function createClient(conn, id = generateId()) {
    const client = new Client(conn, id);
    log('Client connected', client.id);

    return client;
}

/**
 * 
 * @param {String} id
 * @returns {Session}
 */
function createSession(id = generateId()) {
    if (getSession(id)) {
        throw new Error(`Session with id ${id} already exists.`);
    }

    const session = new Session(id);
    sessions.set(session.id, session);
    log('Session created ', session.id);

    return session;
}

/**
 * @param {String} id
 * @param {Boolean} createIfNotExists
 * @returns {Session|null} 
 */
function getSession(id, createIfNotExists = false) {
    let session = sessions.get(id);
    if (!session && true === createIfNotExists) {
        session = createSession(id);
    }

    return session;
}

/**
 * 
 * @param {Client} client 
 * @param {String} type 
 * @param {Object} [data] 
 */
function broadcastMessage(client, type, data) {
    if (!client.isAttachedTo()) {
        throw new Error(`Client ${client} is not in a session in order to broadcast messages `)
    }
    const session = client.session;
    session.clients.filter(aClient => aClient !== client).
        forEach(aClient => {
            aClient.send(type, {
                ...data,
                peer: client.id
            });
        });
}

/**
 * 
 * @param {Session} session 
 */
function broadcastSessionState(session) {
    const clients = session.clients;

    clients.forEach(client => {
        client.send(MSG_TYPE.SESSION_STATE, {
            current: client.id,
            peers: clients.map(client => client.id)
        });
    });
}

/**
 * 
 * @param {Client} client 
 */
function onSessionCreate(client) {
    const session = createSession();
    session.join(client);
    client.send(MSG_TYPE.SESSION_CREATED, { id: session.id });
}

/**
 * 
 * @param {Client} client 
 */
function onSessionJoin(client, sessionId) {
    const session = getSession(sessionId, true);
    session.join(client);
    log('Session joined ', session.id, session.size);

    // broadcast the current room's/session's state
    broadcastSessionState(session);
}

/**
 * 
 * @param {Client} client 
 * @param {Object} state 
 */
function onUpdateState(client, state) {
    log('Update state for client ', client.id);

    // broadcast the current client's state to all other clients of the session
    broadcastMessage(client, MSG_TYPE.UPDATE_STATE, {state});
}

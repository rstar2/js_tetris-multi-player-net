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
    SESSION_DESTROYED: 'session-destroyed',

    UPDATE_STATE: 'update-state',
};

const sessions = new Map();

server.on('connection', conn => {
    let client = createClient(conn);

    conn.on('close', () => {
        log('Client disconnected', client.id);

        const session = client.session;
        if (session) {
            session.leave(client);

            if (session.isEmpty) {
                log('Session destroyed', session.id);
                sessions.delete(session.id);
            }

            if (client.isCreator) {
                log('Session creator has disconnected', client.id);
                // notify all remaining clients
                broadcastSessionDestroy(session);
                // destroy current session - close remaining clients clients connections also
                // this will in turn  will
                session.clients.forEach(client => client.close());
            }

            if (!client.isCreator) {
                // broadcast the current room's/session's state
                broadcastSessionState(session);
            }
        }
        // clear the reference to the client so that it can be garbage-collected
        client = null;
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
 * @returns {Session|null} 
 */
function getSession(id) {
    return sessions.get(id);
}

/**
 * 
 * @param {Client} client 
 * @param {String} type 
 * @param {Object} [data] 
 */
function broadcastMessageToOthers(client, type, data) {
    if (!client.isAttachedTo()) {
        throw new Error(`Client ${client} is not in a session in order to broadcast messages`);
    }
    const session = client.session;
    session.clients.filter(aClient => aClient !== client).
        forEach(aClient => aClient.send(type, data));
}

/**
 * 
 * @param {Session} session 
 * @param {Client} clientJoined the newly joined client to whom to send the 'pieces' 
 */
function broadcastSessionState(session, clientJoined) {
    const clients = session.clients;
    const clientCreator = clients.find(client => client.isCreator);

    // if the client created the session is missing (e.g. disconnected)
    // the the session is in "disconnecting" state - disconnecting all its clients
    // so no need to send any state event
    if (!clientCreator) {
        return;
    }

    const peers = clients.map(client => client.id);

    clients.forEach(client => {
        const data = {
            current: client.id,
            creator: clientCreator.id,
            peers
        };
        if (client === clientJoined) {
            data.pieces = serializeMap(session.pieces);
        }
        client.send(MSG_TYPE.SESSION_STATE, data);
    });
}

/**
 * 
 * @param {Session} session 
 */
function broadcastSessionDestroy(session) {
    session.clients.forEach(client => client.send(MSG_TYPE.SESSION_DESTROYED));
}

/**
 * @param {Map<Number, Number} map
 * @return {[Number, Number][]}
 */
function serializeMap(map) {
    // note here I serialize the Map<Number, Number> to [Number, Number][] with "entries = [...map]",
    // that later could be deserialize with: "map = new Map(entries)""
    return [...map];
}

/**
 * 
 * @param {Client} client 
 */
function onSessionCreate(client) {
    const session = createSession();
    session.join(client, true);
    client.send(MSG_TYPE.SESSION_CREATED, { id: session.id, pieces: serializeMap(session.pieces) });
}

/**
 * 
 * @param {Client} client 
 */
function onSessionJoin(client, sessionId) {
    let createdNow = false;
    let session = getSession(sessionId);
    if (!session) {
        session = createSession(sessionId);
        createdNow = true;
    }
    session.join(client, createdNow);
    log('Session joined', session.id, session.size);

    // broadcast the current room's/session's state
    broadcastSessionState(session, client);
}

/**
 * 
 * @param {Client} client 
 * @param {Object} state 
 */
function onUpdateState(client, state) {
    log('Update state for client', client.id);

    // broadcast the current client's state to all other clients of the session
    broadcastMessageToOthers(client, MSG_TYPE.UPDATE_STATE, { state, peer: client.id });
}

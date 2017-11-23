const logWarn = require('./debug').warn;

// get this from client
const PIECES_POOL_SIZE = 7;

class Session {
    constructor(id) {
        this._id = id;
        this._clients = new Set();

        this._gamePieces = null;
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
     * @returns {Map<Number, Number>}
     */
    get pieces() {
        return this._gamePieces;
    }

    /**
     * 
     * @param {Client} client 
     * @param {Boolean} isCreator 
     */
    join(client, isCreator = false) {
        if (client.isAttachedTo()) {
            throw new Error(`Client is already in a session ${client.sessionId}.`);
        }

        if (isCreator) {
            this.startGame();
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
        return this._gamePieces;
    }

    startGame() {
        if (this._gamePieces) {
            logWarn('Game is already started');
            return;
        }

        this._gamePieces = new Map();
        // generate the whole - let's say 1000 pieces
        for (let i = 0; i < 1000; i++) {
            this._gamePieces.set(i, Math.floor(Math.random() * PIECES_POOL_SIZE));
        }

        // TODO: don't generate the whole but on batches
        //this._gamePiecesSeq = 0;

        // // if someone requests a new piece - then generate it
        // if (piecesCount < tetrisPieceCount) {
        //     // note it should be always create with 1 maximum - e.g. next, no some that is far away in time
        //     if (piecesCount + 1 !== tetrisPieceCount)
        //         throw new Error(`Cannot request a piece with count ${tetrisPieceCount}`);

        //     index = ;
        //     piecesQueue.set(tetrisPieceCount, { index, notified: 1 });
        //     piecesCount = tetrisPieceCount;
        // } else {
        //     const item = piecesQueue.get(tetrisPieceCount);
        //     if (!item) {
        //         throw new Error(`Cannot find a piece with count ${tetrisPieceCount} - it must be expired`);
        //     }

        //     // get the same saved index from the item
        //     index = item.index;
        //     item.notified++;

        //     // if all tetrises are notified then discard the item in the map
        //     if (item.notified === tetrises.length) {
        //         piecesQueue.delete(tetrisPieceCount);
        //     }
        // }
    }

    endGame() {
        if (!this._gamePieces) {
            logWarn('Game is already ended');
            return;
        }
        this._gamePieces = null;
    }

    // getGamePiece(client, pieceSeq) {

    // }

}

module.exports = Session;
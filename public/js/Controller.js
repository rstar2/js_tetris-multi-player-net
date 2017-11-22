import { PIECES } from './pieces.js';
import * as matrix from './matrix.js';
import TetrisManager from './TetrisManager.js';
import ConnectionManager, { MSG_TYPE } from './ConnectionManager.js';

export default class Controller {
    /**
     * @param {HTMLElement} template 
     * @param {HTMLElement} container 
     * @param {String} wsAddress
     */
    constructor(template, container, wsAddress) {
        this._tetrisManager = new TetrisManager(template, container);
        // create the current local tetris
        this._tetrisLocal = this._tetrisManager.create(this);

        this._connManager = new ConnectionManager(this);
        this._connManager.connect(wsAddress);
    }

    /**
     * @returns {Tetris}
     */
    get tetris() {
        return this._tetrisLocal;
    }

    /**
     * @returns {Tetris}
     */
    createTetris() {
        return this._tetrisManager.create();
    }

    /**
     * 
     * @param {Tetris} tetris 
     */
    removeTetris(tetris) {
        this._tetrisManager.remove(tetris);
    }

    /**
     * 
     * @param {Tetris[]} tetrises
     */
    winTetris(tetrises) {
        this._tetrisManager.winners(tetrises);
    }

    init() {
        this._tetrisLocal.reset();
        this._tetrisLocal.start();
    }

    destroy() {
        this._tetrisLocal.stop();
    }

    getPiece(pieceCount) {
        // generate a new random piece for each tetris
        const index = Math.floor(Math.random() * PIECES.length);
        return matrix.clone(PIECES[index]);
    }

    sendUpdate(state) {
        // send local tetris last updated state
        this._connManager.send(MSG_TYPE.UPDATE_STATE, state);
    }
}
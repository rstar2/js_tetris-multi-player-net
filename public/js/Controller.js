import TetrisManager from './TetrisManager.js';
import ConnectionManager from './ConnectionManager.js';

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

    /**
     * 
     * @param {Map} pieces
     */
    init(pieces) {
        this._tetrisLocal.reset(pieces);
        this._tetrisLocal.start();
    }

    destroy() {
        this._tetrisLocal.stop();
    }

    sendUpdate(state) {
        // send local tetris last updated state
        this._connManager.sendUpdate(state);
    }
}
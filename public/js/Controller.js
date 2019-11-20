/**
 * @typedef { import("./Tetris").default } Tetris
 */

import TetrisManager from './TetrisManager.js';
import ConnectionManager from './ConnectionManager.js';

export default class Controller {
    /**
     * @param {HTMLElement} template 
     * @param {HTMLElement} container 
     * @param {HTMLElement} stateButton 
     * @param {String} wsAddress
     */
    constructor(template, container, stateButton, wsAddress) {
        this._tetrisManager = new TetrisManager(template, container);
        // create the current local tetris
        this._tetrisLocal = this._tetrisManager.create(this);


        this._stateButton = stateButton;
        this._stateButton.addEventListener('click', this._changeState.bind(this));

        this._connManager = new ConnectionManager(this);
        this._connManager.connect(wsAddress);

        this._state = null;
        this._setState(STATE.INIT);
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
        // this._tetrisLocal.start();
    }

    destroy() {
        this._tetrisLocal.stop();
    }

    sendUpdate(state) {
        // send local tetris last updated state
        this._connManager.sendUpdate(state);
    }

    _changeState() {
        let newState;
        switch (this._state) {
            case STATE.INIT:
            case STATE.STOPPED:
            case STATE.PAUSED:
                newState = STATE.STARTED;
                break;
            case STATE.STARTED:
                newState = STATE.PAUSED;
                break;
        }
        this._setState(newState);
    }

    _setState(newState) {
        if (this._state === newState) {
            return;
        }

        let text;
        switch (newState) {
            case STATE.INIT:
                text = 'Start';
                this._tetrisLocal.reset();
                break;
            case STATE.STARTED:
                text = 'Pause';
                // this depends on the current state
                switch (this._state) {
                    case STATE.INIT:
                        this._tetrisLocal.start();
                        break;
                    case STATE.STOPPED:
                        reset();
                        timer.start();
                        break;
                    case STATE.PAUSED:
                        timer.unpause();
                        break;

                }
                break;
            case STATE.PAUSED:
                text = 'Unpause';
                this._tetrisLocal.stop();
                break;
            case STATE.STOPPED:
                text = 'Start';
                this._tetrisLocal.stop();
                break;
        }

        this._state = newState;
        this._stateButton.innerText = text;
    }
}

const STATE = {
    INIT: Symbol(),
    STARTED: Symbol(),
    PAUSED: Symbol(),
    STOPPED: Symbol(),
};
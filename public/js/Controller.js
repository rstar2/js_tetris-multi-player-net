/**
 * @typedef { import("./Tetris").default } Tetris
 */

import TetrisManager from './TetrisManager.js';
import ConnectionManager from './ConnectionManager.js';

import * as debug from "./debug.js";

const STATE = {
    INIT: Symbol(),
    CONNECTED: Symbol(),
    STARTED: Symbol(),
    PAUSED: Symbol(),
    STOPPED: Symbol(),
};

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
        this._isCreator = false;

        this._stateButton = stateButton;
        this._stateButton.addEventListener('click', this._changeGameState.bind(this));

        this._connManager = new ConnectionManager(this);
        // connect to a game - create a new one or join an existing
        this._connManager.connect(wsAddress, window.location.hash.split("#")[1]);

        this._players = new Map();

        this._state = null;
        this._setGameState(STATE.INIT);
    }

    /**
     * 
     * @param {Map} pieces
     * @param {Boolean} isCreator
     * @param {String} [sessionId]
     */
    init(pieces, isCreator, sessionId) {
        if (sessionId) {
        // update the window location's hash
            window.location.hash = sessionId;
        }

        this._isCreator = isCreator;
        this._tetrisLocal.reset(pieces);
    }

    destroy() {
        this._players = [];
        this._connManager.disconnect();
        this._tetrisLocal.stop();
    }

    /**
     * @param {String[]} allPlayers all clients/players, including current
     * @param {String} currentPlayer current client
     */
    updatePlayers(allPlayers, currentPlayer) {
        // add all newly connected players and draw a Tetris for them
        allPlayers.forEach(player => {
            if (player === currentPlayer) return;

            // add new
            if (!this._players.has(player)) {
                this._players.set(player, this._tetrisManager.create());
            }
        });

        // remove disconnected ones
        this._players.forEach((tetris, player) => {
            // this current client/player is not in the latest session/game state so remove it
            if (-1 === allPlayers.indexOf(player)) {
                this._players.delete(player);
                this._tetrisManager.remove(tetris);
            }
        });
    }

    /**
     * @param {String} player
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state
     */
    updatePlayer(player, state) {
        const tetris = this._players.get(player);
        if (!tetris) {
            debug.warn(`No tetris found for player ${player}`);
            return;
        }

        // send the update state to the specific tetris
        tetris.update(state);
        // check if local tetris has ended then if all tetrises are ended and show winner(s)
        this._checkEnded(state);
    }

    /**
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state
     */
    sendUpdate(state) {
        // check if local tetris has ended then if all tetrises are ended and show winner(s)
        this._checkGameEnded(state);
        
        // send local tetris last updated state
        this._connManager.sendUpdate(state);
    }

    _changeGameState() {
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
        this._setGameState(newState);
    }

    _setGameState(newState) {
        if (this._state === newState) {
            return;
        }

        let text;
        switch (newState) {
            case STATE.INIT:
                text = 'Waiting';
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

    /**
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state
     */
    _checkGameEnded(state) {
        // check if all tetrises are finally ended
        if (state.ended) {
            const all = [...this._players.values(), this._tetrisLocal];
            if (all.every(tetris => tetris.getEnded())) {
                const winners = all.reduce((acc, tetris) => {
                    if (acc.length) {
                        const winnersScore = acc[0].getScore();
                        const score = tetris.getScore();
                        if (score > winnersScore) {
                            // this is the new winner
                            acc = [tetris];
                        } else if (score === winnersScore) {
                            // this is also a winner
                            acc.push(tetris);
                        }
                    } else {
                        // this is the first - assume it's a winner
                        acc.push(tetris);
                    }

                    return acc;
                }, []);

                this._tetrisManager.winners(winners);
            }
        }
    }

}
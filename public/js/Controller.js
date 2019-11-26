/**
 * @typedef { import("./Tetris").default } Tetris
 */

import TetrisManager from "./TetrisManager.js";
import ConnectionManager from "./ConnectionManager.js";

import * as debug from "./debug.js";

const STATE = {
    INIT: Symbol("INIT"),
    CONNECTED: Symbol("CONNECTED"),
    STARTED: Symbol("STARTED"),
    PAUSED: Symbol("PAUSED"),
    ENDED: Symbol("ENDED")
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
        this._stateButton.addEventListener(
            "click",
            this._changeGameState.bind(this)
        );

        this._connManager = new ConnectionManager(this);
        // connect to a game - create a new one or join an existing
        this._connManager.connect(wsAddress, window.location.hash.split("#")[1]);

        /**
         * @type {Map<String, Tetris>}
         */
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
        this._tetrisLocal.setCreator(isCreator);

        // disable the button if we are not the "creator"
        if (!this._isCreator) {
            this._stateButton.setAttribute("disabled", "");
            this._stateButton.classList.add("disabled");
        }
    }

    destroy() {
        this._players = [];
        this._connManager.disconnect();
        this._tetrisLocal.stop();
    }

    /**
     * @param {String} state
     */
    updateGameState(state) {
        // TODO: validate the new state according to the current
        this._setGameState(state);
    }

    /**
     * @param {String[]} allPlayers all clients/players, including current
     * @param {String} currentPlayer current client
     * @param {String} creatorPeer creator client
     */
    updateGamePlayers(allPlayers, currentPlayer, creatorPeer) {
        // add all newly connected players and draw a Tetris for them
        allPlayers.forEach(player => {
            if (player === currentPlayer) return;

            // add new
            if (!this._players.has(player)) {
                const tetris = this._tetrisManager.create();
                if (player === creatorPeer) tetris.setCreator(true);
                this._players.set(player, tetris);

                // send it the pieces and initial piece state (don't wait for the server to do it)
                tetris.update(this._tetrisLocal.getFirstPiece());
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

        if (this._players.size) {
            this._setGameState(STATE.CONNECTED);
        } else {
            // looks like the creator is left alone
            // TODO: if started then reset the game
            this._setGameState(STATE.INIT);
        }
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

        // send the update state to the specific player's tetris
        tetris.update(state);

        // check if local tetris has ended then if all tetrises are ended and show winner(s)
        this._checkGameEnded(state.ended);
    }

    /**
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state
     */
    sendPlayerUpdate(state) {
        // don't send updates when game is still not started (this actually can happen on the first piece only)
        if (this._state !== STATE.STARTED) return;

        // send local tetris last updated state
        this._connManager.sendPeerUpdate(state);

        // check if local tetris has ended then if all tetrises are ended and show winner(s)
        this._checkGameEnded(state.ended);
    }

    _changeGameState() {
        // whether or not to send the new state to the server
        // and it to be broadcasted to all (including current)
        // or to update the state immediately
        let toSendGameState = true;
        let newState;
        switch (this._state) {
            case STATE.CONNECTED:
            case STATE.PAUSED:
                newState = STATE.STARTED;
                break;
            case STATE.STARTED:
                newState = STATE.PAUSED;
                break;
            case STATE.ENDED:
                newState = STATE.INIT;
                toSendGameState = false;
                break;
            default:
                // do nothing on other cases
                return;
        }
        if (toSendGameState) {
            this._connManager.sendGameUpdate(newState);
        } else {
            this._setGameState(newState);
        }
    }

    _setGameState(newState) {
        if (this._state === newState) {
            return;
        }

        let text;
        switch (newState) {
            case STATE.INIT:
                text = "Waiting";

                // send request for new game
                // this._connManager.reconnect();
                break;
            case STATE.CONNECTED:
                text = "Start";
                break;
            case STATE.STARTED:
                text = "Pause";
                this._tetrisLocal.start();
                break;
            case STATE.PAUSED:
                text = "Unpause";
                this._tetrisLocal.stop();
                break;
            case STATE.ENDED:
                text = "Connect";
                break;
        }

        this._state = newState;
        this._stateButton.innerText = text;
    }

    /**
     * @param {Boolean} ended
     */
    _checkGameEnded(ended) {
        // check if all tetrises are finally ended
        if (ended) {
            const all = [...this._players.values(), this._tetrisLocal];
            if (all.every(tetris => tetris.isEnded())) {
                const winners = all.reduce((acc, tetris) => {
                    if (acc.length) {
                        const winnersScore = acc[0].getScore();
                        const score = tetris.getScore();
                        if (score === winnersScore) {
                            // this is also a winner
                            acc.push(tetris);
                        } else if (score > winnersScore) {
                            // this is the new winner
                            acc = [tetris];
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

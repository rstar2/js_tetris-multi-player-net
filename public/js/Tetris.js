/**
 * @typedef { import("./Controller").default } Controller
 */


import { PIECES } from './pieces.js';
import * as matrix from './matrix.js';
import Player from './Player.js';
import Timer from './Timer.js';

const STATE = {
    INIT: Symbol('INIT'),
    STARTED: Symbol('STARTED'),
    ENDED: Symbol('ENDED'),
};


let count = 0;
export default class Tetris {

    /**
     * 
     * @param {Controller} controller
     * @param {HTMLElement} score
     * @param {HTMLCanvasElement} canvas
     * @param {Number} arenaW
     * @param {Number} arenaH
     * @param {Number} scale
     */
    constructor(controller, score, canvas, arenaW, arenaH, scale,) {
        this._controller = controller;
        this._canvas = canvas;
        this._context = canvas.getContext('2d');

        this._canvas.width = arenaW * scale;
        this._canvas.height = arenaH * scale;
        this._context.scale(scale, scale);

        this._score = score;

        this._id = ++count;

        // if this is "local" tetris
        if (controller) {
            document.addEventListener('keydown', this._handleKeydown.bind(this, [37, 39, 219, 221, 40]));

            this._timer = new Timer({ update: this._drop.bind(this), render: this._render.bind(this) }, 1, false);
        }

        this._arena = matrix.create(arenaW, arenaH);
        this._player = new Player(arenaW / 2);

        // dynamic members
        this._state = STATE.INIT;
        this._skipNextNotForced = false;
        this._pieceSeq = 0;
        this._pieceQueue = new Map;
    }

    /**
     * @return {String}
     */
    getId() {
        return this._id;
    }

    /**
     * @return {Number}
     */
    getScore() {
        return this._player.score;
    }

    /**
     * @return {Boolean}
     */
    isEnded() {
        return this._state === STATE.ENDED;
    }

    /**
     * @param {Boolean} isCreator 
     */
    setCreator(isCreator) {
        if (isCreator)
            this._canvas.classList.add('creator');
        else
            this._canvas.classList.remove('creator');
    }

    /**
     * Called only for local/current player/tetris
     */
    start() {
        this._state = STATE.STARTED;
        this._timer.start();
    }

    /**
     * Called only for local/current player/tetris
     */
    stop() {
        this._state = STATE.ENDED;
        this._timer.stop();
    }

    /**
     * Called only for local/current player/tetris
     * @param {Map} pieces
     */
    reset(pieces) {
        this.stop();

        // reset initial members
        this._state = STATE.INIT;
        this._skipNextNotForced = false;
        this._pieceSeq = 0;
        this._pieceQueue = pieces;

        // reset the arena
        matrix.reset(this._arena);

        // reset player's score
        this._player.resetScore();

        this._controller.sendPlayerUpdate({
            arena: this._arena,
            score: this.getScore()
        });

        // generate a new piece
        this._generatePiece();
        // render all till now 
        this._render();
        this._renderScore();
    }

    /**
     * Called only for remote/other players/tetrises
     * @param {{ arena? : Number[][], piece? : Number[][], score? : Number, ended?: Date}} state 
     */
    update({ arena, piece, pos, score, ended }) {
        if (ended) {
            this._state = STATE.ENDED;
        }

        let updated = this._player.update({ piece, pos, score });
        
        if (arena) {
            updated = true;
            this._arena = arena;
        }

        if (updated) {
            this._render();
        }

        if (score) {
            this._renderScore();
        }
    }

    /**
     * Called only for remote/other players/tetrises
     * @return {{piece: Number[][], pos: Number}}
     */
    getFirstPiece() {
        return {
            piece: this._player.piece,
            pos: this._player.pos
        };
    }

    _render() {
        this._context.fillStyle = 'black';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

        // render the arena (all fallen pieces)
        matrix.render(this._arena, this._context);

        // render the player (current falling piece)
        if (this._player.piece)
            matrix.render(this._player.piece, this._context, this._player.color, this._player.pos);
    }

    _drop(isForced) {
        // when forced 'drop' from the key-event-listener then skip the next normal one
        // in order not to get an additional drop right after
        if (isForced) {
            this._skipNextNotForced = true;
        } else if (this._skipNextNotForced) {
            this._skipNextNotForced = false;
        }

        // make drop
        this._player.drop(1);

        // check for bottom reached or collision
        if (matrix.isCollide(this._arena, this._player)) {
            // if yes - then revert the last "collision drop"
            this._player.drop(-1);

            // merge the piece with the arena
            matrix.merge(this._arena, this._player);

            // check for Tetris, e.g. clear full lines and increase points
            const score = matrix.clearFull(this._arena);
            if (score) {
                this._player.addScore(score);
                this._renderScore();

                this._controller.sendPlayerUpdate({ score: this.getScore() });
            }

            this._controller.sendPlayerUpdate({ arena: this._arena });

            // generate a new piece for the player - it will be also started from the top
            this._generatePiece();

            // check for Game Over - just check if right after a new piece there's a collision
            if (matrix.isCollide(this._arena, this._player)) {
                this.stop();
                // notify the controller that this player-tetris 'ended' (though it may still not have lost)
                this._controller.sendPlayerUpdate({ ended: true });
                this._render();
            }
        } else {
            this._controller.sendPlayerUpdate({ pos: this._player.pos });
        }
    }

    _generatePiece() {
        const nextPieceIndex = this._pieceQueue.get(this._pieceSeq);
        const nextPiece = matrix.clone(PIECES[nextPieceIndex]);

        this._player.resetWith(nextPiece, 'red');

        this._pieceSeq++;
        this._controller.sendPlayerUpdate({
            piece: this._player.piece,
            pos: this._player.pos
        });
    }

    _move(isLeft) {
        this._player.move(isLeft ? -1 : 1);
        if (matrix.isCollide(this._arena, this._player)) {
            // reached the left/right borders
            this._player.move(isLeft ? 1 : -1);
            return;
        }

        this._controller.sendPlayerUpdate({ pos: this._player.pos });
    }

    _rotate(isLeft) {
        const oldPosX = this._player.pos.x;
        this._player.rotate(isLeft);

        // check for collision - we have to check multiple times, until there's no collision
        // or revert back to starting position if we can't find such
        // Algorith is: 
        // check collision - yes :
        // move 1 to the right, => offset 1
        // then 2 to the left,  => offset -2
        // then 3 to the right  => offset 3
        // then 4 to the left   => offset -4
        // ...
        let offset = 1;
        while (matrix.isCollide(this._arena, this._player)) {
            // reached the left/right borders
            this._player.move(offset);
            offset = (Math.abs(offset) + 1) * (offset > 0 ? -1 : 1);

            // we can't keep checking forever - break if no "collision-free" position is possible
            // so revert to starting position
            if (offset > this._player.piece[0].length) {
                this._player.pos.x = oldPosX;
                this._player.rotate(!isLeft);
                return;
            }
        }

        this._controller.sendPlayerUpdate({
            piece: this._player.piece,
            pos: this._player.pos
        });
    }

    _renderScore() {
        if (this._score) {
            this._score.innerText = this.getScore();
        }
    }

    /**
     * 
     * @param {Number[]} keys 
     * @param {*} event 
     */
    _handleKeydown(keys, event) {
        if (this._state !== STATE.STARTED) {
            return;
        }

        let keyIndex = keys.indexOf(event.keyCode);
        if (keyIndex >= 0) {
            event.preventDefault();

            switch (keyIndex) {
                case 0:           // left
                    this._move(true);
                    break;
                case 1:           // right
                    this._move(false);
                    break;
                case 2:           // rotate left
                    this._rotate(true);
                    break;
                case 3:           // rotate right
                    this._rotate(false);
                    break;
                case 4:           // drop
                    this._drop(true);
                    break;
            }
        }
    }


}
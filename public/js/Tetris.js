import * as matrix from './matrix.js';
import Player from './Player.js';
import Timer from './Timer.js';

let count = 0;
export default class Tetris {
    constructor(controller, canvas, arenaW, arenaH, scale, score) {
        this._controller = controller;
        this._canvas = canvas;
        this._context = canvas.getContext('2d');

        this._canvas.width = arenaW * scale;
        this._canvas.height = arenaH * scale;
        this._context.scale(scale, scale);

        this._score = score;

        this._id = ++count;

        if (controller) {
            document.addEventListener('keydown', this._handleKeydown.bind(this, [37, 39, 219, 221, 40]));

            this._timer = new Timer({ update: this._drop, render: this._render }, 1, false);
        }

        this._arena = matrix.create(arenaW, arenaH);
        this._player = new Player(controller, arenaW / 2);

        // dynamic members
        this._skipNextNotForced = false;
        this._pieceCount = 0;
        this._ended = null; // ended date
    }

    getId() {
        return this._id;
    }

    getScore() {
        return this._player.score;
    }

    reset() {
        // reset initial members
        this._ended = null;
        this._skipNextNotForced = false;
        this._pieceCount = 0;

        // reset the arena
        matrix.reset(this._arena);

        // reset player's score
        this._player.resetScore();
        this._renderScore();

        // generate a new piece
        this._generatePiece();
        // render all till now 
        this._render();
    }

    update({arena, piece, pos, score, ended}) {
        let updated = this._player.update({piece, pos, score});
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

        if (ended) {
            this._ended = ended;
        }
    }

    _render() {
        this._context.fillStyle = 'black';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

        // render the arena (current fallen pieces)
        matrix.render(this._arena, this._context);

        // render the player (current falling piece)
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
            }

            this._controller.sendUpdate({arena : this._arena});

            // generate a new piece for the player - it will be also started form the top
            this._generatePiece();

            // check for Game Over - just check if right after a new piece there's a collision
            if (matrix.isCollide(this._arena, this._player)) {
                // notify the controller that this player-tetris 'ended' (though it may still not have lost)
                this._timer.stop();
                this._controller.sendEnd();
            }
        }
    }

    _generatePiece() {
        this._pieceCount++;
        // get next piece from the controller
        const nextPiece = this._controller.getPiece(this._pieceCount);
        this._player.resetWith(nextPiece, 'red');
    }

    _move(isLeft) {
        this._player.move(isLeft ? -1 : 1);
        if (matrix.isCollide(this._arena, this._player)) {
            // reached the left/right borders
            this._player.move(isLeft ? 1 : -1);
        }
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
            if (offset > this._player.piece[0].length) {
                // we can't keep checking forever - break if no "collision-free" position is possible
                // so revert to starting position
                this._player.pos.x = oldPosX;
                this._player.rotate(!isLeft);
                break;
            }
        }
    }

    _renderScore() {
        if (this._score) {
            this._score.innerText = this.getScore();
        }
    }

    _handleKeydown(keys, event) {
        if (this._ended) {
            return;
        }

        switch (event.keyCode) {
            case keys[0]:           // left
                this._move(true);
                break;
            case keys[1]:           // right
                this._move(false);
                break;
            case keys[2]:           // rotate left
                this._rotate(true);
                break;
            case keys[3]:           // rotate right
                this._rotate(false);
                break;
            case keys[4]:           // drop
                this.drop(true);
                break;

        }
    }

}
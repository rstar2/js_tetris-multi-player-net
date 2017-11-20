import Vector from './Vector.js';

import * as matrix from './matrix.js';

export default class Player {
    constructor(controller, arenaCenter = 0) {
        this._controller = controller;
        this._arenaCenter = Math.floor(arenaCenter);
        this._pos = new Vector(arenaCenter, 0);
        this._piece = undefined;
        this._color = undefined;
        this._score = 0;
    }

    get pos() {
        return this._pos;
    }

    get piece() {
        return this._piece;
    }

    get color() {
        return this._color;
    }

    get score() {
        return this._score;
    }

    addScore(score) {
        this._score += score;
    }

    resetScore() {
        this._score = 0;
    }

    /**
     * Reset with a new piece matrix
     * @param {[[]]} piece 
     * @param {String} color 
     */
    resetWith(piece, color = 'white') {
        this._piece = piece;
        this._color = color;

        // move to top
        this._pos.y = 0;

        // center it in the middle
        // get the middle/center of any row (for instance the first)
        this._pos.x = this._arenaCenter - Math.floor(this._piece[0].length / 2);

        this._controller.sendUpdate({pos : this._pos});
        this._controller.sendUpdate({piece : this._piece});
    }

    drop(offset) {
        this._pos.y = this._pos.y + offset;
        
        this._controller.sendUpdate({pos : this._pos});
    }

    move(offset) {
        this._pos.x = this._pos.x + offset;

        this._controller.sendUpdate({pos : this._pos});
    }

    rotate(isLeft) {
        matrix.rotate(this._piece, isLeft);

        this._controller.sendUpdate({piece : this._piece});
    }

    update({piece, pos, score}) {
        let updated = false;
        if (piece) {
            this._piece = piece;
            updated = true;
        }
        
        if (pos) {
            this._pos.set(pos);
            updated = true;
        }

        if (score !== undefined) {
            this._score = score;
        }
        
    }

}
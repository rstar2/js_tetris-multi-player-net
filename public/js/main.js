import { PIECES } from './pieces.js';
import * as matrix from './matrix.js';
import Tetris from './Tetris.js';
import Timer from './Timer.js';

// we have the game arena as 12x20 matrix tiles
// wih scale of 20 this means 240x400 pixels canvas
const ARENA_WIDTH = 12;
const ARENA_HEIGHT = 20;
const SCALE = 20;

const STATE = {
    INIT: Symbol(0),
    STOPPED: Symbol(1),
    STARTED: Symbol(2),
    PAUSED: Symbol(3)
};

// start with dropping the piece on every 1 sec
const timer = new Timer({ update, render }, 1, false);

function update() {
    tetrises.filter(tetris => !tetris.isEnded()).
        forEach(tetris => tetris.drop());
}

function render() {
    tetrises.filter(tetris => !tetris.isEnded()).
        forEach(tetris => tetris.render());
}

function reset() {
    piecesQueue = new Map();
    piecesCount = 0;

    tetrises.forEach(tetris => tetris.reset());
}

const FEED_SAME_PIECES = true;
let piecesQueue = new Map();
let piecesCount = 0;

const controller = {
    getPiece(tetrisPieceCount) {
        let index;
        if (FEED_SAME_PIECES) {
            // use the same piece for all (note - keep track where each tetris is)

            // if someone requests a new piece - then generate it
            if (piecesCount < tetrisPieceCount) {
                // note it should be always greate with 1 maximum - e.g. next, no some that is far away in time
                if (piecesCount + 1 !== tetrisPieceCount)
                    throw new Error(`Cannot request a piece with count ${tetrisPieceCount}`);

                index = Math.floor(Math.random() * PIECES.length);
                piecesQueue.set(tetrisPieceCount, { index, notified: 1 });
                piecesCount = tetrisPieceCount;
            } else {
                const item = piecesQueue.get(tetrisPieceCount);
                if (!item) {
                    throw new Error(`Cannot find a piece with count ${tetrisPieceCount} - it must be expired`);
                }

                // get the same samved index from the item
                index = item.index;
                item.notified++;

                // if all tetrises are notified then discard the item in the map
                if (item.notified === tetrises.length) {
                    piecesQueue.delete(tetrisPieceCount);
                }
            }

        } else {
            // generate a new random piece for each tetris
            index = Math.floor(Math.random() * PIECES.length);
        }
        return matrix.clone(PIECES[index]);
    },

    ended(tetris) {
        // check if there's a winner othrewise allow the oher tetrises to continue playing
        // Note - this is made more general function - not just for 2 tetrises,

        let highest;
        let notEnded = 0;
        tetrises.forEach(tetris => {
            if (!tetris.isEnded()) {
                notEnded++;
            }

            if (!highest) {
                // this is the first
                highest = tetris;
            } else if (tetris.getScore() === highest.getScore()) {
                // check which tetris has the highest points
                if (highest.isEnded() && (!tetris.isEnded() || tetris.getEndedDate() >= highest.getEndedDate()))
                    highest = tetris;
            } else if (tetris.getScore() > highest.getScore()) {
                // check which tetris has the highest points
                highest = tetris;
            }
        });

        let winner;
        if (notEnded === 0) {
            // if all tetrises has ended - so we have a winner
            winner = highest;
        } else if (notEnded === 1 && !highest.isEnded()) {
            // if ONLY ONE tetrises is not ended and it alreay has highest score so it is the winner
        }
        // otherwise we have to check the other to end

        tetris.render();
        if (winner) {
            winner.renderWinner();

            setState(STATE.STOPPED);
        }
    }
};

// the key sets - define as many as players needed
const keySets = [
    [90, 67, 81, 87, 88],
    [37, 39, 219, 221, 40]
];

const tetrises = [];
const players = document.querySelectorAll('.player');
[...players].forEach(element => {
    tetrises.push(new Tetris(controller, element.querySelector('.screen'),
        ARENA_WIDTH, ARENA_HEIGHT, SCALE, element.querySelector('.score'),
        keySets.shift()));
});

let state;
function setState(newState) {
    if (state === newState) {
        return;
    }

    let text;
    switch (newState) {
        case STATE.INIT:
            text = 'Start';
            reset();
            break;
        case STATE.STARTED:
            text = 'Pause';
            // this depends on the current state
            switch (state) {
                case STATE.INIT:
                    timer.start();
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
            timer.pause();
            break;
        case STATE.STOPPED:
            text = 'Start';
            timer.stop();
            break;
    }

    state = newState;
    start.innerText = text;
}
function changeState() {
    // change current state
    let newState;
    switch (state) {
        case STATE.INIT:
        case STATE.STOPPED:
        case STATE.PAUSED:
            newState = STATE.STARTED;
            break;
        case STATE.STARTED:
            newState = STATE.PAUSED;
            break;
    }
    setState(newState);
}

const start = document.getElementById('start');
start.addEventListener('click', changeState);

setState(STATE.INIT);

// TODO: fix keypress of one player blocks others
// TODO: increase drop rate as the time goes - more difficult
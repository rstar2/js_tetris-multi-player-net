import { PIECES } from './pieces.js';
import * as matrix from './matrix.js';
import TetrisManager from './TetrisManager.js';
import ConnectionManager, { MSG_TYPE } from './ConnectionManager.js';

// TODO: simultaneous start
// TODO: same pieces

const controller = {
    init() {
        tetrisLocal.reset();
        tetrisLocal.start();
    },

    destroy() {
        tetrisLocal.stop();
    },

    getPiece(pieceCount) {
        // generate a new random piece for each tetris
        const index = Math.floor(Math.random() * PIECES.length);
        return matrix.clone(PIECES[index]);
    },

    sendUpdate(state) {
        // send local tetris last updated state
        conManager.send(MSG_TYPE.UPDATE_STATE, state);
    }
};

const tetrisManager = new TetrisManager(document.getElementById('player-template'),
    document.querySelector('.container'));
// create the current local tetris
const tetrisLocal = tetrisManager.create(controller);

const conManager = new ConnectionManager(controller, tetrisManager);
conManager.connect('ws://localhost:9000');

tetrisManager.reset();

// const start = document.getElementById('start');
// start.addEventListener('click', changeState);

// const FEED_SAME_PIECES = true;
// let piecesQueue = new Map();
// let piecesCount = 0;

// const controller = {
//     getPiece(tetrisPieceCount) {
//         let index;
//         if (FEED_SAME_PIECES) {
//             // use the same piece for all (note - keep track where each tetris is)

//             // if someone requests a new piece - then generate it
//             if (piecesCount < tetrisPieceCount) {
//                 // note it should be always create with 1 maximum - e.g. next, no some that is far away in time
//                 if (piecesCount + 1 !== tetrisPieceCount)
//                     throw new Error(`Cannot request a piece with count ${tetrisPieceCount}`);

//                 index = Math.floor(Math.random() * PIECES.length);
//                 piecesQueue.set(tetrisPieceCount, { index, notified: 1 });
//                 piecesCount = tetrisPieceCount;
//             } else {
//                 const item = piecesQueue.get(tetrisPieceCount);
//                 if (!item) {
//                     throw new Error(`Cannot find a piece with count ${tetrisPieceCount} - it must be expired`);
//                 }

//                 // get the same saved index from the item
//                 index = item.index;
//                 item.notified++;

//                 // if all tetrises are notified then discard the item in the map
//                 if (item.notified === tetrises.length) {
//                     piecesQueue.delete(tetrisPieceCount);
//                 }
//             }

//         } else {
//             // generate a new random piece for each tetris
//             index = Math.floor(Math.random() * PIECES.length);
//         }
//         return matrix.clone(PIECES[index]);
//     },

//     ended(tetris) {
//         // check if there's a winner otherwise allow the other tetrises to continue playing
//         // Note - this is made more general function - not just for 2 tetrises,

//         let highest;
//         let notEnded = 0;
//         tetrises.forEach(tetris => {
//             if (!tetris.isEnded()) {
//                 notEnded++;
//             }

//             if (!highest) {
//                 // this is the first
//                 highest = tetris;
//             } else if (tetris.getScore() === highest.getScore()) {
//                 // check which tetris has the highest points
//                 if (highest.isEnded() && (!tetris.isEnded() || tetris.getEndedDate() >= highest.getEndedDate()))
//                     highest = tetris;
//             } else if (tetris.getScore() > highest.getScore()) {
//                 // check which tetris has the highest points
//                 highest = tetris;
//             }
//         });

//         let winner;
//         if (notEnded === 0) {
//             // if all tetrises has ended - so we have a winner
//             winner = highest;
//         } else if (notEnded === 1 && !highest.isEnded()) {
//             // if ONLY ONE tetrises is not ended and it already has highest score so it is the winner
//         }
//         // otherwise we have to check the other to end

//         tetris.render();
//         if (winner) {
//             winner.renderWinner();

//             setState(STATE.STOPPED);
//         }
//     }
// };

// const STATE = {
//     INIT: Symbol(0),
//     STOPPED: Symbol(1),
//     STARTED: Symbol(2),
//     PAUSED: Symbol(3)
// };

// let state;
// function setState(newState) {
//     if (state === newState) {
//         return;
//     }

//     let text;
//     switch (newState) {
//         case STATE.INIT:
//             text = 'Start';
//             reset();
//             break;
//         case STATE.STARTED:
//             text = 'Pause';
//             // this depends on the current state
//             switch (state) {
//                 case STATE.INIT:
//                     timer.start();
//                     break;
//                 case STATE.STOPPED:
//                     reset();
//                     timer.start();
//                     break;
//                 case STATE.PAUSED:
//                     timer.unpause();
//                     break;

//             }
//             break;
//         case STATE.PAUSED:
//             text = 'Unpause';
//             timer.pause();
//             break;
//         case STATE.STOPPED:
//             text = 'Start';
//             timer.stop();
//             break;
//     }

//     state = newState;
//     start.innerText = text;
// }
// function changeState() {
//     // change current state
//     let newState;
//     switch (state) {
//         case STATE.INIT:
//         case STATE.STOPPED:
//         case STATE.PAUSED:
//             newState = STATE.STARTED;
//             break;
//         case STATE.STARTED:
//             newState = STATE.PAUSED;
//             break;
//     }
//     setState(newState);
// }

// function reset() {
//     piecesQueue = new Map();
//     piecesCount = 0;

//     tetrisManager.reset();
// }


// // initialize it
// setState(STATE.INIT);
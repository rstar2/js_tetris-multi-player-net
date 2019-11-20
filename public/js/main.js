import Controller from './Controller.js';

new Controller(document.getElementById('player-template'),
    document.querySelector('.container'), document.getElementById('start'),
    'ws://localhost:9000');

// TODO: simultaneous start
// TODO: multiple games - start/restart and not-allowing to join a session/room while a game is running
// TODO: don't store all the pieces in the server's session queue for each single game


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
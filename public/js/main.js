import Controller from './Controller.js';

new Controller(document.getElementById('player-template'),
    document.querySelector('.container'), document.getElementById('start'),
    'ws://localhost:9000');

// TODO: simultaneous start
// TODO: multiple games - start/restart and not-allowing to join a session/room while a game is running
// TODO: don't store all the pieces in the server's session queue for each single game

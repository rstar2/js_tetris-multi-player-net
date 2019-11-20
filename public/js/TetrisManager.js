import Tetris from './Tetris.js';
import Controller from './Controller.js';

// we have the game arena as 12x20 matrix tiles
// wih scale of 20 this means 240x400 pixels canvas
const ARENA_WIDTH = 12;
const ARENA_HEIGHT = 20;
const SCALE = 20;

export default class TetrisManager {

    /**
     * 
     * @param {HTMLElement} template 
     * @param {HTMLElement} container 
     */
    constructor(template, container) {
        this._template = template;
        this._container = container;
    }

    /**
     * 
     * @param {Controller} [controller]
     * @returns {Tetris} 
     */
    create(controller) {
        const player = document.importNode(this._template.content, true).children[0];
        this._container.appendChild(player);

        const tetris = new Tetris(controller, player.querySelector('.screen'),
            ARENA_WIDTH, ARENA_HEIGHT, SCALE, player.querySelector('.score'));

        player.id = tetris.getId();

        return tetris;
    }

    /**
     * 
     * @param {Tetris} tetris 
     */
    remove(tetris) {
        const player = document.getElementById(tetris.getId());
        player.remove();
    }

    /**
     * 
     * @param {Tetris[]} tetrises
     */
    winners(tetrises) {
        tetrises.forEach(tetris => {
            const player = document.getElementById(tetris.getId());
            this._winner(player, true);
        });
    }

    /**
     * 
     */
    reset() {
        const players = document.querySelectorAll('.player');
        players.forEach(player => this._winner(player, false));
    }

    /**
     * 
     * @param {HTMLElement} player 
     * @param {Boolean} isSet 
     */
    _winner(player, isSet) {
        const canvas = player.querySelector('.screen');
        canvas.classList.toggle('winner', isSet);
    }
    

}
export default class Timer {

    constructor(callbacks, rate = 1 / 60, renderOnUpdateOnly = true) {
        this._callbacks = callbacks;
        this._rate = rate;
        this._renderOnUpdateOnly = renderOnUpdateOnly;

        this._lastTime = 0;
        this._accumulator = 0;
        this._tick = 0;
        this._lastTick = 0;
        this._frameId = null;

    }
    // thus we can set any desired rate
    // in order to get more realistic game simulation
    // Note - this does not mean that the rendering/drawing needs to be
    // with the same rate - THIS IS NOT NEEDED.
    // What is needed is to have a deterministic game simulation
    // (checks for collisions and etc.)
    _loop(time) {
        if (this._lastTime) {
            this._accumulator += (time - this._lastTime) / 1000;
            while (this._accumulator > this._rate) {
                this._callbacks.update(this._rate, this._tick++);
                this._accumulator -= this._rate;
            }
        }
        this._lastTime = time;
        // render only if at least once 'update' is called
        // or if render is desired to be called always (this._renderOnUpdateOnly is false)
        if (!this._renderOnUpdateOnly || this._lastTick !== this._tick) {
            this._callbacks.render();
        }
        this._lastTick = this._tick;
        this._frameId = requestAnimationFrame(this._loop.bind(this));
    }

    start() {
        if (!this._frameId) {
            this._lastTime = 0;
            this._accumulator = 0;
            this._tick = 0;
            this._lastTick = 0;
            this._frameId = requestAnimationFrame(this._loop.bind(this));
        }
    }

    stop() {
        if (this._frameId) {
            cancelAnimationFrame(this._frameId);
            this._frameId = null;
        }
    }

    suspend() {
        this._accumulator = 0;
    }

}

// USAGE :
// import Timer from './Timer.js'

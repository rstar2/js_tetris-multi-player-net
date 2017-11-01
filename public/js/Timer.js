

function createWorker(callbacks, rate, renderOnUpdateOnly) {
    let lastTime = 0;
    let accumulator = 0;
    let tick = 0;
    let lastTick = 0;
    let frameId = null;

    const loop = function (time) {
        if (!frameId) {
            // this means this worker is meanwhile stopped, so just return 
            return;
        }

        if (lastTime) {
            accumulator += (time - lastTime) / 1000;
            while (accumulator > rate) {
                callbacks.update(rate, tick++);
                accumulator -= rate;

                if (!frameId) {
                    // this means this worker is meanwhile stopped, so just return 
                    return;
                }
            }
        }

        lastTime = time;
        
        // render only if at least once 'update' is called
        // or if render is desired to be called always (this._renderOnUpdateOnly is false)
        if (!renderOnUpdateOnly || lastTick !== tick) {
            callbacks.render();
        }
        lastTick = tick;

        frameId = requestAnimationFrame(loop);
    };

    return {
        start: function () {
            if (!frameId) {
                frameId = requestAnimationFrame(loop);
            }
        },

        stop: function () {
            if (frameId) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
        },

        reset: function () {
            accumulator = 0;
        },

        pause: function () {
            lastTime = 0;
            this.stop();
        },

        unpause: function () {
            this.start();
        }
    };
}

export default class Timer {

    constructor(callbacks, rate = 1 / 60, renderOnUpdateOnly = true) {
        this._callbacks = callbacks;
        this._rate = rate;
        this._renderOnUpdateOnly = renderOnUpdateOnly;

        // if not supplied proper callback methods (update and render) then create noop/dummy ones
        if (!callbacks.update) {
            callbacks.update = () => { };
        }
        if (!callbacks.render) {
            callbacks.render = () => { };
        }
    }

    start() {
        this.stop();

        this._worker = createWorker(this._callbacks, this._rate, this._renderOnUpdateOnly);
        this._worker.start();
    }

    stop() {
        if (this._worker) {
            this._worker.stop();
            this._worker = null;
        }
    }

    reset() {
        if (this._worker) {
            this._worker.reset();
        }
    }

    pause() {
        if (this._worker) {
            this._worker.pause();
        }
    }

    unpause() {
        if (this._worker) {
            this._worker.unpause();
        }
    }

}
/* eslint-disable no-console */

const isLOG = true;

export function log() {
    if (isLOG) {
        console.log(...arguments);
    }
}

export function warn() {
    if (isLOG) {
        console.warn(...arguments);
    }
}

export function error() {
    if (isLOG) {
        console.error(...arguments);
    }
}
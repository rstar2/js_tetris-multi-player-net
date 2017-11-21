/* eslint-disable no-console */

const isLOG = true;

exports.log = function () {
    if (isLOG) {
        console.log(...arguments);
    }
};

exports.warn = function () {
    if (isLOG) {
        console.warn(...arguments);
    }
};

exports.error = function () {
    if (isLOG) {
        console.error(...arguments);
    }
};
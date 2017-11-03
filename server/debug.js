const isLOG = true;

exports.log = function () {
    if (isLOG) {
        console.log.apply(this, arguments);
    }
}
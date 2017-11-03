exports.generateId = function (len = 6, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let id = '';
    while (len--) {
        id += chars[Math.random() * chars.length | 0];
    }

    return id;
};
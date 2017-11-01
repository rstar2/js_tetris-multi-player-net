/**
 * Create a "blank" (full with zeros) matrix
 * @param {Number} width 
 * @param {Number} height
 * @returns {[[]]} created new matrix
 */
export function create(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

/**
 * Clones a given matrix
 * @param {[[]]} matrix 
 * @returns {[[]]} cloned new matrix 
 */
export function clone(matrix) {
    const matrixB = [];
    matrix.forEach(row => matrixB.push([...row]));
    return matrixB;
}

/**
 * @param {[[]]} matrix 
 */
export function reset(matrix) {
    matrix.forEach(row => row.fill(0));
}

/**
 * Merge the "ones" from the Player's piece's matrix into the specified matrix
 * @param {[[]]} matrix 
 * @param {Player} Player
 */
export function merge(matrix, player) {
    const offsetX = player.pos.x;
    const offsetY = player.pos.y;

    const piece = player.piece;
    piece.forEach((row, y) => {
        row.forEach((value, x) => {
            // if a "one" - put in the arena
            if (value !== 0) {
                matrix[y + offsetY][x + offsetX] = value;
            }
        });
    });
}

/**
 * Check if the player's piece's matrix is colliding with the main matrix
 * or goes out of bounds - e.g. reach bottom, or left/right borders
 * @param {[[]]} matrix 
 * @param {Player} Player
 */
export function isCollide(matrix, player) {
    const offsetX = player.pos.x;
    const offsetY = player.pos.y;

    const piece = player.piece;

    for (let y = 0, lenRows = piece.length; y < lenRows; y++) {
        for (let x = 0, lenCols = piece[y].length; x < lenCols; x++) {
            // check first if the piece's matrix (e.g. how it is rotated)
            if (piece[y][x] !== 0) {
                // now check if the main matrix/arena has a "one" in that posistion
                const matrixRow = matrix[y + offsetY];
                // we also check if matrixRow is valid row as after the offset it may not be
                // e.g. it can be "below" the end of the matrix/arena, which in fact means bottom is reached
                // Note matrixRow[x + offsetX] will be 'undefined' and ths '!== 0' if offsetX is making
                // row to be not in the arena entirely (e.g. over the left/right borders)
                if (!matrixRow || matrixRow[x + offsetX] !== 0) {
                    // so bottom is reach or there's a collision
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Searches for "full" lines (e.g. tetris) and removes
 * while inserting a new empty line on the top.
 * @param {[[]]} matrix
 * @returns {Number} number of points
 */
export function clearFull(matrix) {
    let scoreScale = 10;
    let score = 0;
    // start from the bottom lines
    rows: for (let y = matrix.length - 1; y >= 0; y--) {
        for (let x = 0, rowLen = matrix[y].length; x < rowLen; x++) {
            if (matrix[y][x] !== 1) {
                // at least one "empty" found on the row - so skip this row
                // as continuing with the next one
                // Note we continue on the outer "rows" loop
                continue rows;
            }
        }

        // this means the whole row is with "ones" so we have to delete it
        // and put a new on the top
        const deletedRows = matrix.splice(y, 1);
        // deletedRows is an array with the deleted rows,
        // of course in this case it is just one
        const deletedRow = deletedRows[0];

        // use the same deleted row and empty it , e.g. fill it with  "zeros"
        // and pus on the top, e.g. as first
        deletedRow.fill(0);
        matrix.unshift(deletedRow);
        // we have to move the iter one row up as we cleared current
        y++;

        // increase score
        score += scoreScale;

        // this will mean that if 2 rows one after the other will
        // give more points if they are cleared , e.g. :
        // 1 row = 10 points
        // 2 rows = 10 + 20 = 30 points
        // 3 rows = 10 + 20 + 40 = 70 points
        // 4 rows = 10 + 20 + 40 + 80 = 150 points

        scoreScale *= 2;
    }

    return score;
}


/**
 * @param {[[]]} matrix
 * @param {boolean} isLeft
 */
export function rotate(matrix, isLeft) {
    // ROTATE = 1.Transpose + 2.Reverse

    // 1.Transpose
    // slice diagonally the matrix 
    for (let y = 0, lenRows = matrix.length; y < lenRows; y++) {
        for (let x = 0; x < y; x++) {
            // ES6 swapping without the need of extra temp variable
            [
                matrix[x][y],
                matrix[y][x]
            ] = [
                    matrix[y][x],
                    matrix[x][y]
                ];
        }
    }

    // 2.Reverse
    if (isLeft) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

/**
 * @param {[[]]} matrix 
 * @param {CanvasRenderingContext2D} context 
 * @param {Sring} color 
 * @param {{x: Number, y: Number}} offset 
 */
export function render(matrix, context, color = 'white', offset = { x: 0, y: 0 }) {
    context.fillStyle = color;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}


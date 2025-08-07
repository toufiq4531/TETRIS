const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

context.scale(20, 20);
nextCtx.scale(20, 20);

const matrixes = {
    T: [[[0, 0, 0], [1, 1, 1], [0, 1, 0]]],
    O: [[[2, 2], [2, 2]]],
    L: [[[0, 3, 0], [0, 3, 0], [0, 3, 3]]],
    J: [[[0, 4, 0], [0, 4, 0], [4, 4, 0]]],
    I: [[[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]]],
    S: [[[0, 6, 6], [6, 6, 0], [0, 0, 0]]],
    Z: [[[7, 7, 0], [0, 7, 7], [0, 0, 0]]],
};

const colors = [
    null,
    '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
];

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.strokeStyle = '#111';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function playerDrop(hard = false) {
    if (hard) {
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
        return;
    }

    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    player.matrix = rotate(player.matrix);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            player.matrix = rotate(player.matrix);
            player.matrix = rotate(player.matrix);
            player.matrix = rotate(player.matrix);
            player.pos.x = pos;
            return;
        }
    }
}

function createPiece(type) {
    return matrixes[type][0];
}

function playerReset() {
    const pieces = 'TJLOISZ';
    player.matrix = next.piece;
    next.piece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.y = 0;
    player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

    // Game over
    if (collide(arena, player)) {
        gameOver = true;
        document.getElementById('gameOver').style.display = 'block';
        return;
    }

    drawNext();
}


function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    drawMatrix(next.piece, { x: 0, y: 0 }, nextCtx);
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

function draw() {
    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;
let gameOver = false;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (!paused && !gameOver) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        draw();
    }

    requestAnimationFrame(update);
}

const arena = createMatrix(10, 20);
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0
};
const next = {
    piece: null
};

const pieces = 'TJLOISZ';
next.piece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
playerReset();
updateScore();
dropCounter = 0;
lastTime = performance.now();
update();

document.addEventListener('keydown', event => {
    if (gameOver) return;
    switch (event.key) {
        case 'ArrowLeft': return playerMove(-1);
        case 'ArrowRight': return playerMove(1);
        case 'ArrowDown': return playerDrop();
        case 'ArrowUp': return playerRotate();
        case ' ': return playerDrop(true);
        case 'p':
        case 'P':
            paused = !paused;
            if (!paused) lastTime = performance.now();
            break;
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    gameOver = false;
    document.getElementById('gameOver').style.display = 'none';
    playerReset();
});

function restartGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    gameOver = false;
    document.getElementById('gameOver').style.display = 'none';
    playerReset();
    lastTime = performance.now();
    dropCounter = 0;
    update();
}
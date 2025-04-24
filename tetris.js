// Các hằng số
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// Các khối Tetris
const SHAPES = [
    null,
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]],                         // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]],                         // L
    [[0, 4, 4], [0, 4, 4], [0, 0, 0]],                         // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]],                         // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]],                         // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]]                          // Z
];

// Lấy các phần tử DOM
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece-canvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');

// Thiết lập kích thước canvas
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
nextPieceCanvas.width = 100;
nextPieceCanvas.height = 100;

// Biến game
let board = createBoard();
let piece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;
let isPaused = false;

// Tạo bảng game
function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

// Tạo khối mới
function createPiece() {
    const shape = Math.floor(Math.random() * 7) + 1;
    return {
        shape: shape,
        matrix: SHAPES[shape],
        pos: {x: Math.floor(COLS / 2) - Math.floor(SHAPES[shape][0].length / 2), y: 0}
    };
}

// Vẽ khối
function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(
                    (x + offset.x) * BLOCK_SIZE, 
                    (y + offset.y) * BLOCK_SIZE, 
                    BLOCK_SIZE - 1, 
                    BLOCK_SIZE - 1
                );
                ctx.strokeStyle = '#000';
                ctx.strokeRect(
                    (x + offset.x) * BLOCK_SIZE, 
                    (y + offset.y) * BLOCK_SIZE, 
                    BLOCK_SIZE - 1, 
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

// Vẽ bảng game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ các khối đã đặt
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(
                    x * BLOCK_SIZE, 
                    y * BLOCK_SIZE, 
                    BLOCK_SIZE - 1, 
                    BLOCK_SIZE - 1
                );
                ctx.strokeStyle = '#000';
                ctx.strokeRect(
                    x * BLOCK_SIZE, 
                    y * BLOCK_SIZE, 
                    BLOCK_SIZE - 1, 
                    BLOCK_SIZE - 1
                );
            }
        });
    });
    
    // Vẽ khối đang rơi
    if (piece) {
        drawMatrix(piece.matrix, piece.pos, ctx);
    }
}

// Vẽ khối tiếp theo
function drawNextPiece() {
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    nextPieceCtx.fillStyle = '#000';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (nextPiece) {
        const offset = {
            x: (nextPieceCanvas.width / BLOCK_SIZE - nextPiece.matrix[0].length) / 2,
            y: (nextPieceCanvas.height / BLOCK_SIZE - nextPiece.matrix.length) / 2
        };
        drawMatrix(nextPiece.matrix, offset, nextPieceCtx);
    }
}

// Kiểm tra va chạm
function collide(board, piece) {
    const m = piece.matrix;
    const o = piece.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] === undefined ||
                 board[y + o.y][x + o.x] === undefined ||
                 board[y + o.y][x + o.x] !== 0)) {
                return true;
            }
        }
    }
    return false;
}

// Xoay khối
function rotate(matrix) {
    const N = matrix.length;
    const result = Array.from({length: N}, () => Array(N).fill(0));
    for (let y = 0; y < N; ++y) {
        for (let x = 0; x < N; ++x) {
            result[x][N - 1 - y] = matrix[y][x];
        }
    }
    return result;
}

// Di chuyển khối
function playerMove(dir) {
    if (isPaused) return;
    piece.pos.x += dir;
    if (collide(board, piece)) {
        piece.pos.x -= dir;
    }
}

// Xoay khối
function playerRotate() {
    if (isPaused) return;
    const pos = piece.pos.x;
    let offset = 1;
    piece.matrix = rotate(piece.matrix);
    while (collide(board, piece)) {
        piece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.matrix[0].length) {
            piece.matrix = rotate(piece.matrix);
            piece.matrix = rotate(piece.matrix);
            piece.matrix = rotate(piece.matrix);
            piece.pos.x = pos;
            return;
        }
    }
}

// Rơi khối
function playerDrop() {
    if (isPaused) return;
    piece.pos.y++;
    if (collide(board, piece)) {
        piece.pos.y--;
        merge();
        resetPiece();
        clearLines();
        updateScore();
    }
    dropCounter = 0;
}

// Thả khối xuống đáy
function hardDrop() {
    if (isPaused) return;
    while (!collide(board, piece)) {
        piece.pos.y++;
    }
    piece.pos.y--;
    playerDrop();
}

// Gộp khối vào bảng
function merge() {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.pos.y][x + piece.pos.x] = value;
            }
        });
    });
}

// Xóa dòng
function clearLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesCleared++;
    }
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        if (lines % 10 === 0) {
            level++;
            dropInterval = Math.max(100, dropInterval - 100);
        }
    }
}

// Cập nhật điểm
function updateScore() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// Reset khối
function resetPiece() {
    if (!nextPiece) {
        nextPiece = createPiece();
    }
    piece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();
    
    if (collide(board, piece)) {
        gameOver = true;
        alert('Game Over! Điểm của bạn: ' + score);
        board = createBoard();
        score = 0;
        level = 1;
        lines = 0;
        dropInterval = 1000;
        updateScore();
        gameOver = false;
    }
}

// Xử lý sự kiện bàn phím
document.addEventListener('keydown', event => {
    if (gameOver) return;
    
    switch (event.keyCode) {
        case 37: // Left arrow
            playerMove(-1);
            break;
        case 39: // Right arrow
            playerMove(1);
            break;
        case 40: // Down arrow
            playerDrop();
            break;
        case 38: // Up arrow
            playerRotate();
            break;
        case 32: // Space
            hardDrop();
            break;
        case 80: // P key
            isPaused = !isPaused;
            break;
    }
});

// Game loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!gameOver && !isPaused) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        draw();
        requestAnimationFrame(update);
    } else if (!gameOver) {
        requestAnimationFrame(update);
    }
}

// Bắt đầu game
resetPiece();
drawNextPiece();
updateScore();
update();

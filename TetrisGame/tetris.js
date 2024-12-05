class Tetris {
    constructor() {
        // 重新定义方块形状，确保旋转中心正确
        this.TETROMINOES = {
            'I': [
                [0,0,0,0],
                [1,1,1,1],
                [0,0,0,0],
                [0,0,0,0]
            ],
            'O': [
                [1,1],
                [1,1]
            ],
            'T': [
                [0,1,0],
                [1,1,1],
                [0,0,0]
            ],
            'S': [
                [0,1,1],
                [1,1,0],
                [0,0,0]
            ],
            'Z': [
                [1,1,0],
                [0,1,1],
                [0,0,0]
            ],
            'J': [
                [1,0,0],
                [1,1,1],
                [0,0,0]
            ],
            'L': [
                [0,0,1],
                [1,1,1],
                [0,0,0]
            ]
        };
        
        // 修改颜色定义，使用更标准的俄罗斯方块颜色
        this.COLORS = {
            'I': '#00f0f0',  // 青色
            'O': '#f0f000',  // 黄色
            'T': '#a000f0',  // 紫色
            'S': '#00f000',  // 绿色
            'Z': '#f00000',  // 红色
            'J': '#0000f0',  // 蓝色
            'L': '#f0a000'   // 橙色
        };

        // 初始化游戏元素
        this.gameBoard = document.querySelector('.game-board');
        this.nextPieceBoard = document.querySelector('.next-piece-board');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        
        // 初始化音效
        this.clearSound = document.getElementById('clear-sound');
        this.rotateSound = document.getElementById('rotate-sound');
        this.dropSound = document.getElementById('drop-sound');
        
        // 初始化游戏状态
        this.score = 0;
        this.level = 1;
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.isPlaying = false;
        this.isPaused = false;
        
        this.initBoard();
        this.bindEvents();
        this.nextPiece = this.generateRandomPiece();

        // 添加移动端控制
        this.initMobileControls();

        // 添加游戏循环的计时器引用
        this.gameLoopTimer = null;
    }

    initBoard() {
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                this.gameBoard.appendChild(cell);
            }
        }
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    togglePause() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
        
        if (this.isPaused) {
            // 暂停时清除计时器
            clearTimeout(this.gameLoopTimer);
        } else {
            // 继续时重新开始游戏循环
            this.gameLoop();
        }
    }

    startGame() {
        if (this.isPlaying) {
            // 如果游戏正在进行，则重新开始
            this.endGame();
        }
        this.isPlaying = true;
        this.isPaused = false;
        this.pauseBtn.textContent = '暂停';
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.initBoard();
        this.spawnTetromino();
        this.gameLoop();
    }

    endGame() {
        this.isPlaying = false;
        this.isPaused = false;
        clearTimeout(this.gameLoopTimer);
        this.pauseBtn.textContent = '暂停';
    }

    spawnTetromino() {
        // 使用预备的下一个方块
        this.currentTetromino = this.nextPiece;
        // 生成新的下一个方块
        this.nextPiece = this.generateRandomPiece();
        // 更新预览区域
        this.updateNextPiecePreview();
        
        // 检查游戏是否结束
        if (!this.isValidMove(this.currentTetromino.row, this.currentTetromino.col)) {
            this.checkGameOver();
        }
    }

    generateRandomPiece() {
        // 使用更合理的随机算法，避免同一类型方块连续出现
        if (!this.nextPieces) {
            // 初始化或重新填充待选方块队列
            this.nextPieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
            // Fisher-Yates 洗牌算法
            for (let i = this.nextPieces.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.nextPieces[i], this.nextPieces[j]] = [this.nextPieces[j], this.nextPieces[i]];
            }
        }

        // 从队列中取出一个方块类型
        const type = this.nextPieces.pop();
        const shape = this.TETROMINOES[type].map(row => [...row]);
        
        // 计算初始位置，使方块居中
        const width = shape[0].length;
        const col = Math.floor((10 - width) / 2);
        
        return {
            type,
            shape,
            row: 0,
            col
        };
    }

    updateNextPiecePreview() {
        // 清空预览区域
        this.nextPieceBoard.innerHTML = '';
        
        // 创建预览网格
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                this.nextPieceBoard.appendChild(cell);
            }
        }

        // 计算居中偏移
        const offsetRow = Math.floor((4 - this.nextPiece.shape.length) / 2);
        const offsetCol = Math.floor((4 - this.nextPiece.shape[0].length) / 2);

        // 在预览区域绘制方块
        const cells = this.nextPieceBoard.children;
        this.nextPiece.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    const index = (i + offsetRow) * 4 + (j + offsetCol);
                    cells[index].classList.add('filled');
                    cells[index].setAttribute('data-type', this.nextPiece.type);
                }
            });
        });
    }

    drawTetromino() {
        const cells = this.gameBoard.children;
        this.currentTetromino.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    const index = (this.currentTetromino.row + i) * 10 + (this.currentTetromino.col + j);
                    cells[index].classList.add('filled');
                    cells[index].setAttribute('data-type', this.currentTetromino.type);
                }
            });
        });
    }

    handleKeyPress(e) {
        if (!this.isPlaying) return;
        if (this.isPaused && e.key !== 'p') return;  // 暂停时只响应暂停键
        
        switch(e.key) {
            case 'ArrowLeft':
                this.moveTetromino(-1);
                break;
            case 'ArrowRight':
                this.moveTetromino(1);
                break;
            case 'ArrowDown':
                this.moveTetrominoDown();
                break;
            case 'ArrowUp':
                this.rotateTetromino();
                break;
            case ' ':
                this.hardDrop();
                break;
            case 'p':  // 添加键盘暂停功能
                this.togglePause();
                break;
        }
    }

    moveTetromino(direction) {
        const newCol = this.currentTetromino.col + direction;
        if (this.isValidMove(this.currentTetromino.row, newCol)) {
            this.clearTetromino();
            this.currentTetromino.col = newCol;
            this.drawTetromino();
        }
    }

    moveTetrominoDown() {
        const newRow = this.currentTetromino.row + 1;
        if (this.isValidMove(newRow, this.currentTetromino.col)) {
            this.clearTetromino();
            this.currentTetromino.row = newRow;
            this.drawTetromino();
        } else {
            this.lockTetromino();
            this.spawnTetromino();
        }
    }

    rotateTetromino() {
        if (this.currentTetromino.type === 'O') return; // O型方块不需要旋转
        
        const shape = this.currentTetromino.shape;
        const N = shape.length;
        
        // 创建新的旋转后的形状数组
        const rotated = Array(N).fill().map(() => Array(N).fill(0));
        
        // 执行顺时针旋转
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                rotated[i][j] = shape[N - 1 - j][i];
            }
        }
        
        // 暂存旧形状和位置
        const oldShape = shape.map(row => [...row]);
        const oldRow = this.currentTetromino.row;
        const oldCol = this.currentTetromino.col;
        
        // 尝试旋转
        this.currentTetromino.shape = rotated;
        
        // 如果旋转后位置无效尝试调整位置
        if (!this.isValidMove(oldRow, oldCol)) {
            // 尝试向左移动
            let valid = false;
            for (let i = 1; i <= 2 && !valid; i++) {
                if (this.isValidMove(oldRow, oldCol - i)) {
                    this.currentTetromino.col = oldCol - i;
                    valid = true;
                }
            }
            // 如果向左移动失败，尝试向右移动
            for (let i = 1; i <= 2 && !valid; i++) {
                if (this.isValidMove(oldRow, oldCol + i)) {
                    this.currentTetromino.col = oldCol + i;
                    valid = true;
                }
            }
            // 如果调整位置后仍然无效，恢复原状
            if (!valid) {
                this.currentTetromino.shape = oldShape;
                this.currentTetromino.row = oldRow;
                this.currentTetromino.col = oldCol;
                return;
            }
        }
        
        // 清除旧的方块并绘制新的
        this.clearTetromino();
        this.drawTetromino();
        
        if (this.rotateSound) {
            this.rotateSound.currentTime = 0;
            this.rotateSound.play().catch(() => {});
        }
    }

    hardDrop() {
        while (this.isValidMove(this.currentTetromino.row + 1, this.currentTetromino.col)) {
            this.clearTetromino();
            this.currentTetromino.row++;
            this.drawTetromino();
        }
        this.lockTetromino();
        if (this.dropSound) {
            this.dropSound.currentTime = 0;
            this.dropSound.play().catch(() => {});
        }
    }

    clearTetromino() {
        const cells = this.gameBoard.children;
        this.currentTetromino.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    const index = (this.currentTetromino.row + i) * 10 + (this.currentTetromino.col + j);
                    if (cells[index]) {
                        cells[index].classList.remove('filled');
                        cells[index].removeAttribute('data-type');
                    }
                }
            });
        });
    }

    isValidMove(row, col) {
        return this.currentTetromino.shape.every((shapeRow, i) =>
            shapeRow.every((cell, j) => {
                if (cell === 0) return true;
                const newRow = row + i;
                const newCol = col + j;
                return (
                    newRow >= 0 &&
                    newRow < 20 &&
                    newCol >= 0 &&
                    newCol < 10 &&
                    this.grid[newRow][newCol] === 0
                );
            })
        );
    }

    lockTetromino() {
        // 先检查是否有效位置
        if (!this.isValidMove(this.currentTetromino.row, this.currentTetromino.col)) {
            return;
        }
        
        this.currentTetromino.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    const gridRow = this.currentTetromino.row + i;
                    const gridCol = this.currentTetromino.col + j;
                    if (gridRow >= 0 && gridRow < 20 && gridCol >= 0 && gridCol < 10) {
                        this.grid[gridRow][gridCol] = this.currentTetromino.type;
                    }
                }
            });
        });
        this.checkLines();
    }

    checkLines() {
        for (let row = 19; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                this.grid.splice(row, 1);
                this.grid.unshift(Array(10).fill(0));
                this.score += 100;
                this.scoreElement.textContent = this.score;
                this.updateBoard();
                
                if (this.clearSound) {
                    this.clearSound.currentTime = 0;
                    this.clearSound.play().catch(() => {});
                }
            }
        }
    }

    updateBoard() {
        const cells = this.gameBoard.children;
        this.grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                const index = i * 10 + j;
                if (cell) {
                    cells[index].classList.add('filled');
                    cells[index].setAttribute('data-type', cell);
                } else {
                    cells[index].classList.remove('filled');
                    cells[index].removeAttribute('data-type');
                }
            });
        });
    }

    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.moveTetrominoDown();
        // 保存计时器引用
        this.gameLoopTimer = setTimeout(() => this.gameLoop(), 1000);
    }

    checkGameOver() {
        if (!this.isValidMove(this.currentTetromino.row, this.currentTetromino.col)) {
            alert(`游戏结束！\n最终得分：${this.score}`);
            this.endGame();
            return true;
        }
        return false;
    }

    initMobileControls() {
        // 移动端控制按钮事件监听
        document.getElementById('rotate-btn')?.addEventListener('click', () => {
            if (this.isPlaying && !this.isPaused) this.rotateTetromino();
        });

        document.getElementById('left-btn')?.addEventListener('click', () => {
            if (this.isPlaying && !this.isPaused) this.moveTetromino(-1);
        });

        document.getElementById('right-btn')?.addEventListener('click', () => {
            if (this.isPlaying && !this.isPaused) this.moveTetromino(1);
        });

        document.getElementById('down-btn')?.addEventListener('click', () => {
            if (this.isPlaying && !this.isPaused) this.moveTetrominoDown();
        });

        document.getElementById('drop-btn')?.addEventListener('click', () => {
            if (this.isPlaying && !this.isPaused) this.hardDrop();
        });

        // 添加触摸滑动支持
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.gameBoard.addEventListener('touchmove', (e) => {
            if (!this.isPlaying || this.isPaused) return;
            
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // 防止页面滚动
            e.preventDefault();

            // 检测滑动方向
            if (Math.abs(deltaX) > 30) {  // 左右滑动
                this.moveTetromino(deltaX > 0 ? 1 : -1);
                touchStartX = touchEndX;
            }
            if (deltaY > 30) {  // 下滑
                this.moveTetrominoDown();
                touchStartY = touchEndY;
            }
        });

        // 点击旋转
        this.gameBoard.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = Math.abs(touchEndX - touchStartX);
            const deltaY = Math.abs(touchEndY - touchStartY);

            // 如果没有明显的滑动，则视为点击，执行旋转
            if (deltaX < 10 && deltaY < 10) {
                this.rotateTetromino();
            }
        });
    }
}

// 初始化游戏
const game = new Tetris(); 
// Sudoku Game Logic
class SudokuGame {
    constructor() {
        this.solution = [];
        this.puzzle = [];
        this.userGrid = [];
        this.difficulty = 'medium';
        this.init();
    }

    init() {
        // Generate a new puzzle on load
        const savedDifficulty = sessionStorage.getItem('difficulty');
        if (savedDifficulty) {
            this.difficulty = savedDifficulty;
            document.getElementById('difficultySelect').value = savedDifficulty;
            document.getElementById('currentDifficulty').textContent =
                savedDifficulty.charAt(0).toUpperCase() + savedDifficulty.slice(1);
        }
        this.generateNewPuzzle();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.generateNewPuzzle();
            this.showMessage('New puzzle generated!', 'info');
        });

        document.getElementById('checkBtn').addEventListener('click', () => {
            this.checkSolution();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.giveHint();
        });

        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            sessionStorage.setItem('difficulty', this.difficulty);
            document.getElementById('currentDifficulty').textContent =
                this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
            this.generateNewPuzzle();
            this.showMessage(`Switched to ${this.difficulty} difficulty!`, 'info');
        });
    }

    // Generate a complete valid sudoku solution
    generateSolution() {
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillGrid(0, 0);
        return this.solution;
    }

    fillGrid(row, col) {
        if (col === 9) {
            row++;
            col = 0;
        }
        if (row === 9) {
            return true;
        }

        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (let num of numbers) {
            if (this.isValidPlacement(this.solution, row, col, num)) {
                this.solution[row][col] = num;
                if (this.fillGrid(row, col + 1)) {
                    return true;
                }
                this.solution[row][col] = 0;
            }
        }

        return false;
    }

    isValidPlacement(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Create puzzle by removing numbers from solution
    createPuzzle() {
        this.puzzle = this.solution.map(row => [...row]);

        const cellsToRemove = {
            'easy': 35,
            'medium': 45,
            'hard': 52,
            'expert': 58
        };

        const removeCount = cellsToRemove[this.difficulty] || 45;
        let removed = 0;

        while (removed < removeCount) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);

            if (this.puzzle[row][col] !== 0) {
                this.puzzle[row][col] = 0;
                removed++;
            }
        }

        return this.puzzle;
    }

    generateNewPuzzle() {
        this.generateSolution();
        this.createPuzzle();
        this.userGrid = this.puzzle.map(row => [...row]);
        this.renderGrid();
        this.updateFilledCount();
        this.clearMessage();
        this.saveToSession();
    }

    renderGrid() {
        const gridElement = document.getElementById('sudokuGrid');
        gridElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';

                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = row;
                input.dataset.col = col;

                if (this.puzzle[row][col] !== 0) {
                    input.value = this.puzzle[row][col];
                    input.disabled = true;
                    cell.classList.add('given');
                } else {
                    if (this.userGrid[row][col] !== 0) {
                        input.value = this.userGrid[row][col];
                        cell.classList.add('user-input');
                    }

                    input.addEventListener('input', (e) => this.handleInput(e));
                    input.addEventListener('keydown', (e) => this.handleKeydown(e));
                }

                cell.appendChild(input);
                gridElement.appendChild(cell);
            }
        }
    }

    handleInput(e) {
        const input = e.target;
        const value = input.value;

        // Only allow numbers 1-9
        if (value && (!/^[1-9]$/.test(value))) {
            input.value = '';
            return;
        }

        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        if (value) {
            this.userGrid[row][col] = parseInt(value);
            input.parentElement.classList.add('user-input');
            input.parentElement.classList.remove('error', 'correct');
        } else {
            this.userGrid[row][col] = 0;
            input.parentElement.classList.remove('user-input', 'error', 'correct');
        }

        this.updateFilledCount();
        this.saveToSession();

        // Auto-check if puzzle is complete
        if (this.isPuzzleComplete()) {
            setTimeout(() => this.checkSolution(), 300);
        }
    }

    handleKeydown(e) {
        const input = e.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        let newRow = row;
        let newCol = col;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                newRow = row > 0 ? row - 1 : row;
                break;
            case 'ArrowDown':
                e.preventDefault();
                newRow = row < 8 ? row + 1 : row;
                break;
            case 'ArrowLeft':
                e.preventDefault();
                newCol = col > 0 ? col - 1 : col;
                break;
            case 'ArrowRight':
                e.preventDefault();
                newCol = col < 8 ? col + 1 : col;
                break;
            case 'Backspace':
            case 'Delete':
                input.value = '';
                this.userGrid[row][col] = 0;
                input.parentElement.classList.remove('user-input', 'error', 'correct');
                this.updateFilledCount();
                this.saveToSession();
                return;
            default:
                return;
        }

        if (newRow !== row || newCol !== col) {
            const cells = document.querySelectorAll('.sudoku-cell input');
            const nextInput = cells[newRow * 9 + newCol];
            if (nextInput && !nextInput.disabled) {
                nextInput.focus();
            }
        }
    }

    isPuzzleComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.userGrid[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    checkSolution() {
        let allCorrect = true;
        let hasErrors = false;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.puzzle[row][col] === 0) {
                    const cellIndex = row * 9 + col;
                    const cell = document.querySelectorAll('.sudoku-cell')[cellIndex];

                    if (this.userGrid[row][col] !== this.solution[row][col]) {
                        cell.classList.add('error');
                        cell.classList.remove('correct');
                        allCorrect = false;
                        hasErrors = true;
                    } else if (this.userGrid[row][col] !== 0) {
                        cell.classList.add('correct');
                        cell.classList.remove('error');
                    }
                }
            }
        }

        if (allCorrect && this.isPuzzleComplete()) {
            this.showMessage('Congratulations! You solved it perfectly!', 'success');
        } else if (hasErrors) {
            this.showMessage('Some cells are incorrect. Keep trying!', 'error');
        } else {
            this.showMessage('Looking good so far! Keep going!', 'info');
        }
    }

    giveHint() {
        // Find an empty cell and fill it with the correct answer
        const emptyCells = [];

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.puzzle[row][col] === 0 && this.userGrid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) {
            this.showMessage('No empty cells to hint!', 'info');
            return;
        }

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;

        this.userGrid[row][col] = this.solution[row][col];

        const cellIndex = row * 9 + col;
        const cell = document.querySelectorAll('.sudoku-cell')[cellIndex];
        const input = cell.querySelector('input');

        input.value = this.solution[row][col];
        cell.classList.add('user-input', 'correct');

        this.updateFilledCount();
        this.saveToSession();
        this.showMessage('Hint added!', 'info');
    }

    updateFilledCount() {
        let filled = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.userGrid[row][col] !== 0) {
                    filled++;
                }
            }
        }
        document.getElementById('filledCells').textContent = `${filled}/81`;
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;

        if (type !== 'success') {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }, 3000);
        }
    }

    clearMessage() {
        const messageEl = document.getElementById('message');
        messageEl.textContent = '';
        messageEl.className = 'message';
    }

    saveToSession() {
        sessionStorage.setItem('currentPuzzle', JSON.stringify({
            solution: this.solution,
            puzzle: this.puzzle,
            userGrid: this.userGrid,
            difficulty: this.difficulty
        }));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});

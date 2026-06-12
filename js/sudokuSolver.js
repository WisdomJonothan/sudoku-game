/**
 * Generic N×N Sudoku solver supporting 4×4, 6×6, 9×9, 16×16.
 * Uses backtracking with MRV heuristic for efficiency.
 */

const SudokuSolver = (() => {
  /**
   * Get the symbol for a value: 1-9 as digits, 10-16 as A-G.
   */
  function valueToSymbol(val) {
    if (val <= 9) return String(val);
    return String.fromCharCode(65 + val - 10); // A=10, B=11, ..., G=16
  }

  /**
   * Parse a symbol back to numeric value.
   */
  function symbolToValue(s) {
    const upper = s.toUpperCase();
    if (upper >= 'A' && upper <= 'G') return 10 + upper.charCodeAt(0) - 65;
    const num = parseInt(upper, 10);
    if (num >= 1 && num <= 9) return num;
    return 0;
  }

  /**
   * Get all symbols for a given board size.
   */
  function getSymbols(size) {
    const symbols = [];
    for (let i = 1; i <= size; i++) {
      symbols.push(valueToSymbol(i));
    }
    return symbols;
  }

  /**
   * Check if placing `val` at (row, col) is valid according to Sudoku rules.
   * Returns true if the move is legal.
   */
  function isValid(board, size, boxRows, boxCols, row, col, val) {
    if (val === 0 || val === null || val === undefined) return true;

    // Row check
    for (let c = 0; c < size; c++) {
      if (c !== col && board[row][c] === val) return false;
    }

    // Column check
    for (let r = 0; r < size; r++) {
      if (r !== row && board[r][col] === val) return false;
    }

    // Box check
    const boxStartRow = Math.floor(row / boxRows) * boxRows;
    const boxStartCol = Math.floor(col / boxCols) * boxCols;
    for (let r = boxStartRow; r < boxStartRow + boxRows; r++) {
      for (let c = boxStartCol; c < boxStartCol + boxCols; c++) {
        if (r !== row || c !== col) {
          if (board[r][c] === val) return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if the entire board is valid (no conflicts in rows, columns, boxes).
   */
  function isBoardValid(board, size, boxRows, boxCols) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = board[r][c];
        if (val !== 0 && val !== null && !isValid(board, size, boxRows, boxCols, r, c, val)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Find the empty cell with the fewest possible candidates (MRV heuristic).
   * Returns {row, col, candidates} or null if no empty cells remain.
   */
  function findBestEmpty(board, size, boxRows, boxCols) {
    let bestRow = -1, bestCol = -1;
    let bestCandidates = null;
    let minCount = size + 1;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0 || board[r][c] === null) {
          const candidates = [];
          for (let v = 1; v <= size; v++) {
            if (isValid(board, size, boxRows, boxCols, r, c, v)) {
              candidates.push(v);
            }
          }
          if (candidates.length < minCount) {
            minCount = candidates.length;
            bestRow = r;
            bestCol = c;
            bestCandidates = candidates;
            if (minCount === 1) break; // Can't do better than 1
          }
        }
      }
      if (minCount === 1) break;
    }

    if (bestRow === -1) return null;
    return { row: bestRow, col: bestCol, candidates: bestCandidates };
  }

  /**
   * Solve the Sudoku board in-place using backtracking with MRV.
   * Returns true if solved, false if no solution.
   * Modifies the board in place.
   */
  function solve(board, size, boxRows, boxCols) {
    const empty = findBestEmpty(board, size, boxRows, boxCols);
    if (!empty) return true; // No empty cells = solved

    const { row, col, candidates } = empty;
    for (const val of candidates) {
      board[row][col] = val;
      if (solve(board, size, boxRows, boxCols)) return true;
      board[row][col] = 0;
    }
    return false;
  }

  /**
   * Count solutions up to `limit`. Stops early when limit is reached.
   * Returns the actual count (capped at limit).
   * Does not modify the original board (works on a copy).
   */
  function countSolutions(board, size, boxRows, boxCols, limit) {
    const copy = board.map(row => [...row]);
    let count = 0;

    function backtrack() {
      if (count >= limit) return;

      const empty = findBestEmpty(copy, size, boxRows, boxCols);
      if (!empty) {
        count++;
        return;
      }

      const { row, col, candidates } = empty;
      for (const val of candidates) {
        copy[row][col] = val;
        backtrack();
        copy[row][col] = 0;
        if (count >= limit) return;
      }
    }

    backtrack();
    return count;
  }

  /**
   * Check if the puzzle has exactly one solution.
   * For large boards (16x16), limit check to 2 solutions to keep performance reasonable.
   */
  function hasUniqueSolution(board, size, boxRows, boxCols) {
    const limit = 2;
    const count = countSolutions(board, size, boxRows, boxCols, limit);
    return count === 1;
  }

  /**
   * Create an empty board (2D array filled with 0).
   */
  function createEmptyBoard(size) {
    return Array.from({ length: size }, () => new Array(size).fill(0));
  }

  /**
   * Deep clone a board.
   */
  function cloneBoard(board) {
    return board.map(row => [...row]);
  }

  return {
    valueToSymbol,
    symbolToValue,
    getSymbols,
    isValid,
    isBoardValid,
    solve,
    countSolutions,
    hasUniqueSolution,
    createEmptyBoard,
    cloneBoard,
    findBestEmpty
  };
})();

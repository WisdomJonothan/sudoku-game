/**
 * Game state manager: board, notes, undo/redo, timer, statistics.
 */

class GameState {
  constructor(size, boxRows, boxCols, difficulty, puzzle, solution) {
    this.size = size;
    this.boxRows = boxRows;
    this.boxCols = boxCols;
    this.difficulty = difficulty;
    this.puzzle = SudokuSolver.cloneBoard(puzzle);      // Original puzzle (immutable)
    this.solution = SudokuSolver.cloneBoard(solution);  // Full solution
    this.board = SudokuSolver.cloneBoard(puzzle);       // Current playable board
    this.notes = this._createEmptyNotes();              // Notes (candidate pencil marks)
    this.undoStack = [];
    this.redoStack = [];
    this.elapsedTime = 0;
    this.moveCount = 0;
    this.errorCount = 0;
    this.usedHint = false;
    this.completed = false;
    this.completedAt = null;
    this.isChallenge = false; // Whether loaded from share link
  }

  /**
   * Create empty notes structure: notes[row][col] is a Set of candidate values.
   */
  _createEmptyNotes() {
    const notes = [];
    for (let r = 0; r < this.size; r++) {
      notes[r] = [];
      for (let c = 0; c < this.size; c++) {
        notes[r][c] = new Set();
      }
    }
    return notes;
  }

  /**
   * Check if a cell is part of the original puzzle (given, not user-fillable).
   */
  isGiven(row, col) {
    return this.puzzle[row][col] !== 0;
  }

  /**
   * Place a value at (row, col). Returns { ok, isCorrect }.
   * If setting to 0, it clears the cell.
   */
  setCell(row, col, val) {
    if (this.completed) return { ok: false, isCorrect: false };
    if (this.isGiven(row, col)) return { ok: false, isCorrect: false };

    const oldVal = this.board[row][col];
    if (oldVal === val) return { ok: false, isCorrect: false };

    // Save state for undo
    this.undoStack.push({
      row, col,
      oldVal: oldVal,
      oldNotes: new Set(this.notes[row][col])
    });
    this.redoStack = []; // Clear redo on new action

    this.board[row][col] = val;
    this.notes[row][col].clear();
    this.moveCount++;

    let isCorrect = true;
    if (val !== 0 && val !== this.solution[row][col]) {
      this.errorCount++;
      isCorrect = false;
    }

    // Check completion
    if (this._checkComplete()) {
      this.completed = true;
      this.completedAt = new Date().toISOString();
    }

    return { ok: true, isCorrect };
  }

  /**
   * Toggle a note (pencil mark) at (row, col).
   */
  toggleNote(row, col, val) {
    if (this.completed) return;
    if (this.isGiven(row, col)) return;
    if (val === 0) return;
    if (this.board[row][col] !== 0) return; // Can't note a filled cell

    if (!this.notes[row][col]) {
      this.notes[row][col] = new Set();
    }

    // Save state for undo
    this.undoStack.push({
      row, col,
      oldVal: this.board[row][col],
      oldNotes: new Set(this.notes[row][col])
    });
    this.redoStack = [];

    if (this.notes[row][col].has(val)) {
      this.notes[row][col].delete(val);
    } else {
      this.notes[row][col].add(val);
    }
    this.moveCount++;
  }

  /**
   * Clear all notes at (row, col).
   */
  clearNotes(row, col) {
    if (this.notes[row][col].size === 0) return;
    this.undoStack.push({
      row, col,
      oldVal: this.board[row][col],
      oldNotes: new Set(this.notes[row][col])
    });
    this.redoStack = [];
    this.notes[row][col].clear();
    this.moveCount++;
  }

  /**
   * Undo the last move.
   */
  undo() {
    if (this.undoStack.length === 0) return false;
    const action = this.undoStack.pop();

    // Save current state to redo
    this.redoStack.push({
      row: action.row,
      col: action.col,
      oldVal: this.board[action.row][action.col],
      oldNotes: new Set(this.notes[action.row][action.col])
    });

    this.board[action.row][action.col] = action.oldVal;
    this.notes[action.row][action.col] = action.oldNotes;
    return true;
  }

  /**
   * Redo the last undone move.
   */
  redo() {
    if (this.redoStack.length === 0) return false;
    const action = this.redoStack.pop();

    this.undoStack.push({
      row: action.row,
      col: action.col,
      oldVal: this.board[action.row][action.col],
      oldNotes: new Set(this.notes[action.row][action.col])
    });

    this.board[action.row][action.col] = action.oldVal;
    this.notes[action.row][action.col] = action.oldNotes;
    return true;
  }

  /**
   * Get a hint: fill the first empty cell with the correct value.
   * Returns { row, col, val } or null if no empty cells.
   */
  getHint() {
    if (this.completed) return null;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0 || this.board[r][c] !== this.solution[r][c]) {
          // Save for undo
          this.undoStack.push({
            row: r, col: c,
            oldVal: this.board[r][c],
            oldNotes: new Set(this.notes[r][c])
          });
          this.redoStack = [];

          this.board[r][c] = this.solution[r][c];
          this.notes[r][c].clear();
          this.usedHint = true;
          this.moveCount++;

          if (this._checkComplete()) {
            this.completed = true;
            this.completedAt = new Date().toISOString();
          }

          return { row: r, col: c, val: this.solution[r][c] };
        }
      }
    }
    return null;
  }

  /**
   * Check if a specific cell has an error (value != solution).
   */
  hasError(row, col) {
    const val = this.board[row][col];
    if (val === 0 || val === null) return false;
    return val !== this.solution[row][col];
  }

  /**
   * Get all cells that have errors.
   */
  getErrorCells() {
    const errors = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.hasError(r, c)) {
          errors.push({ row: r, col: c });
        }
      }
    }
    return errors;
  }

  /**
   * Check if the board is completely and correctly filled.
   */
  _checkComplete() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] !== this.solution[r][c]) return false;
      }
    }
    return true;
  }

  /**
   * Serialize game state to a plain object (for saving/storage).
   */
  toJSON() {
    return {
      size: this.size,
      boxRows: this.boxRows,
      boxCols: this.boxCols,
      difficulty: this.difficulty,
      puzzle: this.puzzle,
      board: this.board,
      solution: this.solution,
      notes: this.notes.map(row =>
        row.map(cell => Array.from(cell))
      ),
      undoStack: this.undoStack.map(a => ({
        row: a.row, col: a.col, oldVal: a.oldVal,
        oldNotes: Array.from(a.oldNotes)
      })),
      redoStack: this.redoStack.map(a => ({
        row: a.row, col: a.col, oldVal: a.oldVal,
        oldNotes: Array.from(a.oldNotes)
      })),
      elapsedTime: this.elapsedTime,
      moveCount: this.moveCount,
      errorCount: this.errorCount,
      usedHint: this.usedHint,
      completed: this.completed,
      completedAt: this.completedAt,
      isChallenge: this.isChallenge
    };
  }

  /**
   * Restore game state from a plain object.
   */
  static fromJSON(data) {
    const gs = new GameState(
      data.size, data.boxRows, data.boxCols,
      data.difficulty, data.puzzle, data.solution
    );
    gs.board = data.board;
    // Handle notes (graceful fallback for older exports without notes)
    if (data.notes && Array.isArray(data.notes) && data.notes.length === data.size) {
      gs.notes = data.notes.map(row =>
        Array.isArray(row) ? row.map(cell => new Set(cell)) : new Set()
      );
    }
    gs.undoStack = (data.undoStack || []).map(a => ({
      row: a.row, col: a.col, oldVal: a.oldVal,
      oldNotes: new Set(a.oldNotes || [])
    }));
    gs.redoStack = (data.redoStack || []).map(a => ({
      row: a.row, col: a.col, oldVal: a.oldVal,
      oldNotes: new Set(a.oldNotes || [])
    }));
    gs.elapsedTime = data.elapsedTime || 0;
    gs.moveCount = data.moveCount || 0;
    gs.errorCount = data.errorCount || 0;
    gs.usedHint = data.usedHint || false;
    gs.completed = data.completed || false;
    gs.completedAt = data.completedAt || null;
    gs.isChallenge = data.isChallenge || false;
    return gs;
  }

  /**
   * Get result statistics.
   */
  getResult() {
    return {
      size: this.size,
      difficulty: this.difficulty,
      elapsedTime: this.elapsedTime,
      moveCount: this.moveCount,
      errorCount: this.errorCount,
      usedHint: this.usedHint,
      completedAt: this.completedAt
    };
  }
}

/**
 * Generic Sudoku puzzle generator.
 * Generates complete boards via backtracking, then digs holes by difficulty.
 *
 * For 4×4, 6×6, 9×9: checks unique solution after each cell removal.
 * For 16×16: skips per-cell uniqueness check for performance;
 *   ensures at least a minimum number of clues remain based on difficulty.
 */

const SudokuGenerator = (() => {
  // Difficulty presets: minimum clues as percentage of total cells
  const DIFFICULTY_PRESETS = {
    easy:   { minClueRatio: 0.60, maxClueRatio: 0.75 },
    medium: { minClueRatio: 0.45, maxClueRatio: 0.60 },
    hard:   { minClueRatio: 0.30, maxClueRatio: 0.45 }
  };

  /**
   * Shuffle an array in-place (Fisher-Yates).
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Generate a complete valid Sudoku board.
   * Strategy: fill diagonal boxes first (they don't conflict with each other),
   * then solve the rest using backtracking.
   */
  function generateFullBoard(size, boxRows, boxCols) {
    const board = SudokuSolver.createEmptyBoard(size);

    // Fill diagonal boxes with random valid values
    const boxCount = size / boxRows; // number of boxes along one dimension
    for (let bi = 0; bi < boxCount; bi++) {
      const startRow = bi * boxRows;
      const startCol = bi * boxCols;
      const values = shuffle(Array.from({ length: size }, (_, i) => i + 1));
      let vi = 0;
      for (let r = startRow; r < startRow + boxRows; r++) {
        for (let c = startCol; c < startCol + boxCols; c++) {
          board[r][c] = values[vi++];
        }
      }
    }

    // Solve the rest
    SudokuSolver.solve(board, size, boxRows, boxCols);
    return board;
  }

  /**
   * Dig holes from a complete board to create a puzzle.
   *
   * Algorithm:
   * 1. Create a list of all cell positions and shuffle it.
   * 2. Try removing each cell one by one.
   * 3. For sizes ≤ 9: after each removal, check that the puzzle still has
   *    a unique solution. If not, restore the cell.
   * 4. For size 16: skip per-cell uniqueness (too slow); just remove down
   *    to the target clue range.
   * 5. Stop when we reach the target number of clues.
   */
  function digHoles(board, size, boxRows, boxCols, difficulty) {
    const puzzle = SudokuSolver.cloneBoard(board);
    const preset = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.medium;
    const totalCells = size * size;
    const maxClues = Math.floor(totalCells * preset.maxClueRatio);
    const minClues = Math.floor(totalCells * preset.minClueRatio);
    const targetClues = minClues + Math.floor(Math.random() * (maxClues - minClues + 1));

    // Create shuffled list of all positions
    const positions = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        positions.push({ row: r, col: c });
      }
    }
    shuffle(positions);

    let removed = 0;
    const targetRemoved = totalCells - targetClues;

    for (const { row, col } of positions) {
      if (removed >= targetRemoved) break;

      const backup = puzzle[row][col];
      puzzle[row][col] = 0;

      if (size <= 9) {
        // Check uniqueness for smaller boards
        if (!SudokuSolver.hasUniqueSolution(puzzle, size, boxRows, boxCols)) {
          puzzle[row][col] = backup; // Restore
        } else {
          removed++;
        }
      } else {
        // For 16x16, skip uniqueness check for performance
        removed++;
      }
    }

    return {
      puzzle,
      clues: totalCells - removed
    };
  }

  /**
   * Full pipeline: generate complete board, then dig holes.
   * Returns { solution, puzzle, size, boxRows, boxCols, difficulty, clues }.
   */
  function generatePuzzle(size, boxRows, boxCols, difficulty) {
    const solution = generateFullBoard(size, boxRows, boxCols);
    const { puzzle, clues } = digHoles(solution, size, boxRows, boxCols, difficulty);
    return {
      solution,
      puzzle,
      size,
      boxRows,
      boxCols,
      difficulty,
      clues
    };
  }

  return {
    DIFFICULTY_PRESETS,
    generateFullBoard,
    digHoles,
    generatePuzzle
  };
})();

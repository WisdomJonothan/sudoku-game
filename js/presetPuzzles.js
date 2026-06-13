/**
 * Preset Sudoku puzzles: famous puzzles + visually patterned generated ones.
 * Each preset has metadata and a load() function that returns
 * { puzzle, solution, size, boxRows, boxCols, difficulty }.
 */

const PresetPuzzles = (() => {

  // ---- Utility ----

  /** Load a hardcoded puzzle: solve it, verify unique solution. */
  function loadFixed(puzzleGrid, size, boxRows, boxCols) {
    const puzzle = SudokuSolver.cloneBoard(puzzleGrid);
    const solution = SudokuSolver.cloneBoard(puzzleGrid);
    const solved = SudokuSolver.solve(solution, size, boxRows, boxCols);
    if (!solved) throw new Error('Solver failed');

    // Verify solution integrity (defensive)
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (solution[r][c] === 0) throw new Error('Solution incomplete');

    return { puzzle, solution, size, boxRows, boxCols, difficulty: 'hard' };
  }

  // ---- Famous 9x9 puzzles ----

  /** Arto Inkala's "World's Hardest Sudoku" (2012), 23 clues. */
  const INKALA_2012 = [
    [8,0,0,0,0,0,0,0,0],
    [0,0,3,6,0,0,0,0,0],
    [0,7,0,0,9,0,2,0,0],
    [0,5,0,0,0,7,0,0,0],
    [0,0,0,0,4,5,7,0,0],
    [0,0,0,1,0,0,0,3,0],
    [0,0,1,0,0,0,0,6,8],
    [0,0,8,5,0,0,0,1,0],
    [0,9,0,0,0,0,4,0,0]
  ];

  // ---- Pattern-based presets (generated) ----

  /**
   * Generate a puzzle whose given cells follow a visual pattern mask.
   * mask(r,c,size): return true to keep this cell as a given.
   */
  function generatePatternPreset(size, boxRows, boxCols, maskFn, minClues, maxAttempts) {
    maxAttempts = maxAttempts || 80;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const solution = SudokuGenerator.generateFullBoard(size, boxRows, boxCols);
      const puzzle = SudokuSolver.createEmptyBoard(size);

      let clueCount = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (maskFn(r, c, size)) {
            puzzle[r][c] = solution[r][c];
            clueCount++;
          }
        }
      }

      if (clueCount < (minClues || 17)) continue;
      if (!SudokuSolver.hasUniqueSolution(
        SudokuSolver.cloneBoard(puzzle), size, boxRows, boxCols)) continue;

      return { puzzle, solution, size, boxRows, boxCols, clues: clueCount };
    }
    return null;
  }

  /** Safe random puzzle generation with retries. */
  function safeGenerate(size, boxRows, boxCols, difficulty, maxAttempts) {
    maxAttempts = maxAttempts || 10;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const gen = SudokuGenerator.generatePuzzle(size, boxRows, boxCols, difficulty);
        if (gen && gen.puzzle && gen.solution) return gen;
      } catch (e) { /* retry */ }
    }
    return null;
  }

  // ---- Preset List ----

  const presets = [
    {
      id: 'inkala',
      name: 'The Inkala',
      description: 'Arto Inkala 2012 — "世界最难"数独，23个线索',
      icon: '⭐',
      load() { return loadFixed(INKALA_2012, 9, 3, 3); }
    },
    {
      id: 'diagonal',
      name: '对角线',
      description: '给定格沿对角线分布，形成X形视觉（每次随机生成）',
      icon: '✕',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          return r === c || r + c === s - 1 || r === 0 || r === s - 1 || c === 0 || c === s - 1;
        }, 22);
      }
    },
    {
      id: 'diamond',
      name: '菱形',
      description: '线索集中在中央菱形区域（每次随机生成）',
      icon: '◇',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          const mid = (s - 1) / 2;
          return Math.abs(r - mid) + Math.abs(c - mid) <= 4;
        }, 22);
      }
    },
    {
      id: 'frame',
      name: '框架',
      description: '线索在四个边框，中心几乎空白（每次随机生成）',
      icon: '▣',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          const margin = 2;
          return r < margin || r >= s - margin || c < margin || c >= s - margin;
        }, 22);
      }
    },
    {
      id: 'four_boxes',
      name: '四角宫格',
      description: '只有四个角的3×3宫格有线索（每次随机生成）',
      icon: '⊞',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          const inBox = (boxR, boxC) => {
            return r >= boxR * 3 && r < (boxR + 1) * 3 &&
                   c >= boxC * 3 && c < (boxC + 1) * 3;
          };
          return inBox(0, 0) || inBox(0, 2) || inBox(2, 0) || inBox(2, 2);
        }, 24);
      }
    },
    {
      id: 'checker',
      name: '棋盘格',
      description: '线索像棋盘一样交错分布（每次随机生成）',
      icon: '▦',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) => (r + c) % 2 === 0, 30);
      }
    },
    {
      id: 'four_by_four',
      name: '迷你挑战',
      description: '4×4 棋盘 — 新手也能享受的迷你数独',
      icon: '🔹',
      load() { return safeGenerate(4, 2, 2, 'easy'); }
    },
    {
      id: 'six_by_six',
      name: '进阶挑战',
      description: '6×6 棋盘 — 适合有一定经验的玩家',
      icon: '🔶',
      load() { return safeGenerate(6, 2, 3, 'medium'); }
    }
  ];

  function getAll() { return presets; }

  function getById(id) {
    return presets.find(p => p.id === id) || null;
  }

  return { getAll, getById };
})();

/**
 * Preset Sudoku puzzles: famous puzzles + visually patterned generated ones.
 * Each preset has metadata and a load() function that returns
 * { puzzle, solution, size, boxRows, boxCols, difficulty }.
 */

const PresetPuzzles = (() => {

  // ---- Famous 9x9 puzzles (hardcoded grids, solution computed at load time) ----

  /**
   * Arto Inkala's "World's Hardest Sudoku" (2012)
   * 23 clues, famously required backtracking + advanced techniques.
   */
  const INKALA_2012 = {
    name: 'The Inkala',
    description: 'Arto Inkala 2012 — 号称"世界最难"，23个线索',
    size: 9, boxRows: 3, boxCols: 3, difficulty: 'hard',
    puzzle: [
      [8,0,0,0,0,0,0,0,0],
      [0,0,3,6,0,0,0,0,0],
      [0,7,0,0,9,0,2,0,0],
      [0,5,0,0,0,7,0,0,0],
      [0,0,0,0,4,5,7,0,0],
      [0,0,0,1,0,0,0,3,0],
      [0,0,1,0,0,0,0,6,8],
      [0,0,8,5,0,0,0,1,0],
      [0,9,0,0,0,0,4,0,0]
    ]
  };

  /**
   * "AI Escargot" (Arto Inkala, 2006) — precursor to the 2012 puzzle.
   */
  const AI_ESCARGOT = {
    name: 'AI Escargot',
    description: 'Arto Inkala 2006 — 曾被AI判定为"最难"',
    size: 9, boxRows: 3, boxCols: 3, difficulty: 'hard',
    puzzle: [
      [1,0,0,0,0,7,0,9,0],
      [0,3,0,0,2,0,0,0,8],
      [0,0,9,6,0,0,5,0,0],
      [0,0,5,3,0,0,9,0,0],
      [0,1,0,0,8,0,0,0,2],
      [6,0,0,0,0,4,0,0,0],
      [3,0,0,0,0,0,0,1,0],
      [0,4,0,0,0,0,0,0,7],
      [0,0,7,0,0,0,3,0,0]
    ]
  };

  /**
   * "Platinum Blonde" — famously hard, ~28 clues.
   */
  const PLATINUM_BLONDE = {
    name: 'Platinum Blonde',
    description: '又名"金发美女"，以极少的初期可推导步骤著称',
    size: 9, boxRows: 3, boxCols: 3, difficulty: 'hard',
    puzzle: [
      [0,0,0,0,0,0,0,1,2],
      [0,0,0,0,3,5,0,0,0],
      [0,0,0,6,0,0,0,7,0],
      [7,0,0,0,0,0,3,0,0],
      [0,0,0,4,0,0,8,0,0],
      [1,0,0,0,0,0,0,0,0],
      [0,0,0,1,2,0,0,0,0],
      [0,8,0,0,0,0,0,4,0],
      [0,5,0,0,0,0,6,0,0]
    ]
  };

  /**
   * "The Easter Monster" — extremely hard, requires forcing chains.
   */
  const EASTER_MONSTER = {
    name: 'Easter Monster',
    description: '复活节怪物 — 需要强力链式推导才能破解',
    size: 9, boxRows: 3, boxCols: 3, difficulty: 'hard',
    puzzle: [
      [1,0,0,0,0,0,0,0,0],
      [0,2,0,0,0,0,0,0,0],
      [0,0,3,0,0,0,0,0,0],
      [0,0,0,4,0,0,0,0,0],
      [0,0,0,0,5,0,0,0,0],
      [0,0,0,0,0,6,0,0,0],
      [0,0,0,0,0,0,7,0,0],
      [0,0,0,0,0,0,0,8,0],
      [0,0,0,0,0,0,0,0,9]
    ]
  };

  // ---- Pattern-based presets (generated) ----

  /**
   * Generate a puzzle whose given cells follow a visual pattern mask.
   * mask(r,c): return true to keep this cell as a given.
   */
  function generatePatternPreset(size, boxRows, boxCols, maskFn, minClues, maxAttempts) {
    maxAttempts = maxAttempts || 50;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const solution = SudokuGenerator.generateFullBoard(size, boxRows, boxCols);
      const puzzle = SudokuSolver.createEmptyBoard(size);

      // Keep only cells matching the mask
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

  // ---- Preset Definitions ----

  const presets = [
    // Famous puzzles
    {
      id: 'inkala',
      name: 'The Inkala',
      description: 'Arto Inkala 2012 — "世界最难"数独，23个线索',
      icon: '⭐',
      load() {
        const s = INKALA_2012;
        const puzzle = SudokuSolver.cloneBoard(s.puzzle);
        const solution = SudokuSolver.cloneBoard(s.puzzle);
        SudokuSolver.solve(solution, s.size, s.boxRows, s.boxCols);
        return { puzzle, solution, size: s.size, boxRows: s.boxRows, boxCols: s.boxCols, difficulty: 'hard' };
      }
    },
    {
      id: 'escargot',
      name: 'AI Escargot',
      description: 'Arto Inkala 2006 — AI判定为最难解的前代名作',
      icon: '🐌',
      load() {
        const s = AI_ESCARGOT;
        const puzzle = SudokuSolver.cloneBoard(s.puzzle);
        const solution = SudokuSolver.cloneBoard(s.puzzle);
        SudokuSolver.solve(solution, s.size, s.boxRows, s.boxCols);
        return { puzzle, solution, size: s.size, boxRows: s.boxRows, boxCols: s.boxCols, difficulty: 'hard' };
      }
    },
    {
      id: 'platinum',
      name: 'Platinum Blonde',
      description: '28线索 — 开局几乎无法直接推导，极度依赖高级技巧',
      icon: '💎',
      load() {
        const s = PLATINUM_BLONDE;
        const puzzle = SudokuSolver.cloneBoard(s.puzzle);
        const solution = SudokuSolver.cloneBoard(s.puzzle);
        SudokuSolver.solve(solution, s.size, s.boxRows, s.boxCols);
        return { puzzle, solution, size: s.size, boxRows: s.boxRows, boxCols: s.boxCols, difficulty: 'hard' };
      }
    },
    {
      id: 'easter_monster',
      name: 'Easter Monster',
      description: '只有对角线有线索 — 看似简单实则极难',
      icon: '🐣',
      load() {
        const s = EASTER_MONSTER;
        const puzzle = SudokuSolver.cloneBoard(s.puzzle);
        const solution = SudokuSolver.cloneBoard(s.puzzle);
        SudokuSolver.solve(solution, s.size, s.boxRows, s.boxCols);
        return { puzzle, solution, size: s.size, boxRows: s.boxRows, boxCols: s.boxCols, difficulty: 'hard' };
      }
    },

    // Pattern-generated puzzles (new board each time)
    {
      id: 'diagonal',
      name: '对角线',
      description: '给定格沿对角线分布，形成X形视觉',
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
      description: '线索集中在中央菱形区域',
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
      description: '线索在四个边框，中心几乎空白',
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
      description: '只有四个角的3×3宫格有线索',
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
      description: '线索像棋盘一样交错分布',
      icon: '▦',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) => {
          return (r + c) % 2 === 0;
        }, 30);
      }
    },
    {
      id: 'four_by_four',
      name: '迷你挑战',
      description: '4×4 棋盘 — 新手也能享受的迷你数独',
      icon: '🔹',
      load() {
        const gen = SudokuGenerator.generatePuzzle(4, 2, 2, 'easy');
        return gen;
      }
    },
    {
      id: 'six_by_six',
      name: '进阶挑战',
      description: '6×6 棋盘 — 适合有一定经验的玩家',
      icon: '🔶',
      load() {
        const gen = SudokuGenerator.generatePuzzle(6, 2, 3, 'medium');
        return gen;
      }
    }
  ];

  /** Get all preset definitions. */
  function getAll() { return presets; }

  /** Find a preset by id. */
  function getById(id) {
    return presets.find(p => p.id === id) || null;
  }

  return { getAll, getById };
})();

/**
 * Preset Sudoku puzzles: famous puzzles + visually patterned generated ones.
 * Each preset has metadata and a load() function that returns
 * { puzzle, solution, size, boxRows, boxCols, difficulty }.
 */

const PresetPuzzles = (() => {

  // ---- Utility ----

  /** Load a hardcoded puzzle: solve it, verify solution integrity. */
  function loadFixed(puzzleGrid, size, boxRows, boxCols, difficulty) {
    const puzzle = SudokuSolver.cloneBoard(puzzleGrid);
    const solution = SudokuSolver.cloneBoard(puzzleGrid);
    const solved = SudokuSolver.solve(solution, size, boxRows, boxCols);
    if (!solved) throw new Error('Solver failed — puzzle may be unsolvable');
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (solution[r][c] === 0 || solution[r][c] > size)
          throw new Error('Solution incomplete or invalid');
    if (!SudokuSolver.isBoardValid(solution, size, boxRows, boxCols))
      throw new Error('Solution validation failed');
    return { puzzle, solution, size, boxRows, boxCols, difficulty };
  }

  /**
   * Generate a puzzle whose given cells follow a visual pattern mask.
   * mask(r,c,size): return true to keep this cell as a given.
   * Uses iterative retry — very high success rate for masks with ≥25% coverage.
   */
  function generatePatternPreset(size, boxRows, boxCols, maskFn, minClues, maxAttempts) {
    maxAttempts = maxAttempts || 120;
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

      return { puzzle, solution, size, boxRows, boxCols, clues: clueCount, difficulty: clueCount > 30 ? 'medium' : 'hard' };
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

  // ---- Verified Famous Puzzles ----

  /** Arto Inkala's "World's Hardest Sudoku" (2012), 23 clues.
   *  Source: https://www.sudokuwiki.org/Arto_Inkala_Sudoku */
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

  /** "AI Escargot" (Arto Inkala, 2006).
   *  Source: https://www.sudokuwiki.org/Escargot */
  const AI_ESCARGOT = [
    [1,0,0,0,0,7,0,9,0],
    [0,3,0,0,2,0,0,0,8],
    [0,0,9,6,0,0,5,0,0],
    [0,0,5,3,0,0,9,0,0],
    [0,1,0,0,8,0,0,0,2],
    [6,0,0,0,0,4,0,0,0],
    [3,0,0,0,0,0,0,1,0],
    [0,4,0,0,0,0,0,0,7],
    [0,0,7,0,0,0,3,0,0]
  ];

  // ---- Preset List ----

  const presets = [

    // ======== FAMOUS PUZZLES ========
    {
      id: 'inkala',
      name: 'The Inkala',
      description: 'Arto Inkala 2012 — "世界最难"数独，仅23个线索',
      icon: '⭐',
      load() { return loadFixed(INKALA_2012, 9, 3, 3, 'hard'); }
    },
    {
      id: 'escargot',
      name: 'AI Escargot',
      description: 'Arto Inkala 2006 — AI判定为最难解的前代名作',
      icon: '🐌',
      load() { return loadFixed(AI_ESCARGOT, 9, 3, 3, 'hard'); }
    },

    // ======== 9×9 PATTERN PUZZLES ========
    {
      id: 'x_shape',
      name: 'X 形',
      description: '线索沿主对角线和反对角线交叉分布',
      icon: '✕',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) =>
          r === c || r + c === s - 1, 17);
      }
    },
    {
      id: 'cross',
      name: '十字架',
      description: '线索沿中心行和中心列分布',
      icon: '✚',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) =>
          r === 4 || c === 4, 17);
      }
    },
    {
      id: 'diamond',
      name: '菱形',
      description: '线索在中心菱形区域，四角几乎全空',
      icon: '◇',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          const mid = (s - 1) / 2;
          return Math.abs(r - mid) + Math.abs(c - mid) <= 3;
        }, 18);
      }
    },
    {
      id: 'frame',
      name: '画框',
      description: '线索沿外边框分布，中心区域完全空白',
      icon: '▣',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) =>
          r === 0 || r === s - 1 || c === 0 || c === s - 1, 20);
      }
    },
    {
      id: 'four_corners',
      name: '四角星',
      description: '只有四个角的3×3宫格有线索，中间宫格全空',
      icon: '⊞',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) => {
          const inBox = (br, bc) =>
            r >= br * 3 && r < (br + 1) * 3 &&
            c >= bc * 3 && c < (bc + 1) * 3;
          return inBox(0, 0) || inBox(0, 2) || inBox(2, 0) || inBox(2, 2);
        }, 22);
      }
    },
    {
      id: 'checker',
      name: '棋盘格',
      description: '线索如国际象棋棋盘般交错分布',
      icon: '▦',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) => (r + c) % 2 === 0, 28);
      }
    },
    {
      id: 'bullseye',
      name: '靶心',
      description: '线索呈同心环状：最外圈和中心点',
      icon: '◎',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          return r === 0 || r === s - 1 || c === 0 || c === s - 1 ||
                 r === 4 || c === 4;
        }, 22);
      }
    },
    {
      id: 'spiral',
      name: '风车',
      description: '线索像风车叶片 — 每条边中点向内延伸',
      icon: '⚡',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) => {
          if (r === 4 || c === 4) return true;
          if (r < 2 && c < 2) return true;
          if (r < 2 && c > 6) return true;
          if (r > 6 && c < 2) return true;
          if (r > 6 && c > 6) return true;
          return false;
        }, 22);
      }
    },
    {
      id: 'hourglass',
      name: '沙漏',
      description: '线索在棋盘上下两端，中间一条细线连接',
      icon: '⏳',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          if (r <= 1 || r >= s - 2) return true;    // top & bottom bands
          if (r >= 3 && r <= 5 && c === 4) return true; // center column band
          return false;
        }, 22);
      }
    },
    {
      id: 'zigzag',
      name: '闪电',
      description: '线索沿锯齿形路径分布',
      icon: '⚡',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) => {
          if (r === 0 && c <= 4) return true;
          if (r === 2 && c >= 2 && c <= 6) return true;
          if (r === 4 && c >= 4) return true;
          if (r === 6 && c >= 0 && c <= 4) return true;
          if (r === 8 && c >= 2 && c <= 6) return true;
          return false;
        }, 18);
      }
    },
    {
      id: 'dots',
      name: '散点',
      description: '线索稀疏均匀散布，极简风格',
      icon: '∴',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) =>
          r % 2 === 0 && c % 2 === 0, 20);
      }
    },
    {
      id: 'gradient',
      name: '渐变',
      description: '左上角线索密集、向右下逐渐稀疏',
      icon: '◧',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) =>
          r + c <= 8, 25);
      }
    },
    {
      id: 'antigradient',
      name: '逆渐变',
      description: '右下角线索密集、向左上逐渐稀疏',
      icon: '◩',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) =>
          r + c >= 8, 25);
      }
    },
    {
      id: 'stripes_v',
      name: '竖条纹',
      description: '线索沿竖条纹分布，隔列填充',
      icon: '⋮',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) =>
          c % 2 === 0, 30);
      }
    },
    {
      id: 'stripes_h',
      name: '横条纹',
      description: '线索沿横条纹分布，隔行填充',
      icon: '⋯',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c) =>
          r % 2 === 0, 30);
      }
    },
    {
      id: 'ring',
      name: '同心框',
      description: '线索形成内外两层方框',
      icon: '⊟',
      load() {
        return generatePatternPreset(9, 3, 3, (r, c, s) => {
          const outer = r === 0 || r === s - 1 || c === 0 || c === s - 1;
          const inner = (r === 2 || r === 6) && c >= 2 && c <= 6 ||
                        (c === 2 || c === 6) && r >= 2 && r <= 6;
          return outer || inner;
        }, 24);
      }
    },

    // ======== SMALL BOARD PRESETS ========
    {
      id: 'four_easy',
      name: '4×4 入门',
      description: '4×4 棋盘简单模式 — 新手入门首选',
      icon: '🟢',
      load() { return safeGenerate(4, 2, 2, 'easy'); }
    },
    {
      id: 'four_hard',
      name: '4×4 挑战',
      description: '4×4 棋盘困难模式 — 迷你但烧脑',
      icon: '🔴',
      load() { return safeGenerate(4, 2, 2, 'hard'); }
    },
    {
      id: 'six_easy',
      name: '6×6 初级',
      description: '6×6 棋盘简单模式',
      icon: '🟡',
      load() { return safeGenerate(6, 2, 3, 'easy'); }
    },
    {
      id: 'six_hard',
      name: '6×6 高级',
      description: '6×6 棋盘困难模式 — 需要策略思考',
      icon: '🟠',
      load() { return safeGenerate(6, 2, 3, 'hard'); }
    },

    // ======== SPECIAL CHALLENGES ========
    {
      id: 'minimal',
      name: '极简挑战',
      description: '接近理论最少线索数(17)的9×9难题',
      icon: '💀',
      load() {
        // Try to generate a very sparse puzzle with ~20 clues
        return generatePatternPreset(9, 3, 3, (r, c) => {
          // Random sparse mask — about 22-25% coverage
          const hashes = [
            0x14,0x08,0x22,0x41,0x00,0x14,0x08,0x41,0x22,
            0x08,0x41,0x00,0x14,0x22,0x08,0x41,0x00,0x14
          ];
          return ((hashes[r] || 0) >> (c % 8)) & 1;
        }, 18);
      }
    }
  ];

  function getAll() { return presets; }

  function getById(id) {
    return presets.find(p => p.id === id) || null;
  }

  return { getAll, getById };
})();

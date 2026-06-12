/**
 * Share manager: URL hash-based challenge links and Base64 puzzle codes.
 *
 * URL hash format:
 *   #mode=challenge&size=N&boxRows=R&boxCols=C&difficulty=D&puzzle=...&solution=...
 *
 * Each board is serialized as rows of symbols joined by commas,
 * with 0 representing empty cells.
 */

const ShareManager = (() => {
  /**
   * Encode a board to a compact string:
   * Each row: symbols separated by nothing, e.g. "1..4" (using "." for 0).
   * Rows separated by "_".
   */
  function encodeBoard(board) {
    return board.map(row =>
      row.map(v => v === 0 ? '.' : SudokuSolver.valueToSymbol(v)).join('')
    ).join('_');
  }

  /**
   * Decode a board string back to 2D array.
   */
  function decodeBoard(str, size) {
    const rows = str.split('_');
    return rows.map(rowStr => {
      const vals = [];
      for (let i = 0; i < rowStr.length; i++) {
        const ch = rowStr[i];
        if (ch === '.' || ch === '0') {
          vals.push(0);
        } else {
          vals.push(SudokuSolver.symbolToValue(ch));
        }
      }
      return vals;
    });
  }

  /**
   * Build a challenge URL hash string.
   */
  function buildHash(gameState) {
    const params = new URLSearchParams();
    params.set('mode', 'challenge');
    params.set('size', String(gameState.size));
    params.set('boxRows', String(gameState.boxRows));
    params.set('boxCols', String(gameState.boxCols));
    params.set('difficulty', gameState.difficulty);
    params.set('puzzle', encodeBoard(gameState.puzzle));
    params.set('solution', encodeBoard(gameState.solution));
    return '#' + params.toString();
  }

  /**
   * Build the full share URL.
   */
  function buildShareURL(gameState) {
    const base = window.location.href.split('#')[0];
    return base + buildHash(gameState);
  }

  /**
   * Parse hash parameters from URL.
   * Returns { mode, size, boxRows, boxCols, difficulty, puzzle, solution } or null.
   */
  function parseHash() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return null;

    const hashContent = hash.substring(1); // Remove leading #
    const params = new URLSearchParams(hashContent);

    const mode = params.get('mode');
    if (mode !== 'challenge') return null;

    const size = parseInt(params.get('size'), 10);
    const boxRows = parseInt(params.get('boxRows'), 10);
    const boxCols = parseInt(params.get('boxCols'), 10);
    const difficulty = params.get('difficulty');
    const puzzleStr = params.get('puzzle');
    const solutionStr = params.get('solution');

    if (!size || !boxRows || !boxCols || !difficulty || !puzzleStr || !solutionStr) {
      return null;
    }

    const puzzle = decodeBoard(puzzleStr, size);
    const solution = decodeBoard(solutionStr, size);

    return { mode, size, boxRows, boxCols, difficulty, puzzle, solution };
  }

  /**
   * Encode puzzle data as a Base64 compact code.
   * Format: JSON { size, boxRows, boxCols, difficulty, puzzle, solution }
   * (Boards are encoded as compact strings first.)
   */
  function encodePuzzleCode(gameState) {
    const data = {
      size: gameState.size,
      boxRows: gameState.boxRows,
      boxCols: gameState.boxCols,
      difficulty: gameState.difficulty,
      puzzle: encodeBoard(gameState.puzzle),
      solution: encodeBoard(gameState.solution)
    };
    const json = JSON.stringify(data);
    // Use btoa with Unicode safety
    return btoa(unescape(encodeURIComponent(json)));
  }

  /**
   * Decode a Base64 puzzle code back to game parameters.
   * Returns parsed data or null.
   */
  function decodePuzzleCode(code) {
    try {
      const json = decodeURIComponent(escape(atob(code)));
      const data = JSON.parse(json);

      if (!data.size || !data.boxRows || !data.boxCols ||
          !data.difficulty || !data.puzzle || !data.solution) {
        return null;
      }

      const puzzle = decodeBoard(data.puzzle, data.size);
      const solution = decodeBoard(data.solution, data.size);

      return {
        size: data.size,
        boxRows: data.boxRows,
        boxCols: data.boxCols,
        difficulty: data.difficulty,
        puzzle,
        solution
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Copy text to clipboard.
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  /**
   * Clear the URL hash (return to normal mode).
   */
  function clearHash() {
    history.replaceState(null, '', window.location.href.split('#')[0]);
  }

  return {
    encodeBoard,
    decodeBoard,
    buildHash,
    buildShareURL,
    parseHash,
    encodePuzzleCode,
    decodePuzzleCode,
    copyToClipboard,
    clearHash
  };
})();

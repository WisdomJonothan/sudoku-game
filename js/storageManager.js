/**
 * localStorage manager: save/load game, export/import JSON, history.
 */

const StorageManager = (() => {
  const SAVE_KEY = 'sudoku_saved_game';
  const HISTORY_KEY = 'sudoku_history';
  const MAX_HISTORY = 50;

  /**
   * Save current game state to localStorage.
   */
  function saveGame(gameState) {
    try {
      const data = gameState.toJSON();
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  }

  /**
   * Load saved game state from localStorage.
   * Returns a GameState instance or null.
   */
  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return GameState.fromJSON(data);
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }

  /**
   * Check if a saved game exists.
   */
  function hasSavedGame() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Delete the saved game.
   */
  function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Export game state as a JSON string (for file download).
   */
  function exportJSON(gameState) {
    return JSON.stringify(gameState.toJSON(), null, 2);
  }

  /**
   * Validate imported JSON data structure.
   * Returns { valid, error, gameState }.
   */
  function validateImportJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);

      // Required fields
      const required = ['size', 'boxRows', 'boxCols', 'difficulty', 'puzzle', 'solution', 'board'];
      for (const key of required) {
        if (!(key in data)) {
          return { valid: false, error: `Missing field: ${key}` };
        }
      }

      // Validate size
      if (![4, 6, 9, 16].includes(data.size)) {
        return { valid: false, error: `Invalid size: ${data.size}. Must be 4, 6, 9, or 16.` };
      }

      // Validate board dimensions
      const s = data.size;
      const validate2D = (arr, name) => {
        if (!Array.isArray(arr) || arr.length !== s) {
          return `Invalid ${name}: expected ${s}x${s} array`;
        }
        for (let r = 0; r < s; r++) {
          if (!Array.isArray(arr[r]) || arr[r].length !== s) {
            return `Invalid ${name}: row ${r} length != ${s}`;
          }
        }
        return null;
      };

      let err = validate2D(data.puzzle, 'puzzle');
      if (err) return { valid: false, error: err };
      err = validate2D(data.solution, 'solution');
      if (err) return { valid: false, error: err };
      err = validate2D(data.board, 'board');
      if (err) return { valid: false, error: err };

      // Validate values are within range
      for (let r = 0; r < s; r++) {
        for (let c = 0; c < s; c++) {
          if (data.solution[r][c] < 0 || data.solution[r][c] > s) {
            return { valid: false, error: `Invalid solution value at (${r},${c})` };
          }
        }
      }

      const gameState = GameState.fromJSON(data);
      return { valid: true, error: null, gameState };
    } catch (e) {
      return { valid: false, error: `Invalid JSON: ${e.message}` };
    }
  }

  /**
   * Save a completed game result to history.
   */
  function saveResult(result) {
    try {
      const history = getHistory();
      history.unshift(result);
      if (history.length > MAX_HISTORY) {
        history.length = MAX_HISTORY;
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }

  /**
   * Get history array.
   */
  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear history.
   */
  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }

  /**
   * Format elapsed seconds as HH:MM:SS.
   */
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      String(h).padStart(2, '0'),
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].join(':');
  }

  /**
   * Format a date string to a readable format.
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString();
  }

  return {
    saveGame,
    loadGame,
    hasSavedGame,
    clearSavedGame,
    exportJSON,
    validateImportJSON,
    saveResult,
    getHistory,
    clearHistory,
    formatTime,
    formatDate
  };
})();

/**
 * Main entry point for Sudoku game.
 * Handles initialization, share link detection, save/load, and wiring modules together.
 */

(function () {
  'use strict';

  /**
   * Get box dimensions for a given board size.
   */
  function getBoxRC(size) {
    const map = {
      4:  { boxRows: 2, boxCols: 2 },
      6:  { boxRows: 2, boxCols: 3 },
      9:  { boxRows: 3, boxCols: 3 },
      16: { boxRows: 4, boxCols: 4 }
    };
    return map[size] || { boxRows: 3, boxCols: 3 };
  }

  /**
   * Start a new game based on current selector values.
   * Stores gameState on window._sudokuGameState so all modules share the reference.
   */
  function startNewGame() {
    const size = parseInt(document.getElementById('size-select').value, 10);
    const difficulty = document.getElementById('difficulty-select').value;
    const boxRC = getBoxRC(size);

    const result = SudokuGenerator.generatePuzzle(size, boxRC.boxRows, boxRC.boxCols, difficulty);
    window._sudokuGameState = new GameState(
      result.size, result.boxRows, result.boxCols,
      result.difficulty, result.puzzle, result.solution
    );

    StorageManager.saveGame(window._sudokuGameState);
    UIController.setGameState(window._sudokuGameState);
  }

  /**
   * Initialize game: check for share link -> saved game -> new game.
   */
  function init() {
    // 1. Check for challenge shared via URL hash
    const hashData = ShareManager.parseHash();
    if (hashData) {
      window._sudokuGameState = new GameState(
        hashData.size, hashData.boxRows, hashData.boxCols,
        hashData.difficulty, hashData.puzzle, hashData.solution
      );
      window._sudokuGameState.isChallenge = true;
      document.getElementById('size-select').value = String(hashData.size);
      document.getElementById('difficulty-select').value = hashData.difficulty;
      StorageManager.saveGame(window._sudokuGameState);
      UIController.init(window._sudokuGameState);
      UIController.showNotification('已加载同题挑战！');
      return;
    }

    // 2. Check for saved game
    const saved = StorageManager.loadGame();
    if (saved && !saved.completed) {
      window._sudokuGameState = saved;
      document.getElementById('size-select').value = String(saved.size);
      document.getElementById('difficulty-select').value = saved.difficulty;
      UIController.init(window._sudokuGameState);
      UIController.showNotification('已恢复上次进度');
      return;
    }

    // 3. Start new game with default settings
    startNewGame();
  }

  /**
   * Handle window beforeunload: save game state.
   */
  window.addEventListener('beforeunload', () => {
    if (window._sudokuGameState && !window._sudokuGameState.completed) {
      StorageManager.saveGame(window._sudokuGameState);
    }
  });

  /**
   * Handle page visibility change: save when hidden (mobile tab switch).
   */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && window._sudokuGameState && !window._sudokuGameState.completed) {
      StorageManager.saveGame(window._sudokuGameState);
    }
  });

  // Expose startNewGame globally
  window.startNewGame = startNewGame;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

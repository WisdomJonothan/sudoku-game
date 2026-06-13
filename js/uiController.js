/**
 * UI Controller: DOM rendering, event handling, dialogs, panels.
 * Reads/writes the shared gameState via window._sudokuGameState.
 */

const UIController = (() => {
  let selectedRow = -1;
  let selectedCol = -1;
  let notesMode = false;
  let timerInterval = null;
  let els = {};
  let modalCallback = null;
  let notificationTimeout = null;
  let _initialized = false;

  // Shorthand accessors for the shared game state
  function gs()  { return window._sudokuGameState; }
  function sGs(v) { window._sudokuGameState = v; }

  function ensureInit() {
    if (!_initialized) { cacheDOM(); attachListeners(); _initialized = true; }
  }

  function getBoxRC(size) {
    const map = {
      4:  { boxRows: 2, boxCols: 2 },
      6:  { boxRows: 2, boxCols: 3 },
      9:  { boxRows: 3, boxCols: 3 },
      16: { boxRows: 4, boxCols: 4 }
    };
    return map[size] || { boxRows: 3, boxCols: 3 };
  }

  /** Initialize UI, cache DOM elements, attach event listeners. */
  function init(state) {
    sGs(state);
    ensureInit();
    render();
  }

  /** Update game state reference (e.g. after loading a save / new game). */
  function setGameState(state) {
    sGs(state);
    ensureInit();
    selectedRow = -1;
    selectedCol = -1;
    notesMode = false;
    updateNotesToggle();
    startTimer();
    render();
  }

  function cacheDOM() {
    els.board           = document.getElementById('sudoku-board');
    els.timer           = document.getElementById('timer');
    els.errorCount      = document.getElementById('error-count');
    els.moveCount       = document.getElementById('move-count');
    els.numberPad       = document.getElementById('number-pad');
    els.notesToggle     = document.getElementById('notes-toggle');
    els.undoBtn         = document.getElementById('btn-undo');
    els.redoBtn         = document.getElementById('btn-redo');
    els.hintBtn         = document.getElementById('btn-hint');
    els.checkBtn        = document.getElementById('btn-check');
    els.showSolutionBtn = document.getElementById('btn-show-solution');
    els.newGameBtn      = document.getElementById('btn-new-game');
    els.saveBtn         = document.getElementById('btn-save');
    els.loadBtn         = document.getElementById('btn-load');
    els.exportBtn       = document.getElementById('btn-export');
    els.importBtn       = document.getElementById('btn-import');
    els.importFile      = document.getElementById('import-file');
    els.shareLinkBtn    = document.getElementById('btn-share-link');
    els.shareCodeBtn    = document.getElementById('btn-share-code');
    els.importCodeBtn   = document.getElementById('btn-import-code');
    els.historyBtn      = document.getElementById('btn-history');
    els.resultPanel     = document.getElementById('result-panel');
    els.resultContent   = document.getElementById('result-content');
    els.resultClose     = document.getElementById('result-close');
    els.resultShareBtn  = document.getElementById('result-share-btn');
    els.historyPanel    = document.getElementById('history-panel');
    els.historyContent  = document.getElementById('history-content');
    els.historyClose    = document.getElementById('history-close');
    els.historyClear    = document.getElementById('history-clear');
    els.modalOverlay    = document.getElementById('modal-overlay');
    els.modalTitle      = document.getElementById('modal-title');
    els.modalBody       = document.getElementById('modal-body');
    els.modalInput      = document.getElementById('modal-input');
    els.modalConfirm    = document.getElementById('modal-confirm');
    els.modalCancel     = document.getElementById('modal-cancel');
    els.sizeSelect      = document.getElementById('size-select');
    els.difficultySelect = document.getElementById('difficulty-select');
    els.notification    = document.getElementById('notification');
  }

  function attachListeners() {
    document.addEventListener('keydown', handleKeyboard);

    // New game — delegate to main.js
    els.newGameBtn.addEventListener('click', () => {
      if (typeof window.startNewGame === 'function') {
        window.startNewGame();
      }
    });

    els.undoBtn.addEventListener('click', () => {
      if (gs().undo()) saveAndRender();
    });

    els.redoBtn.addEventListener('click', () => {
      if (gs().redo()) saveAndRender();
    });

    els.hintBtn.addEventListener('click', () => {
      const hint = gs().getHint();
      if (hint) {
        selectedRow = hint.row;
        selectedCol = hint.col;
        saveAndRender();
      }
    });

    els.checkBtn.addEventListener('click', () => {
      const errors = gs().getErrorCells();
      if (errors.length === 0) {
        const allFilled = gs().board.every(row => row.every(v => v !== 0));
        if (allFilled) {
          gs().completed = true;
          gs().completedAt = gs().completedAt || new Date().toISOString();
          showResult();
        } else {
          showNotification('还有空格未填写');
        }
      } else {
        showNotification(`发现 ${errors.length} 个错误`);
      }
      render();
    });

    els.showSolutionBtn.addEventListener('click', () => {
      if (confirm('确定要查看答案吗？这将被视为使用了提示。')) {
        for (let r = 0; r < gs().size; r++) {
          for (let c = 0; c < gs().size; c++) {
            if (gs().board[r][c] !== gs().solution[r][c]) {
              gs().board[r][c] = gs().solution[r][c];
            }
          }
        }
        gs().usedHint = true;
        saveAndRender();
        showNotification('已显示完整答案');
      }
    });

    els.notesToggle.addEventListener('click', () => {
      notesMode = !notesMode;
      updateNotesToggle();
    });

    els.saveBtn.addEventListener('click', () => {
      StorageManager.saveGame(gs());
      showNotification('进度已保存');
    });

    els.loadBtn.addEventListener('click', () => {
      const saved = StorageManager.loadGame();
      if (saved) {
        setGameState(saved);
        showNotification('进度已加载');
      } else {
        showNotification('没有找到存档');
      }
    });

    els.exportBtn.addEventListener('click', () => {
      const json = StorageManager.exportJSON(gs());
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sudoku-${gs().size}x${gs().size}-${gs().difficulty}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    els.importBtn.addEventListener('click', () => { els.importFile.click(); });

    els.importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = StorageManager.validateImportJSON(ev.target.result);
        if (result.valid) {
          setGameState(result.gameState);
          StorageManager.saveGame(gs());
          showNotification('存档导入成功');
        } else {
          showNotification('存档格式无效: ' + result.error);
        }
      };
      reader.readAsText(file);
      els.importFile.value = '';
    });

    els.shareLinkBtn.addEventListener('click', async () => {
      const url = ShareManager.buildShareURL(gs());
      const ok = await ShareManager.copyToClipboard(url);
      if (ok) {
        showNotification('分享链接已复制到剪贴板！');
      } else {
        showModal('分享链接', `<textarea readonly style="width:100%;height:80px">${url}</textarea>`, null);
      }
    });

    els.shareCodeBtn.addEventListener('click', async () => {
      const code = ShareManager.encodePuzzleCode(gs());
      const ok = await ShareManager.copyToClipboard(code);
      if (ok) {
        showNotification('题目码已复制到剪贴板！');
      } else {
        showModal('题目码', `<textarea readonly style="width:100%;height:60px">${code}</textarea>`, null);
      }
    });

    els.importCodeBtn.addEventListener('click', () => {
      showModal('导入题目码', '<p>请输入题目码（Base64）：</p>',
        (input) => {
          const data = ShareManager.decodePuzzleCode(input);
          if (data) {
            const newState = new GameState(
              data.size, data.boxRows, data.boxCols,
              data.difficulty, data.puzzle, data.solution
            );
            newState.isChallenge = true;
            setGameState(newState);
            StorageManager.saveGame(gs());
            showNotification('题目已加载！');
          } else {
            showNotification('题目码无效');
          }
        }, true);
    });

    els.historyBtn.addEventListener('click', showHistory);

    els.resultClose.addEventListener('click', hideResult);

    els.resultShareBtn.addEventListener('click', async () => {
      const url = ShareManager.buildShareURL(gs());
      await ShareManager.copyToClipboard(url);
      showNotification('分享链接已复制！');
    });

    els.historyClose.addEventListener('click', hideHistory);

    els.historyClear.addEventListener('click', () => {
      if (confirm('确定要清空所有历史记录吗？')) {
        StorageManager.clearHistory();
        hideHistory();
      }
    });

    els.modalCancel.addEventListener('click', hideModal);

    els.modalConfirm.addEventListener('click', () => {
      if (modalCallback) {
        modalCallback(els.modalInput.value);
      }
      hideModal();
    });
  }

  // ---- Keyboard ----

  function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (gs().completed) return;

    const key = e.key;

    // Arrow navigation
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) {
      e.preventDefault();
      const s = gs().size;
      if (selectedRow < 0) { selectedRow = 0; selectedCol = 0; }
      else if (key === 'ArrowUp')    selectedRow = Math.max(0, selectedRow - 1);
      else if (key === 'ArrowDown')  selectedRow = Math.min(s - 1, selectedRow + 1);
      else if (key === 'ArrowLeft')  selectedCol = Math.max(0, selectedCol - 1);
      else if (key === 'ArrowRight') selectedCol = Math.min(s - 1, selectedCol + 1);
      render();
      return;
    }

    // Number/symbol input
    const val = inputKeyToValue(key, gs().size);
    if (val > 0 && selectedRow >= 0 && selectedCol >= 0) {
      e.preventDefault();
      if (notesMode) {
        gs().toggleNote(selectedRow, selectedCol, val);
      } else {
        gs().setCell(selectedRow, selectedCol, val);
      }
      saveAndRender();
      return;
    }

    // Delete
    if (key === 'Delete' || key === 'Backspace') {
      e.preventDefault();
      if (selectedRow >= 0 && selectedCol >= 0 && !gs().isGiven(selectedRow, selectedCol)) {
        gs().notes[selectedRow][selectedCol].clear();
        gs().setCell(selectedRow, selectedCol, 0);
        saveAndRender();
      }
      return;
    }

    // Ctrl+Z / Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        if (gs().redo()) saveAndRender();
      } else {
        if (gs().undo()) saveAndRender();
      }
      return;
    }

    // N to toggle notes
    if (key === 'n' || key === 'N') {
      e.preventDefault();
      notesMode = !notesMode;
      updateNotesToggle();
    }
  }

  function inputKeyToValue(key, size) {
    if (/^[1-9]$/.test(key)) {
      const v = parseInt(key, 10);
      return v <= size ? v : 0;
    }
    if (/^[a-gA-G]$/.test(key) && size === 16) {
      return 10 + key.toUpperCase().charCodeAt(0) - 65;
    }
    return 0;
  }

  // ---- Rendering ----

  function render() {
    renderBoard();
    renderNumberPad();
    renderStats();
    updateUndoRedoButtons();
    updateBoardSizeClass();
    if (gs().completed) showResult();
  }

  function renderBoard() {
    const s = gs().size;
    els.board.innerHTML = '';
    els.board.style.gridTemplateColumns = `repeat(${s}, 1fr)`;

    const sameRow = new Set();
    const sameCol = new Set();
    const sameBox = new Set();
    const errorCells = new Set();

    if (selectedRow >= 0 && selectedCol >= 0) {
      for (let c = 0; c < s; c++) sameRow.add(`${selectedRow},${c}`);
      for (let r = 0; r < s; r++) sameCol.add(`${r},${selectedCol}`);
      const br = Math.floor(selectedRow / gs().boxRows) * gs().boxRows;
      const bc = Math.floor(selectedCol / gs().boxCols) * gs().boxCols;
      for (let r = br; r < br + gs().boxRows; r++) {
        for (let c = bc; c < bc + gs().boxCols; c++) {
          sameBox.add(`${r},${c}`);
        }
      }
    }

    const errors = gs().getErrorCells();
    for (const err of errors) errorCells.add(`${err.row},${err.col}`);

    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Box borders
        if (c % gs().boxCols === 0) cell.classList.add('box-left');
        if (r % gs().boxRows === 0) cell.classList.add('box-top');
        if ((c + 1) % gs().boxCols === 0 || c === s - 1) cell.classList.add('box-right');
        if ((r + 1) % gs().boxRows === 0 || r === s - 1) cell.classList.add('box-bottom');

        if (gs().isGiven(r, c)) cell.classList.add('given');

        if (r === selectedRow && c === selectedCol) cell.classList.add('selected');

        const key = `${r},${c}`;
        if (r !== selectedRow || c !== selectedCol) {
          if (sameRow.has(key)) cell.classList.add('same-row');
          else if (sameCol.has(key)) cell.classList.add('same-col');
          else if (sameBox.has(key)) cell.classList.add('same-box');
          if (selectedRow >= 0 && selectedCol >= 0) {
            const sv = gs().board[selectedRow][selectedCol];
            if (sv !== 0 && gs().board[r][c] === sv) {
              cell.classList.add('same-value');
            }
          }
        }

        if (errorCells.has(key)) cell.classList.add('error');

        const val = gs().board[r][c];
        if (val !== 0 && val !== null) {
          const span = document.createElement('span');
          span.className = 'cell-value';
          span.textContent = SudokuSolver.valueToSymbol(val);
          cell.appendChild(span);
        }

        if (val === 0 && gs().notes[r][c] && gs().notes[r][c].size > 0) {
          const nd = document.createElement('div');
          nd.className = 'cell-notes';
          nd.textContent = Array.from(gs().notes[r][c]).sort((a,b)=>a-b)
            .map(v => SudokuSolver.valueToSymbol(v)).join('');
          cell.appendChild(nd);
        }

        cell.addEventListener('click', () => onCellClick(r, c));
        els.board.appendChild(cell);
      }
    }
  }

  function onCellClick(r, c) {
    if (gs().completed) return;
    selectedRow = r;
    selectedCol = c;
    render();
  }

  function renderNumberPad() {
    const s = gs().size;
    els.numberPad.innerHTML = '';

    for (let i = 1; i <= s; i++) {
      const btn = document.createElement('button');
      btn.className = 'num-btn';
      btn.textContent = SudokuSolver.valueToSymbol(i);
      btn.addEventListener('click', () => {
        if (gs().completed) return;
        if (selectedRow < 0 || selectedCol < 0) {
          showNotification('请先点击选择一个格子');
          return;
        }
        if (notesMode) {
          gs().toggleNote(selectedRow, selectedCol, i);
        } else {
          gs().setCell(selectedRow, selectedCol, i);
        }
        saveAndRender();
      });
      els.numberPad.appendChild(btn);
    }

    const eraseBtn = document.createElement('button');
    eraseBtn.className = 'num-btn erase-btn';
    eraseBtn.textContent = '✕';
    eraseBtn.addEventListener('click', () => {
      if (gs().completed) return;
      if (selectedRow < 0 || selectedCol < 0) return;
      if (gs().isGiven(selectedRow, selectedCol)) return;
      gs().notes[selectedRow][selectedCol].clear();
      gs().setCell(selectedRow, selectedCol, 0);
      saveAndRender();
    });
    els.numberPad.appendChild(eraseBtn);
  }

  function renderStats() {
    els.timer.textContent = StorageManager.formatTime(gs().elapsedTime);
    els.errorCount.textContent = gs().errorCount;
    els.moveCount.textContent = gs().moveCount;
  }

  function updateUndoRedoButtons() {
    els.undoBtn.disabled = gs().undoStack.length === 0;
    els.redoBtn.disabled = gs().redoStack.length === 0;
  }

  function updateNotesToggle() {
    if (notesMode) {
      els.notesToggle.classList.add('active');
      els.notesToggle.querySelector('span').textContent = '笔记·开';
    } else {
      els.notesToggle.classList.remove('active');
      els.notesToggle.querySelector('span').textContent = '笔记';
    }
  }

  function updateBoardSizeClass() {
    els.board.className = '';
    const s = gs().size;
    if (s <= 6) els.board.classList.add('board-small');
    else if (s === 9) els.board.classList.add('board-medium');
    else els.board.classList.add('board-large');
  }

  // ---- Timer ----

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      if (!gs().completed) {
        gs().elapsedTime++;
        renderStats();
        if (gs().elapsedTime % 30 === 0) {
          StorageManager.saveGame(gs());
        }
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  // ---- Result Panel ----

  function showResult() {
    const r = gs().getResult();
    const diffMap = { easy: '简单', medium: '中等', hard: '困难' };
    els.resultContent.innerHTML = `
      <div class="result-grid">
        <div class="result-item"><div class="result-label">棋盘大小</div><div class="result-value">${r.size}×${r.size}</div></div>
        <div class="result-item"><div class="result-label">难度</div><div class="result-value">${diffMap[r.difficulty]||r.difficulty}</div></div>
        <div class="result-item"><div class="result-label">总用时</div><div class="result-value">${StorageManager.formatTime(r.elapsedTime)}</div></div>
        <div class="result-item"><div class="result-label">填写次数</div><div class="result-value">${r.moveCount}</div></div>
        <div class="result-item"><div class="result-label">错误次数</div><div class="result-value">${r.errorCount}</div></div>
        <div class="result-item"><div class="result-label">使用提示</div><div class="result-value">${r.usedHint?'是':'否'}</div></div>
        <div class="result-item"><div class="result-label">完成时间</div><div class="result-value">${StorageManager.formatDate(r.completedAt)}</div></div>
      </div>
    `;
    els.resultPanel.style.display = 'flex';
    StorageManager.saveResult(r);
  }

  function hideResult() { els.resultPanel.style.display = 'none'; }

  // ---- History Panel ----

  function showHistory() {
    const history = StorageManager.getHistory();
    if (history.length === 0) {
      els.historyContent.innerHTML = '<p style="text-align:center;color:#888;">暂无历史记录</p>';
    } else {
      const diffMap = { easy: '简单', medium: '中等', hard: '困难' };
      let html = '<div class="history-list">';
      history.forEach((r, i) => {
        html += `
          <div class="history-item">
            <span class="history-index">#${i+1}</span>
            <span class="history-size">${r.size}×${r.size}</span>
            <span class="history-difficulty">${diffMap[r.difficulty]||r.difficulty}</span>
            <span class="history-time">${StorageManager.formatTime(r.elapsedTime)}</span>
            <span class="history-errors">${r.errorCount} 错</span>
            <span class="history-hint">${r.usedHint?'💡':''}</span>
            <span class="history-date">${StorageManager.formatDate(r.completedAt)}</span>
          </div>`;
      });
      html += '</div>';
      els.historyContent.innerHTML = html;
    }
    els.historyPanel.style.display = 'flex';
  }

  function hideHistory() { els.historyPanel.style.display = 'none'; }

  // ---- Modal ----

  function showModal(title, bodyHTML, callback, hasInput) {
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = bodyHTML;
    els.modalInput.style.display = hasInput ? 'block' : 'none';
    els.modalInput.value = '';
    els.modalOverlay.style.display = 'flex';
    modalCallback = callback;
    if (hasInput) {
      els.modalConfirm.style.display = 'inline-block';
      els.modalCancel.style.display = 'inline-block';
    } else {
      els.modalConfirm.style.display = 'none';
      els.modalCancel.textContent = '关闭';
    }
    if (hasInput) setTimeout(() => els.modalInput.focus(), 100);
  }

  function hideModal() {
    els.modalOverlay.style.display = 'none';
    modalCallback = null;
  }

  // ---- Notification ----

  function showNotification(msg) {
    els.notification.textContent = msg;
    els.notification.classList.add('show');
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
      els.notification.classList.remove('show');
    }, 2000);
  }

  // ---- Helpers ----

  function saveAndRender() {
    StorageManager.saveGame(gs());
    render();
  }

  return { init, setGameState, stopTimer, render, showNotification, startTimer };
})();

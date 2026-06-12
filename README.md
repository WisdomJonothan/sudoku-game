# 数独游戏 (Sudoku)

一个纯前端静态网页数独游戏，支持 4×4、6×6、9×9、16×16 四种棋盘大小和多级难度，无需后端即可本地运行或部署到 GitHub Pages。

## 功能

- **多种棋盘**：4×4（2×2 宫格）、6×6（2×3 宫格）、9×9（3×3 宫格）、16×16（4×4 宫格）
- **三级难度**：简单、中等、困难（控制空格数量）
- **笔记模式**：在格子中标记候选数字
- **撤销 / 重做**：支持 Ctrl+Z / Ctrl+Shift+Z 快捷键
- **提示 & 检查**：帮助定位错误
- **进度保存**：自动保存到 localStorage，刷新后自动恢复
- **导入 / 导出**：JSON 文件格式的存档导入导出
- **历史记录**：每次完成的结果都会保存到历史列表
- **同题挑战**：生成分享链接或题目码，朋友打开后面对同一道题目，各自独立计时和统计

## 本地运行

### 方法一：直接打开（推荐）
双击 `index.html` 即可在浏览器中运行。

### 方法二：Live Server（VS Code）
在 VS Code 中安装 Live Server 插件，右键 `index.html` → "Open with Live Server"。

### 方法三：Python HTTP Server
```bash
cd sudoku-game
python -m http.server 8000
```
然后访问 http://localhost:8000

### 方法四：Node.js
```bash
npx serve .
```

## GitHub Pages 部署

1. 在 GitHub 上创建仓库（例如 `sudoku-game`）
2. 将项目所有文件 push 到仓库的 `main` 或 `master` 分支：
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Sudoku game"
   git remote add origin https://github.com/YOUR_USERNAME/sudoku-game.git
   git push -u origin main
   ```
3. 前往仓库 Settings → Pages，在 "Build and deployment" 中选择：
   - Source: **GitHub Actions**
4. `.github/workflows/pages.yml` 会在每次 push 后自动部署
5. 部署完成后，访问 `https://YOUR_USERNAME.github.io/sudoku-game`

> 如果使用默认分支以外的分支部署，请修改 `pages.yml` 中的 `branches` 配置。

## 分享链接的使用

1. 打开游戏，选择一个棋盘大小和难度，点击"新游戏"
2. 点击 **分享链接** 按钮，链接会自动复制到剪贴板
3. 将链接发送给朋友（通过微信、QQ、邮件等）
4. 朋友在浏览器中打开链接，会看到同一道初始题目
5. 每个人独立填写、计时、保存进度，互不影响

**分享链接示例：**
```
https://yourname.github.io/sudoku-game/index.html#mode=challenge&size=9&boxRows=3&boxCols=3&difficulty=medium&puzzle=...&solution=...
```

### 题目码
如果链接太长，可以使用"题目码"功能：
- 点击 **题目码** 复制 Base64 编码的短码
- 朋友点击 **导入码**，粘贴题目码即可加载同一题目

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| 方向键 | 移动选中格子 |
| 1-9 / A-G | 输入数字或字母 |
| Delete / Backspace | 清除格子 |
| N | 切换笔记模式 |
| Ctrl+Z | 撤销 |
| Ctrl+Shift+Z | 重做 |

## 项目结构

```
sudoku-game/
├── index.html              # 主页面
├── style.css               # 样式
├── README.md               # 项目说明
├── .nojekyll               # GitHub Pages 禁用 Jekyll
├── js/
│   ├── main.js             # 入口：初始化、分享链接检测、存档恢复
│   ├── sudokuSolver.js     # 通用数独求解器（合法性检查、求解、解计数）
│   ├── sudokuGenerator.js  # 终盘生成 + 挖空生成题目
│   ├── gameState.js        # 游戏状态管理（棋盘、笔记、撤销重做、计时）
│   ├── storageManager.js   # localStorage 存取、导入导出、历史记录
│   ├── shareManager.js     # URL hash 分享链接、Base64 题目码
│   └── uiController.js     # 页面渲染和交互
└── .github/
    └── workflows/
        └── pages.yml       # GitHub Pages 自动部署
```

## 技术说明

### 求解算法
使用带回溯的深度优先搜索 + MRV（最小剩余值）启发式算法。对于 4×4、6×6、9×9 棋盘，挖空时会逐格检查唯一解；对于 16×16 棋盘，由于唯一解检查耗时较长，采用随机挖空到目标格子数的方式，不逐格检查唯一性。实际测试中，16×16 在目标留空范围内几乎总是保持唯一解。

### 难度设置
| 难度 | 留空比例 |
|------|----------|
| 简单 | 25% - 40% |
| 中等 | 40% - 55% |
| 困难 | 55% - 70% |

### 浏览器兼容
支持所有现代浏览器（Chrome、Firefox、Safari、Edge）。需要启用 JavaScript 和 localStorage。

## 常见问题

**Q: 刷新后进度丢失？**
A: 进度在每次填写、每 30 秒自动保存到 localStorage。如果使用了隐私/无痕模式，浏览器关闭后 localStorage 会被清除。

**Q: 16×16 棋盘太慢怎么办？**
A: 16×16 生成可能需要几秒钟，属于正常现象。建议在桌面端使用。

**Q: 分享链接打不开？**
A: 确保链接完整（含 `#` 后面的参数），部分聊天软件可能会截断 URL。可以改用"题目码"分享。

**Q: 部署到 GitHub Pages 后页面空白？**
A: 检查仓库 Settings → Pages 是否启用了 GitHub Actions 部署，以及 `.nojekyll` 文件是否存在。

**Q: 如何重置所有数据？**
A: 在浏览器开发者工具中执行 `localStorage.clear()`，或清除浏览器缓存数据。

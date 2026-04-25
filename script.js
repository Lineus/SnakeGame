const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");
const wrapAroundCheckbox = document.getElementById("wrapAroundCheckbox"); // 新增：穿墙复选框

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const gameSpeedMs = 120;

let snake;
let direction;
let queuedDirection;
let inputQueue; // 新增：输入队列，用于缓存按键指令
let food;
let score;
let isGameOver;
let isGameStarted; // 新增：游戏是否已开始
let isPaused; // 新增：游戏是否暂停
let gameLoopId;

function randomTile() {
  return Math.floor(Math.random() * tileCount);
}

function spawnFood() {
  let nextFood = { x: randomTile(), y: randomTile() };
  while (snake.some((part) => part.x === nextFood.x && part.y === nextFood.y)) {
    nextFood = { x: randomTile(), y: randomTile() };
  }
  food = nextFood;
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  inputQueue = []; // 初始化输入队列
  score = 0;
  isGameOver = false;
  isGameStarted = false; // 重置后不自动开始
  isPaused = false; // 重置暂停状态
  scoreEl.textContent = "0";
  messageEl.textContent = "按Enter开始游戏"; // 显示开始提示
  spawnFood();

  if (gameLoopId) {
    clearInterval(gameLoopId);
  }
  draw(); // 只绘制初始画面，不启动游戏循环
}

function startGame() {
  if (isGameStarted || isGameOver) return;
  
  isGameStarted = true;
  isPaused = false;
  messageEl.textContent = ""; // 清除提示
  
  if (gameLoopId) {
    clearInterval(gameLoopId);
  }
  gameLoopId = setInterval(update, gameSpeedMs);
}

function togglePause() {
  if (!isGameStarted || isGameOver) return;
  
  isPaused = !isPaused;
  
  if (isPaused) {
    clearInterval(gameLoopId);
    messageEl.textContent = "已暂停 - 按P继续";
  } else {
    messageEl.textContent = "";
    gameLoopId = setInterval(update, gameSpeedMs);
  }
}

function setDirection(nextX, nextY) {
  if (isGameOver || !isGameStarted) return;

  // Prevent turning directly into your own body.
  if (direction.x === -nextX && direction.y === -nextY) {
    return;
  }

  // 将方向加入输入队列，而不是直接设置
  const lastQueued = inputQueue.length > 0 
    ? inputQueue[inputQueue.length - 1] 
    : queuedDirection;
    
  // 防止在同一帧内连续转向自身
  if (lastQueued.x === -nextX && lastQueued.y === -nextY) {
    return;
  }

  inputQueue.push({ x: nextX, y: nextY });
}

function update() {
  if (isGameOver || !isGameStarted) return;

  // 从输入队列中取出下一个方向（如果有的话）
  if (inputQueue.length > 0) {
    queuedDirection = inputQueue.shift();
  }
  
  direction = queuedDirection;
  let newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // 处理穿墙逻辑
  const wrapAround = wrapAroundCheckbox.checked;
  if (wrapAround) {
    // 穿墙模式：从一边出去，从另一边进来
    if (newHead.x < 0) newHead.x = tileCount - 1;
    if (newHead.x >= tileCount) newHead.x = 0;
    if (newHead.y < 0) newHead.y = tileCount - 1;
    if (newHead.y >= tileCount) newHead.y = 0;
  }

  const hitWall = !wrapAround && (
    newHead.x < 0 ||
    newHead.x >= tileCount ||
    newHead.y < 0 ||
    newHead.y >= tileCount
  );
  const hitSelf = snake.some((part) => part.x === newHead.x && part.y === newHead.y);

  if (hitWall || hitSelf) {
    isGameOver = true;
    isGameStarted = false;
    clearInterval(gameLoopId);
    messageEl.textContent = "游戏结束 - 按Enter或Restart以重新开始";
    draw();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    scoreEl.textContent = String(score);
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ef4444";
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? "#22c55e" : "#4ade80";
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
  });

  // Draw light grid lines for easier visual tracking.
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i <= tileCount; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  // 处理Enter键开始游戏
  if (key === "enter") {
    if (!isGameStarted && !isGameOver) {
      startGame();
    } else if (isGameOver) {
      resetGame();
      setTimeout(() => startGame(), 100); // 短暂延迟后开始
    }
    return;
  }

  // 处理P键暂停/继续
  if (key === "p") {
    togglePause();
    return;
  }

  // 方向键处理（暂停时不允许移动）
  if (key === "arrowup" || key === "w") setDirection(0, -1);
  if (key === "arrowdown" || key === "s") setDirection(0, 1);
  if (key === "arrowleft" || key === "a") setDirection(-1, 0);
  if (key === "arrowright" || key === "d") setDirection(1, 0);
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

resetGame();

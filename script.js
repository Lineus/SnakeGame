const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const gameSpeedMs = 120;

let snake;
let direction;
let queuedDirection;
let food;
let score;
let isGameOver;
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
  score = 0;
  isGameOver = false;
  scoreEl.textContent = "0";
  messageEl.textContent = "";
  spawnFood();

  if (gameLoopId) {
    clearInterval(gameLoopId);
  }
  gameLoopId = setInterval(update, gameSpeedMs);
  draw();
}

function setDirection(nextX, nextY) {
  if (isGameOver) return;

  // Prevent turning directly into your own body.
  if (direction.x === -nextX && direction.y === -nextY) {
    return;
  }

  queuedDirection = { x: nextX, y: nextY };
}

function update() {
  if (isGameOver) return;

  direction = queuedDirection;
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const hitWall =
    newHead.x < 0 ||
    newHead.x >= tileCount ||
    newHead.y < 0 ||
    newHead.y >= tileCount;
  const hitSelf = snake.some((part) => part.x === newHead.x && part.y === newHead.y);

  if (hitWall || hitSelf) {
    isGameOver = true;
    clearInterval(gameLoopId);
    messageEl.textContent = "Game over! Press Restart.";
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

  if (key === "arrowup" || key === "w") setDirection(0, -1);
  if (key === "arrowdown" || key === "s") setDirection(0, 1);
  if (key === "arrowleft" || key === "a") setDirection(-1, 0);
  if (key === "arrowright" || key === "d") setDirection(1, 0);
});

restartBtn.addEventListener("click", resetGame);

resetGame();

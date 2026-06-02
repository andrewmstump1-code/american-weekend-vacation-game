// --- Screen handling ---
const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const highScoresScreen = document.getElementById('high-scores-screen');

const startButton = document.getElementById('start-button');
const highScoresButton = document.getElementById('high-scores-button');
const backToTitleButton = document.getElementById('back-to-title');

function showScreen(screen) {
  titleScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  highScoresScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}

// --- Canvas setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game state
let keys = {};
let player;
let dogs = [];
let streetLength = 1600; // how far Jamie has to run to reach home
let cameraX = 0;
let gameOver = false;
let score = 0;
let health = 3;

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function startGame() {
  // Jamie the kid
  player = {
    x: 50,
    y: 300,
    vy: 0,
    width: 30,
    height: 50,
    onGround: false,
    invulnerableUntil: 0
  };

  dogs = [];
  cameraX = 0;
  score = 0;
  health = 3;
  gameOver = false;

  document.getElementById('score-display').textContent = 'Score: ' + score;
  document.getElementById('health-display').textContent = 'Health: ' + health;

  spawnDogs();
  loop();
}

// Place dogs along the street
function spawnDogs() {
  dogs = [];
  // Create 8 dogs spaced along the street
  for (let i = 1; i <= 8; i++) {
    dogs.push({
      x: 150 * i + 100, // spread them out
      y: 340 - 20,      // on the street
      width: 40,
      height: 20,
      passed: false    // to track scoring when Jamie passes them
    });
  }
}

function loop() {
  if (gameOver) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update() {
  // Horizontal movement
  if (keys['ArrowRight']) player.x += 4;
  if (keys['ArrowLeft']) player.x -= 4;

  // Prevent going backward off the street
  if (player.x < 0) player.x = 0;

  // Jump
  if (keys['Space'] && player.onGround) {
    player.vy = -11;
    player.onGround = false;
  }

  // Gravity
  player.vy += 0.5;
  player.y += player.vy;

  // Ground collision (street level at y = 340)
  if (player.y + player.height > 340) {
    player.y = 340 - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  // Collisions with dogs (lose health). Invulnerability frames prevent a single
  // dog from draining multiple health while Jamie is still overlapping it.
  const now = performance.now();
  dogs.forEach((dog) => {
    if (rectsOverlap(player, dog) && now >= player.invulnerableUntil) {
      player.x -= 30;
      if (player.x < 0) player.x = 0;

      health -= 1;
      player.invulnerableUntil = now + 1000;
      document.getElementById('health-display').textContent = 'Health: ' + health;

      if (health <= 0) {
        endGame(false); // false = didn't make it home
      }
    }

    // Scoring: if Jamie passes a dog (Jamie's right side goes beyond dog)
    if (!dog.passed && player.x > dog.x + dog.width) {
      dog.passed = true;
      score += 100;
      document.getElementById('score-display').textContent = 'Score: ' + score;
    }
  });

  // Camera follows the player, locked roughly 1/3 from the left edge,
  // clamped so it doesn't reveal empty world past the end of the street.
  const maxCameraX = streetLength + 100 - canvas.width;
  cameraX = Math.max(0, Math.min(player.x - canvas.width / 3, maxCameraX));

  // End of level: reach the end of the street (home)
  if (player.x > streetLength) {
    endGame(true); // true = reached home
  }
}

function drawGradientSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, '#FF7F50'); // coral / orange (sunset top)
  gradient.addColorStop(0.5, '#FFB347'); // lighter orange
  gradient.addColorStop(1, '#4B0082'); // indigo
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, 200);
}

function drawFireworks() {
  // Simple stylized fireworks as circles/lines in the sky
  const fireworks = [
    { x: 150, y: 80, color: '#FFD700' },
    { x: 350, y: 60, color: '#FF69B4' },
    { x: 600, y: 90, color: '#00FFFF' }
  ];

  fireworks.forEach(fw => {
    ctx.strokeStyle = fw.color;
    ctx.lineWidth = 2;

    // Burst lines
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = angle * Math.PI / 180;
      const x2 = fw.x + Math.cos(rad) * 20;
      const y2 = fw.y + Math.sin(rad) * 20;
      ctx.beginPath();
      ctx.moveTo(fw.x, fw.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(fw.x, fw.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = fw.color;
    ctx.fill();
  });
}

function drawHouses() {
  // Tile two staggered rows of houses across the full street so the world
  // isn't empty once the camera scrolls past the first screen.
  const houseCount = Math.ceil((streetLength + canvas.width) / 200);
  for (let i = 0; i < houseCount; i++) {
    // Back row
    let baseXBack = i * 200 + 40;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(baseXBack, 200, 80, 80);
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.moveTo(baseXBack - 10, 200);
    ctx.lineTo(baseXBack + 40, 160);
    ctx.lineTo(baseXBack + 90, 200);
    ctx.closePath();
    ctx.fill();

    // Front row, offset 100px so the silhouettes overlap nicely
    let baseXFront = i * 200 + 140;
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(baseXFront, 210, 80, 80);
    ctx.fillStyle = '#CD853F';
    ctx.beginPath();
    ctx.moveTo(baseXFront - 10, 210);
    ctx.lineTo(baseXFront + 40, 170);
    ctx.lineTo(baseXFront + 90, 210);
    ctx.closePath();
    ctx.fill();
  }
}

function drawStreet() {
  const worldWidth = streetLength + canvas.width;

  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 260, worldWidth, 140);

  ctx.strokeStyle = '#FFFF00';
  ctx.lineWidth = 3;
  for (let x = 0; x < worldWidth; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 330);
    ctx.lineTo(x + 20, 330);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sky and fireworks stay in screen space so the sunset is always visible.
  drawGradientSky();
  drawFireworks();

  // Everything on the street scrolls with the camera.
  ctx.save();
  ctx.translate(-cameraX, 0);

  drawHouses();
  drawStreet();

  dogs.forEach((dog) => {
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(dog.x, dog.y, dog.width, dog.height);
    ctx.fillRect(dog.x + dog.width - 10, dog.y - 10, 10, 10);
  });

  // Flicker the player during i-frames so the hit feedback is visible.
  const now = performance.now();
  const isInvulnerable = now < player.invulnerableUntil;
  const visibleThisFrame = !isInvulnerable || Math.floor(now / 100) % 2 === 0;
  if (visibleThisFrame) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y - 10, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- High score handling ---
const HIGH_SCORES_KEY = 'weekendVacationHighScores';

function getHighScores() {
  const raw = localStorage.getItem(HIGH_SCORES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveHighScores(scores) {
  localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
}

// reachedHome = true if Jamie reached home, false if lost all health
function endGame(reachedHome) {
  gameOver = true;

  let message = reachedHome
    ? 'You made it home! Your score: '
    : 'You got stopped by the dogs. Your score: ';

  const initials = prompt(message + score + '. Enter your initials (3 letters):', 'AAA');
  if (initials) {
    const trimmed = initials.toUpperCase().slice(0, 3);
    const scores = getHighScores();
    scores.push({ initials: trimmed, score });
    scores.sort((a, b) => b.score - a.score);
    saveHighScores(scores.slice(0, 10));
  }

  showScreen(titleScreen);
}

function renderHighScores() {
  const list = document.getElementById('high-scores-list');
  list.innerHTML = '';
  const scores = getHighScores();
  scores.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = `${entry.initials} - ${entry.score}`;
    list.appendChild(li);
  });
}

// --- Wire up buttons ---
startButton.addEventListener('click', () => {
  showScreen(gameScreen);
  startGame();
});

highScoresButton.addEventListener('click', () => {
  renderHighScores();
  showScreen(highScoresScreen);
});

backToTitleButton.addEventListener('click', () => {
  showScreen(titleScreen);
});
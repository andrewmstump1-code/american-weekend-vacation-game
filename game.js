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
const messageOverlay = document.getElementById('message-overlay');
const messageText = document.getElementById('message-text');
const messageOk = document.getElementById('message-ok');

// Game state
let keys = {};
let player;
let dogs = [];
let houses = [];
let waveHouseIndex = 0;
let streetLength = 1600; // how far Jamie has to run to reach home
let gameOver = false;
let score = 0;
let health = 3;
let startTime = 0;

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
    onGround: false
  };

  dogs = [];
  houses = [];
  score = 0;
  health = 3;
  gameOver = false;
  startTime = Date.now();
  messageOverlay.classList.add('hidden');

  document.getElementById('score-display').textContent = 'Score: ' + score;
  document.getElementById('health-display').textContent = 'Health: ' + health;
  document.getElementById('timer-display').textContent = 'Timer: 00:00';

  spawnDogs();
  spawnHouses();
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

function spawnHouses() {
  houses = [];
  waveHouseIndex = Math.floor(Math.random() * 10);

  for (let i = 0; i < 10; i++) {
    const isLeft = i % 2 === 0;
    const x = 40 + i * 160;
    const y = isLeft ? 200 : 210;
    const baseColor = isLeft ? '#8B4513' : '#556B2F';
    const roofColor = isLeft ? '#DEB887' : '#CD853F';

    houses.push({
      x,
      y,
      width: 80,
      height: 80,
      baseColor,
      roofColor,
      doorColor: '#3C220F',
      windowLight: Math.random() > 0.4,
      address: String(100 + Math.floor(Math.random() * 900)),
      hasPerson: houses.length === waveHouseIndex
    });
  }
}

function getCameraX() {
  const followX = player.x - 250;
  const maxCamera = Math.max(streetLength - canvas.width + 100, 0);
  return Math.min(Math.max(followX, 0), maxCamera);
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

  // Collisions with dogs (lose health)
  dogs.forEach((dog) => {
    if (rectsOverlap(player, dog)) {
      // On collision, push Jamie back a bit and lose health
      player.x -= 30;
      if (player.x < 0) player.x = 0;

      health -= 1;
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

  // Update timer display
  const elapsedMs = Date.now() - startTime;
  const timerSeconds = Math.floor(elapsedMs / 1000);
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const seconds = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('timer-display').textContent = `Timer: ${minutes}:${seconds}`;

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

function drawHouses(cameraX) {
  houses.forEach((house) => {
    const x = house.x - cameraX;

    // House body
    ctx.fillStyle = house.baseColor;
    ctx.fillRect(x, house.y, house.width, house.height);

    // Roof
    ctx.fillStyle = house.roofColor;
    ctx.beginPath();
    ctx.moveTo(x - 10, house.y);
    ctx.lineTo(x + house.width / 2, house.y - 40);
    ctx.lineTo(x + house.width + 10, house.y);
    ctx.closePath();
    ctx.fill();

    // Door
    const doorWidth = 24;
    const doorHeight = 36;
    const doorX = x + (house.width - doorWidth) / 2;
    const doorY = house.y + house.height - doorHeight;
    ctx.fillStyle = house.doorColor;
    ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(doorX + doorWidth - 6, doorY + doorHeight / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Windows
    const windowColor = house.windowLight ? '#FFEB8A' : '#1E2B3C';
    const frameColor = '#333';
    const winW = 18;
    const winH = 16;
    const windowPositions = [
      { x: x + 10, y: house.y + 18 },
      { x: x + house.width - 10 - winW, y: house.y + 18 }
    ];

    windowPositions.forEach((pos) => {
      ctx.fillStyle = windowColor;
      ctx.fillRect(pos.x, pos.y, winW, winH);
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x, pos.y, winW, winH);

      ctx.beginPath();
      ctx.moveTo(pos.x + winW / 2, pos.y);
      ctx.lineTo(pos.x + winW / 2, pos.y + winH);
      ctx.moveTo(pos.x, pos.y + winH / 2);
      ctx.lineTo(pos.x + winW, pos.y + winH / 2);
      ctx.stroke();
    });

    // Address number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(house.address, x + house.width / 2, house.y + house.height + 18);

    // Person waving from one house
    if (house.hasPerson) {
      const personX = doorX + doorWidth / 2;
      const personHeadY = doorY - 12;

      // Head
      ctx.fillStyle = '#FFD1A9';
      ctx.beginPath();
      ctx.arc(personX, personHeadY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Body and limbs
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(personX, personHeadY + 7);
      ctx.lineTo(personX, personHeadY + 24);
      ctx.moveTo(personX, personHeadY + 12);
      ctx.lineTo(personX - 8, personHeadY + 22);
      ctx.moveTo(personX, personHeadY + 12);
      ctx.lineTo(personX + 12, personHeadY + 4);
      ctx.moveTo(personX, personHeadY + 24);
      ctx.lineTo(personX - 6, personHeadY + 34);
      ctx.moveTo(personX, personHeadY + 24);
      ctx.lineTo(personX + 6, personHeadY + 34);
      ctx.stroke();

      // Shirt
      ctx.fillStyle = '#FF4C4C';
      ctx.fillRect(personX - 5, personHeadY + 7, 10, 12);
    }
  });
}

function drawStreet(cameraX) {
  // Street
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 260, canvas.width, 140);

  // Lane lines scroll with camera movement
  const offset = cameraX % 40;
  ctx.strokeStyle = '#FFFF00';
  ctx.lineWidth = 3;
  for (let x = -offset; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 330);
    ctx.lineTo(x + 20, 330);
    ctx.stroke();
  }
}

function drawFinishLine(cameraX) {
  const finishX = streetLength - cameraX;
  const postHeight = 80;
  const bannerY = 260 - postHeight / 2;
  const bannerWidth = 140;

  // Posts
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(finishX - 4, 180, 8, postHeight);
  ctx.fillRect(finishX + bannerWidth - 4, 180, 8, postHeight);

  // Banner
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(finishX, 190, bannerWidth, 24);

  // Text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FINISH', finishX + bannerWidth / 2, 208);

  // Checkered line on the road
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(finishX, 260);
  ctx.lineTo(finishX, 400);
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background: sunset sky, fireworks, houses, street
  const cameraX = getCameraX();

  drawGradientSky();
  drawFireworks();
  drawHouses(cameraX);
  drawStreet(cameraX);
  drawFinishLine(cameraX);

  // Player (Jamie the kid)
  const shirtHeight = 28;
  const pantsHeight = 18;
  const screenPlayerX = player.x - cameraX;

  // Shirt
  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(screenPlayerX, player.y, player.width, shirtHeight);

  // Pants
  ctx.fillStyle = '#2E5AAC';
  ctx.fillRect(screenPlayerX, player.y + shirtHeight, player.width, pantsHeight);

  // Head
  ctx.fillStyle = '#FFE4C4';
  ctx.beginPath();
  ctx.arc(screenPlayerX + player.width / 2, player.y - 10, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hat brim
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(screenPlayerX - 2, player.y - 20, player.width + 4, 8);

  // Hat top
  ctx.beginPath();
  ctx.arc(screenPlayerX + player.width / 2, player.y - 20, 9, Math.PI, 0, true);
  ctx.fill();

  // Face details
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(screenPlayerX + player.width / 2 - 4, player.y - 12, 2, 0, Math.PI * 2);
  ctx.arc(screenPlayerX + player.width / 2 + 4, player.y - 12, 2, 0, Math.PI * 2);
  ctx.fill();

  // Dogs (obstacles)
  dogs.forEach((dog) => {
    const bodyX = dog.x - cameraX;
    const bodyY = dog.y;
    const bodyW = dog.width;
    const bodyH = dog.height;

    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

    // Head
    ctx.fillRect(bodyX + bodyW - 10, bodyY - 14, 18, 14);
    ctx.fillRect(bodyX + bodyW - 4, bodyY - 20, 4, 8);
    ctx.fillRect(bodyX + bodyW + 8, bodyY - 20, 4, 8);

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bodyX + bodyW + 4, bodyY - 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#8B5A2B';
    for (let leg = 0; leg < 4; leg++) {
      ctx.fillRect(bodyX + 4 + leg * 8, bodyY + bodyH, 4, 10);
    }

    // Tail
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY + 10);
    ctx.quadraticCurveTo(bodyX - 12, bodyY + 2, bodyX - 18, bodyY + 14);
    ctx.stroke();
  });
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
function showMessage(text) {
  messageText.textContent = text;
  messageOverlay.classList.remove('hidden');
}

messageOk.addEventListener('click', () => {
  messageOverlay.classList.add('hidden');
  showScreen(titleScreen);
});

function endGame(reachedHome) {
  gameOver = true;

  if (reachedHome) {
    showMessage('You Made It!!');
  } else {
    showScreen(titleScreen);
  }
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
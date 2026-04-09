const dino = document.getElementById('dino');
const gameBoard = document.getElementById('game-board');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

let isJumping = false;
let isGameOver = true; 
let gravity = 0.6;
let jumpPower = 12;
let velocity = 0;
let dinoBottom = 4; 

let score = 0;
let highScore = localStorage.getItem('neonRexHighScore') || 0;
highScoreEl.innerText = highScore.toString().padStart(5, '0');

let obstacles = [];
let clouds = [];
let mountainFarPos = 0;
let mountainMidPos = 0;
let gameSpeed = 6;
let animationFrameId;
let spawnTimeoutId;
let cloudTimeoutId;
let viewportWidth = window.innerWidth;

// Adjust dino dimensions based on viewport
const getDinoDimensions = () => {
    return window.innerWidth <= 600 ? { w: 34, h: 38, l: 20 } : { w: 44, h: 48, l: 50 };
};

function jump() {
    if (isJumping || isGameOver) return;
    isJumping = true;
    velocity = jumpPower;
    dino.classList.remove('dino-running');
}

function handleInput(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.type === 'touchstart') {
        if (e.type !== 'touchstart') e.preventDefault(); // prevent scrolling
        
        if (isGameOver && gameOverScreen.classList.contains('active')) return; // wait for button if game over
        if (isGameOver && startScreen.classList.contains('active')) {
            startGame();
        } else {
            jump();
        }
    }
}

document.addEventListener('keydown', handleInput);
document.addEventListener('touchstart', handleInput, {passive: false});

restartBtn.addEventListener('click', startGame);

function spawnObstacle() {
    if (isGameOver) return;

    let obstacle = document.createElement('div');
    obstacle.classList.add('cactus');
    let obstacleLeft = gameBoard.clientWidth; 
    obstacle.style.left = obstacleLeft + 'px';
    
    let height = Math.random() > 0.5 ? 45 : 60;
    if (Math.random() > 0.8) height = 35; 
    
    obstacle.style.height = height + 'px';
    let width = 34;
    let isDouble = Math.random() > 0.7;
    if (isDouble) {
        width = 50; 
    }
    obstacle.style.width = width + 'px';

    if (isDouble) {
        obstacle.innerHTML = `
            <div class="cactus-trunk" style="left: 30%"></div>
            <div class="cactus-arm-left" style="left: -10%; width: 40%"></div>
            
            <div class="cactus-trunk" style="left: 70%; height: 80%"></div>
            <div class="cactus-arm-right" style="right: -5%; width: 35%; bottom: 40%"></div>
        `;
    } else {
        obstacle.innerHTML = `
            <div class="cactus-trunk"></div>
            <div class="cactus-arm-left"></div>
            <div class="cactus-arm-right"></div>
        `;
    }

    gameBoard.appendChild(obstacle);
    obstacles.push({ el: obstacle, left: obstacleLeft, width: width, height: height });

    let randomTime = Math.random() * 1200 + 600; // spawn time between 0.6s and 1.8s base
    spawnTimeoutId = setTimeout(spawnObstacle, randomTime / (gameSpeed / 6)); 
}

function spawnCloud() {
    if (isGameOver) return;
    
    let sky = document.getElementById('sky');
    let cloud = document.createElement('div');
    cloud.classList.add('cloud');
    let cloudLeft = gameBoard.clientWidth;
    cloud.style.left = cloudLeft + 'px';
    cloud.style.top = (Math.random() * 100 + 10) + 'px';

    let scale = Math.random() * 0.8 + 0.4;
    cloud.style.transform = `scale(${scale})`;
    
    sky.appendChild(cloud);
    
    let speed = (Math.random() * 0.3 + 0.15) * gameSpeed;
    clouds.push({ el: cloud, left: cloudLeft, speed: speed });

    let nextTime = Math.random() * 2500 + 1000;
    cloudTimeoutId = setTimeout(spawnCloud, nextTime / (gameSpeed / 6));
}

function updateGame() {
    if (isGameOver) return;

    if (isJumping) {
        dinoBottom += velocity;
        velocity -= gravity;

        if (dinoBottom <= 4) {
            dinoBottom = 4;
            isJumping = false;
            velocity = 0;
            dino.classList.add('dino-running');
        }
    }
    dino.style.bottom = dinoBottom + 'px';

    const dDim = getDinoDimensions();
    const dinoLeft = dDim.l;
    const dinoRight = dDim.l + dDim.w; 
    
    // Mountain parallax
    mountainFarPos -= gameSpeed * 0.05;
    mountainMidPos -= gameSpeed * 0.15;
    document.getElementById('mountain-far').style.backgroundPositionX = mountainFarPos + 'px';
    document.getElementById('mountain-mid').style.backgroundPositionX = mountainMidPos + 'px';

    // Cloud movements
    for (let i = clouds.length - 1; i >= 0; i--) {
        let c = clouds[i];
        c.left -= c.speed;
        c.el.style.left = c.left + 'px';
        if (c.left < -150) {
            c.el.remove();
            clouds.splice(i, 1);
        }
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.left -= gameSpeed;
        obs.el.style.left = obs.left + 'px';

        let obsRight = obs.left + obs.width;
        let obsTop = 4 + obs.height; 
        
        let hitBoxToleranceX = 6;
        let hitBoxToleranceY = 6;

        if (
            obs.left < dinoRight - hitBoxToleranceX &&
            obsRight > dinoLeft + hitBoxToleranceX &&
            dinoBottom < obsTop - hitBoxToleranceY
        ) {
            gameOver();
            return;
        }

        // Cleanup
        if (obs.left < -100) {
            obs.el.remove();
            obstacles.splice(i, 1);
        }
    }

    score++;
    currentScoreEl.innerText = Math.floor(score / 5).toString().padStart(5, '0');
    
    // Gradual difficulty curve
    if (score > 0 && score % 500 === 0) {
        gameSpeed += 0.5;
    }

    animationFrameId = requestAnimationFrame(updateGame);
}

function startGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = 6;
    dinoBottom = 4;
    velocity = 0;
    isJumping = false;
    currentScoreEl.innerText = '00000';
    
    dino.style.bottom = dinoBottom + 'px';
    dino.classList.add('dino-running');
    
    obstacles.forEach(obs => obs.el.remove());
    obstacles = [];
    clouds.forEach(c => c.el.remove());
    clouds = [];
    clearTimeout(spawnTimeoutId);
    clearTimeout(cloudTimeoutId);

    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');

    // Slight delay before first obstacle
    setTimeout(spawnObstacle, 500);
    spawnCloud();
    updateGame();
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    clearTimeout(spawnTimeoutId);
    clearTimeout(cloudTimeoutId);
    dino.classList.remove('dino-running');
    
    let finalDisplayScore = Math.floor(score / 5);
    finalScoreEl.innerText = finalDisplayScore;
    
    if (finalDisplayScore > highScore) {
        highScore = finalDisplayScore;
        localStorage.setItem('neonRexHighScore', highScore);
        highScoreEl.innerText = highScore.toString().padStart(5, '0');
    }

    gameOverScreen.classList.add('active');
}

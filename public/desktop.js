const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const gameOverOverlayElement = document.getElementById("gameOverOverlay");
const endScoreElement = document.getElementById("endScore");
const playAgainButton = document.getElementById("playAgainButton");
const qrPlaceholder = document.getElementById("qrPlaceholder");
const debugLineElement = document.getElementById("debugLine");
const angleDebugElement = document.getElementById("angleDebug");
const powerDebugElement = document.getElementById("powerDebug");
const shootDebugElement = document.getElementById("shootDebug");
const socket = io();
const SimplePeer = window.SimplePeer;

let peer = null;
let partnerId = null;

let score = 0;
const maxLives = 3;
let lives = maxLives;
let gameOver = false;
let aimAngle = 0;
let currentPower = 0;
let audioUnlocked = false;
let soundEnabled = false;

const soundToggleButton = document.getElementById("soundToggle");

if (soundToggleButton) {
    soundToggleButton.textContent = "🔇 Sound: OFF";
    soundToggleButton.classList.add("muted");

    soundToggleButton.addEventListener("click", () => {
        unlockAudio();
        soundEnabled = !soundEnabled;
        soundToggleButton.textContent = soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        soundToggleButton.classList.toggle("muted", !soundEnabled);
        updateBackgroundMusicState();
    });
}

const setDebug = (text) => {
    if (!debugLineElement) {
        return;
    }

    debugLineElement.textContent = `Debug: ${text}`;
};

const setTelemetryValue = (element, value) => {
    if (!element) {
        return;
    }

    element.textContent = String(value);
};

const startPeer = (initiator) => {
    peer = new SimplePeer({ initiator, trickle: false });

    peer.on("signal", (data) => {
        if (!partnerId) {
            return;
        }

        socket.emit("signal", partnerId, data);
    });

    peer.on("connect", () => {
        console.log("Desktop WebRTC connected");
        setDebug("controller connected");
        setTelemetryValue(angleDebugElement, "0°");
        setTelemetryValue(powerDebugElement, "0%");
        setTelemetryValue(shootDebugElement, "-");
    });

    peer.on("data", (data) => {
        const text = data.toString();

        try {
            const payload = JSON.parse(text);
            console.log("Controller event:", payload.type, payload.value);

            if (payload.type === "angle") {
                aimAngle = (clamp(payload.value, -45, 45) * Math.PI) / 180;
                setTelemetryValue(angleDebugElement, `${Math.round(payload.value)}°`);
                setDebug(`angle ${payload.value}°`);
                return;
            }

            if (payload.type === "power") {
                currentPower = clamp(payload.value, 0, 100);
                setTelemetryValue(powerDebugElement, `${Math.round(payload.value)}%`);
                setDebug(`power ${Math.round(payload.value)}%`);
                return;
            }

            if (payload.type === "shoot") {
                const shootPower = clamp(payload.value?.power ?? currentPower, 0, 100);
                fireArrow(shootPower);
                currentPower = 0;
                playBowSound();
                setTelemetryValue(powerDebugElement, "0%");
                setTelemetryValue(shootDebugElement, `${shootPower ?? "-"}%`);
                setDebug(`shoot (${shootPower ?? "-"}%)`);
                return;
            }

            setDebug(`${payload.type}`);
        } catch {
            console.log("Controller raw data:", text);
            setDebug("raw data ontvangen");
        }
    });

    peer.on("close", () => {
        console.log("Desktop WebRTC closed");
        setDebug("controller disconnected");
        setTelemetryValue(angleDebugElement, "-");
        setTelemetryValue(powerDebugElement, "-");
        setTelemetryValue(shootDebugElement, "-");
        aimAngle = 0;
        peer = null;
    });

    peer.on("error", (error) => {
        console.error("Desktop WebRTC error:", error);
    });
};

socket.on("clients", (clients) => {
    const others = clients.filter((id) => id !== socket.id);

    if (!partnerId && others.length > 0) {
        partnerId = others[0];
    }

    if (!peer && partnerId) {
        startPeer(true);
    }
});

socket.on("signal", (fromId, signal) => {
    if (!partnerId) {
        partnerId = fromId;
    }

    if (!peer) {
        startPeer(false);
    }

    peer.signal(signal);
});

const bow = {
    x: 120,
    y: canvas.height / 2,
    radius: 45
};

const target = {
    x: 0,
    y: 0,
    radius: 42,
    hitboxRadius: 32
};

const randomizeTargetPosition = () => {
    const minX = Math.max(canvas.width * 0.55, target.radius + 20);
    const maxX = canvas.width - target.radius - 20;
    const minY = target.radius + 20;
    const maxY = canvas.height - target.radius - 20;

    target.x = minX + Math.random() * (maxX - minX);
    target.y = minY + Math.random() * (maxY - minY);
};

const targetImage = new Image();
targetImage.src = "assets/Target.png";

const arrowImage = new Image();
arrowImage.src = "assets/Arrow.png";

const lifeImage = new Image();
lifeImage.src = "assets/Life.png";

const lostLifeImage = new Image();
lostLifeImage.src = "assets/lostLife.png";

const bowShootAudio = new Audio("assets/BowSound.mov");
bowShootAudio.preload = "auto";

const hitAudio = new Audio("assets/hit.mov");
hitAudio.preload = "auto";

const missAudio = new Audio("assets/miss.mp3");
missAudio.preload = "auto";

const deathAudio = new Audio("assets/death.mp3");
deathAudio.preload = "auto";

const backgroundMusic = new Audio("assets/gameMusic.mp3");
backgroundMusic.preload = "auto";
backgroundMusic.loop = true;
backgroundMusic.volume = 0.35;

const gameAudios = [bowShootAudio, hitAudio, missAudio, deathAudio, backgroundMusic];

const bowPowerImages = {
    0: new Image(),
    25: new Image(),
    50: new Image(),
    100: new Image()
};

bowPowerImages[0].src = "assets/Bow0.png";
bowPowerImages[25].src = "assets/Bow25.png";
bowPowerImages[50].src = "assets/Bow50.png";
bowPowerImages[100].src = "assets/Bow100.png";

const arrowProjectile = {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0
};

const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};

const unlockAudio = () => {
    if (audioUnlocked) {
        return;
    }

    Promise.allSettled(
        gameAudios.map((audio) =>
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
            })
        )
    ).finally(() => {
        audioUnlocked = true;
        setDebug("audio enabled");
        updateBackgroundMusicState();
    });
};

const updateBackgroundMusicState = () => {
    if (!audioUnlocked || !soundEnabled) {
        backgroundMusic.pause();
        return;
    }

    backgroundMusic.play().catch(() => {
        setDebug("music blocked");
    });
};

const playSound = (audio, blockedMessage) => {
    if (!audioUnlocked || !soundEnabled) {
        return;
    }

    audio.currentTime = 0;
    audio.play().catch(() => {
        setDebug(blockedMessage);
    });
};

const playBowSound = () => {
    playSound(bowShootAudio, "shoot sound blocked");
};

const playHitSound = () => {
    playSound(hitAudio, "hit sound blocked");
};

const playMissSound = () => {
    playSound(missAudio, "miss sound blocked");
};

const playDeathSound = () => {
    playSound(deathAudio, "death sound blocked");
};

const fireArrow = (power) => {
    if (gameOver) {
        return;
    }

    const clampedPower = clamp(power, 0, 100);
    const launchSpeed = 6 + (clampedPower / 100) * 18;
    const startOffset = 48;

    arrowProjectile.active = true;
    arrowProjectile.angle = aimAngle;
    arrowProjectile.x = bow.x + Math.cos(aimAngle) * startOffset;
    arrowProjectile.y = bow.y + Math.sin(aimAngle) * startOffset;
    arrowProjectile.vx = Math.cos(aimAngle) * launchSpeed;
    arrowProjectile.vy = Math.sin(aimAngle) * launchSpeed;
};

const updateArrowProjectile = () => {
    if (!arrowProjectile.active) {
        return;
    }

    arrowProjectile.x += arrowProjectile.vx;
    arrowProjectile.y += arrowProjectile.vy;

    const outOfBounds =
        arrowProjectile.x < -100 ||
        arrowProjectile.x > canvas.width + 100 ||
        arrowProjectile.y < -100 ||
        arrowProjectile.y > canvas.height + 100;

    if (outOfBounds) {
        arrowProjectile.active = false;
        loseLife();
        return;
    }

    const arrowTipOffset = 43;
    const arrowTipX = arrowProjectile.x + Math.cos(arrowProjectile.angle) * arrowTipOffset;
    const arrowTipY = arrowProjectile.y + Math.sin(arrowProjectile.angle) * arrowTipOffset;
    const dx = arrowTipX - target.x;
    const dy = arrowTipY - target.y;
    const hitDistance = Math.sqrt(dx * dx + dy * dy);

    if (hitDistance <= target.hitboxRadius) {
        arrowProjectile.active = false;
        playHitSound();
        updateScore(score + 1);
        randomizeTargetPosition();
        setDebug("target hit");
    }
};

const getBowImageForPower = (power) => {
    if (power >= 75) {
        return bowPowerImages[100];
    }

    if (power >= 50) {
        return bowPowerImages[50];
    }

    if (power >= 25) {
        return bowPowerImages[25];
    }

    return bowPowerImages[0];
};

const updateScore = (value) => {
    score = value;
    scoreElement.textContent = `Score: ${score}`;
};

const updateLivesDisplay = () => {
    if (!livesElement) {
        return;
    }

    livesElement.innerHTML = "";

    for (let lifeIndex = 0; lifeIndex < maxLives; lifeIndex += 1) {
        const icon = document.createElement("img");
        icon.className = "life-icon";
        icon.src = lifeIndex < lives ? lifeImage.src : lostLifeImage.src;
        icon.alt = lifeIndex < lives ? "life" : "lost life";
        livesElement.appendChild(icon);
    }
};

const endGame = () => {
    gameOver = true;
    arrowProjectile.active = false;
    currentPower = 0;

    if (endScoreElement) {
        endScoreElement.textContent = `End score: ${score}`;
    }

    if (gameOverOverlayElement) {
        gameOverOverlayElement.hidden = false;
    }
};

const loseLife = () => {
    if (gameOver) {
        return;
    }

    lives = Math.max(0, lives - 1);
    updateLivesDisplay();

    if (lives === 0) {
        playDeathSound();
    } else {
        playMissSound();
    }

    if (lives === 0) {
        endGame();
    }
};

const resetGame = () => {
    gameOver = false;
    score = 0;
    lives = maxLives;
    aimAngle = 0;
    currentPower = 0;
    arrowProjectile.active = false;

    updateScore(score);
    updateLivesDisplay();
    randomizeTargetPosition();

    if (gameOverOverlayElement) {
        gameOverOverlayElement.hidden = true;
    }
};

const drawBackground = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const drawBow = () => {
    ctx.save();
    ctx.translate(bow.x, bow.y);
    ctx.rotate(aimAngle);

    const bowImage = getBowImageForPower(currentPower);

    if (bowImage.complete && bowImage.naturalWidth > 0) {
        const maxBowSize = bow.radius * 2.4;
        const scale = Math.min(maxBowSize / bowImage.naturalWidth, maxBowSize / bowImage.naturalHeight);
        const drawWidth = bowImage.naturalWidth * scale;
        const drawHeight = bowImage.naturalHeight * scale;
        ctx.drawImage(bowImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    } else {
        ctx.strokeStyle = "#7c3f00";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, bow.radius, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
    }

    ctx.restore();
};

const drawTarget = () => {
    ctx.save();
    ctx.translate(target.x, target.y);

    if (targetImage.complete && targetImage.naturalWidth > 0) {
        const targetSize = target.radius * 2;
        ctx.drawImage(targetImage, -target.radius, -target.radius, targetSize, targetSize);
    } else {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

const drawArrowProjectile = () => {
    if (!arrowProjectile.active) {
        return;
    }

    ctx.save();
    ctx.translate(arrowProjectile.x, arrowProjectile.y);
    ctx.rotate(arrowProjectile.angle);

    if (arrowImage.complete && arrowImage.naturalWidth > 0) {
        const drawWidth = 54;
        const drawHeight = (arrowImage.naturalHeight / arrowImage.naturalWidth) * drawWidth;
        ctx.drawImage(arrowImage, -drawWidth * 0.2, -drawHeight / 2, drawWidth, drawHeight);
    } else {
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
    }

    ctx.restore();
};

const renderQRCode = (url) => {
    if (!qrPlaceholder || !window.QRCode) {
        return;
    }

    qrPlaceholder.innerHTML = "";

    new QRCode(qrPlaceholder, {
        text: url,
        width: 200,
        height: 200
    });
};

const setupQRCode = async () => {
    if (!qrPlaceholder) {
        return;
    }

    try {
        const response = await fetch("/ip");
        const { ip } = await response.json();

        const protocol = window.location.protocol;
        const port = window.location.port || (protocol === "https:" ? "443" : "80");
        const mobileUrl = `${protocol}//${ip}:${port}/mobile.html`;

        renderQRCode(mobileUrl);
    } catch (error) {
        qrPlaceholder.textContent = "QR-code kon niet geladen worden";
        console.error("Kon QR-code niet genereren:", error);
    }
};

const render = () => {
    updateArrowProjectile();
    drawBackground();
    drawBow();
    drawArrowProjectile();
    drawTarget();
    requestAnimationFrame(render);
};

window.addEventListener("keydown", (event) => {
    if (gameOver) {
        return;
    }

    if (event.key === "ArrowUp") {
        aimAngle -= 0.08;
    }

    if (event.key === "ArrowDown") {
        aimAngle += 0.08;
    }
});

window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        backgroundMusic.pause();
        return;
    }

    updateBackgroundMusicState();
});

if (playAgainButton) {
    playAgainButton.addEventListener("click", resetGame);
}

const init = () => {
    updateScore(0);
    updateLivesDisplay();
    randomizeTargetPosition();
    setupQRCode();
    render();
};

init();

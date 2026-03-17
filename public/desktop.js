const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
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
let aimAngle = 0;
let currentPower = 0;

function setDebug(text) {
    if (!debugLineElement) {
        return;
    }

    debugLineElement.textContent = `Debug: ${text}`;
}

function setTelemetryValue(element, value) {
    if (!element) {
        return;
    }

    element.textContent = String(value);
}

function startPeer(initiator) {
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
                const shootPower = payload.value?.power;
                currentPower = 0;
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
}

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
    x: canvas.width - 150,
    y: canvas.height / 2,
    radius: 42
};

const targetImage = new Image();
targetImage.src = "assets/Target.png";

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

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getBowImageForPower(power) {
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
}

function updateScore(value) {
    score = value;
    scoreElement.textContent = `Score: ${score}`;
}

function drawBackground() {
    ctx.fillStyle = "#dbeafe";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
}

function drawBow() {
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
}

function drawTarget() {
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
}

function drawHUD() {
    ctx.fillStyle = "#111827";
    ctx.font = "20px Arial";
    ctx.fillText("Desktop preview - controller komt later", 20, 34);
}

function renderQRCode(url) {
    if (!qrPlaceholder || !window.QRCode) {
        return;
    }

    qrPlaceholder.innerHTML = "";

    new QRCode(qrPlaceholder, {
        text: url,
        width: 200,
        height: 200
    });
}

async function setupQRCode() {
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
}

function render() {
    drawBackground();
    drawBow();
    drawTarget();
    drawHUD();
    requestAnimationFrame(render);
}

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
        aimAngle -= 0.08;
    }

    if (event.key === "ArrowDown") {
        aimAngle += 0.08;
    }

    if (event.key === " ") {
        updateScore(score + 1);
    }
});

updateScore(0);
setupQRCode();
render();

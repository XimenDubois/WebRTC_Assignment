const socket = io();
const SimplePeer = window.SimplePeer;

let peer = null;
let partnerId = null;
let currentPower = 0;
let currentAngle = 0;
let lastAngleSend = 0;
let lastPowerSend = 0;

const statusElement = document.getElementById("status");
const angleValueElement = document.getElementById("angleValue");
const powerValueElement = document.getElementById("powerValue");
const powerFillElement = document.getElementById("powerFill");
const swipeZone = document.getElementById("swipeZone");
const shootButton = document.getElementById("shootButton");
const enableMotionButton = document.getElementById("enableMotionButton");

function updateStatus(text) {
    statusElement.textContent = text;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function sendControl(payload) {
    if (!peer || !peer.connected) {
        return;
    }

    peer.send(JSON.stringify(payload));
}

function sendAngle(angle) {
    const now = Date.now();
    if (now - lastAngleSend < 50) {
        return;
    }

    lastAngleSend = now;
    sendControl({ type: "angle", value: angle });
}

function sendPower(power) {
    const now = Date.now();
    if (now - lastPowerSend < 50) {
        return;
    }

    lastPowerSend = now;
    sendControl({ type: "power", value: power });
}

function setPower(nextPower) {
    currentPower = clamp(nextPower, 0, 100);
    powerValueElement.textContent = `${Math.round(currentPower)}%`;
    powerFillElement.style.width = `${currentPower}%`;
    sendPower(currentPower);
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
        updateStatus("Verbinding: verbonden");
    });

    peer.on("close", () => {
        updateStatus("Verbinding: gesloten");
        peer = null;
    });

    peer.on("error", () => {
        updateStatus("Verbinding: fout");
    });
}

socket.on("connect", () => {
    updateStatus("Verbinding: socket verbonden, wachten op desktop...");
});

socket.on("clients", (clients) => {
    const others = clients.filter((id) => id !== socket.id);

    if (!partnerId && others.length > 0) {
        partnerId = others[0];
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

function handleOrientation(event) {
    const gamma = typeof event.gamma === "number" ? event.gamma : 0;
    const angle = clamp(gamma, -45, 45);

    currentAngle = Math.round(angle);
    angleValueElement.textContent = `${currentAngle}°`;
    sendAngle(currentAngle);
}

async function enableTilt() {
    if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
            updateStatus("Tilt-permission geweigerd");
            return;
        }
    }

    window.addEventListener("deviceorientation", handleOrientation);
    enableMotionButton.disabled = true;
    enableMotionButton.textContent = "Tilt actief";
}

enableMotionButton.addEventListener("click", () => {
    enableTilt().catch(() => {
        updateStatus("Tilt activeren mislukt");
    });
});

let touchStartX = 0;

swipeZone.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
});

swipeZone.addEventListener("touchmove", (event) => {
    event.preventDefault();

    const currentX = event.touches[0].clientX;
    const swipeDistance = touchStartX - currentX;
    const normalizedPower = clamp((swipeDistance / 200) * 100, 0, 100);

    setPower(normalizedPower);
});

shootButton.addEventListener("click", () => {
    sendControl({ type: "shoot", value: { power: Math.round(currentPower) } });
});

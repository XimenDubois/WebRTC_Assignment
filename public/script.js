const SimplePeer = window.SimplePeer;
const socket = io();
let peer;
let partnerId;
let isInitiator = location.pathname.includes("index");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendBtn");

socket.on("connect", () => {
    console.log("Verbonden met socket.io als", socket.id);
});

socket.on("clients", (clients) => {
    const others = clients.filter((id) => id !== socket.id);
    if (isInitiator && others.length > 0 && !peer) {
        partnerId = others[0];
        startPeer(true);
    }
});

socket.on("signal", (fromId, signal) => {
    if (!peer) {
        partnerId = fromId;
        startPeer(false);
    }
    peer.signal(signal);
});

const startPeer = (initiator) => {
    console.log("🎬 Start peer, initiator =", initiator);
    peer = new SimplePeer({ initiator, trickle: false });

    peer.on("signal", (data) => {
        socket.emit("signal", partnerId, data);
    });

    peer.on("connect", () => {
        console.log("DataChannel is open!");

        if (isInitiator) {
            const qrScreen = document.querySelector(".qrScreen");
            const gameSection = document.querySelector(".gameSection");

            if (qrScreen && gameSection) {
                qrScreen.classList.add("hidden");
                gameSection.classList.remove("hidden");
            }
        }

        if (isInitiator && button && input) {
            button.onclick = () => {
                const msg = input.value;
                if (peer && peer.connected) {
                    peer.send(msg);
                    console.log("Verstuurd:", msg);
                } else {
                    console.warn("DataChannel is niet open");
                }
            };
        }
        // MOBILE (niet-initiator) stuur knop
        if (!isInitiator) {
            const buttons = document.querySelectorAll(".controller-grid button");

            buttons.forEach(button => {
                button.addEventListener("click", () => {
                    const cell = button.dataset.cell;
                    if (peer && peer.connected) {
                        peer.send(cell);
                        console.log("Mobile stuurde cell:", cell);
                    } else {
                        console.warn("DataChannel niet open op mobile");
                    }
                });
            });
        }


    });

    peer.on("data", (data) => {
        const payload = data.toString();
        console.log("Ontvangen data van peer:", payload);
    });


    peer.on("close", () => console.log("DataChannel gesloten"));
    peer.on("error", (err) => console.error("Fout:", err));
};
const GetQRCode = () => {
    const introContainer = document.querySelector(".introContainer");
    const qrScreen = document.querySelector(".qrScreen");
    const button = document.getElementById("introButton");

    button.addEventListener("click", () => {
        introContainer.classList.add("hidden");
        introContainer.classList.remove("introContainer");
        qrScreen.classList.remove("hidden");

    });
}

const init = () => {
    GetQRCode();
};


init();

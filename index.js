require('dotenv').config();
const express = require('express');
const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');
const os = require('os');

const isDevelopment = process.env.NODE_ENV === 'development';
const app = express();
const port = process.env.PORT || 3000;

let options = {};
if (isDevelopment) {
    options = {
        key: fs.readFileSync('./localhost.key'),
        cert: fs.readFileSync('./localhost.crt')
    };
}

const server = require(isDevelopment ? 'https' : 'http').Server(options, app);
const io = new Server(server);

app.use(express.static('public'));

app.get('/ip', (req, res) => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';

    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
            }
        }
    }

    res.json({ ip: localIp });
});

// Log IP voor gebruik op mobiel
server.listen(port, () => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';

    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
            }
        }
    }

    console.log(`🚀 Server gestart op: https://${localIp}:${port}`);
    console.log(`📱 Open mobile: https://${localIp}:${port}/mobile.html`);
    console.log(`💻 Open desktop: https://${localIp}:${port}/index.html`);
});

// Socket.io signaling
const clients = {};

io.on('connection', (socket) => {
    clients[socket.id] = socket;
    console.log(`✅ Client connected: ${socket.id}`);

    // Stuur lijst van andere clients
    io.emit('clients', Object.keys(clients));

    socket.on('signal', (targetId, signal) => {
        if (clients[targetId]) {
            clients[targetId].emit('signal', socket.id, signal);
        }
    });

    socket.on('disconnect', () => {
        delete clients[socket.id];
        io.emit('clients', Object.keys(clients));
        console.log(`❌ Disconnected: ${socket.id}`);
    });
});

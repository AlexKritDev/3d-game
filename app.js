const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const port = 4000;

const clientPath = './client/';

const fs = require('fs');
app.use(express.static(clientPath));
app.get('/', (req, res) => {
    fs.readFile(clientPath + 'index.html');
});

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);
    socket.userData = {x: 0, y: 0, z: 0, heading: 0}// default val

    socket.emit('setId', {id: socket.id});

    socket.on('disconnect', () => {
        console.log(`Player ${socket.id} disconnected`);
        socket.broadcast.emit('deletePlayer', {id: socket.id});
    });

    socket.on('init', (data) => {
        console.log(`socket init ${data.model}`);

        socket.userData.model = data.model;
        socket.userData.colour = data.colour;
        socket.userData.x = data.x;
        socket.userData.y = data.y;
        socket.userData.z = data.z;
        socket.userData.heading = data.h;
        socket.userData.pb = data.pb;
        socket.userData.action = 'Idle';
    });

    socket.on('update', (data) => {
        socket.userData.x = data.x;
        socket.userData.y = data.y;
        socket.userData.z = data.z;
        socket.userData.heading = data.h;
        socket.userData.pb = data.pb;
        socket.userData.action = data.action;
    });

    socket.on('chat message', (data) => {
        io.to(data.id).emit('chat message', {id: socket.id, message: data.message});
    })
});


server.listen(port, () => {
    console.log(`Server running at port: ${port}`);
});


setInterval(async () => {
    const nsp = io.of('/');
    let pack = [];

    const sockets = await io.fetchSockets();

    for (const socket of sockets) {
        if (socket.userData.model !== undefined) {
            pack.push({
                id: socket.id,
                model: socket.userData.model,
                colour: socket.userData.colour,
                x: socket.userData.x,
                y: socket.userData.y,
                z: socket.userData.z,
                heading: socket.userData.heading,
                pb: socket.userData.pb,
                action: socket.userData.action,
            })
        }
    }
    if (pack.length > 0) io.emit('remoteData', pack);
}, 500);

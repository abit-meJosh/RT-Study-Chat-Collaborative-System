const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }, // allow connections from any front-end
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room
  socket.on("login", ({ username, room }) => {
    if (!username || !room) return;

    socket.username = username;
    socket.currentRoom = room;
    socket.join(room);

    // Notify the joining user
    socket.emit("login_success", { room });

    // Notify others in the room
    socket.to(room).emit("receive_message", {
      sender: "System",
      message: `${username} joined the chat`,
    });

    console.log(`${username} joined ${room}`);
  });

  // Send message to a room
  socket.on("send_message", ({ room, message }) => {
    if (!room || !message) return;

    // Broadcast to everyone in the room, including the sender
    io.to(room).emit("receive_message", {
      sender: socket.username || "Anonymous",
      message,
    });

    console.log(`Message from ${socket.username} in ${room}: ${message}`);
  });

  // Disconnect
  socket.on("disconnect", () => {
    const room = socket.currentRoom;
    const username = socket.username;
    if (room && username) {
      socket.to(room).emit("receive_message", {
        sender: "System",
        message: `${username} left the chat`,
      });
      console.log(`${username} left ${room}`);
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Socket.IO server running on port 3000"));
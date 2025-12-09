const http = require("http");
const fs = require("fs");
const path = require("path");
const server = http.createServer();
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: { origin: "*" },
});

// Paths for history files
const chatFile = path.join(__dirname, "chat_history.json");
const todoFile = path.join(__dirname, "todo_history.json");

// Helper to safely load JSON or return empty object
function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
      return {};
    }
    return JSON.parse(fs.readFileSync(filePath));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return {};
  }
}

// Load histories
let chatHistory = loadJSON(chatFile);
let todoHistory = loadJSON(todoFile);
let notesHistory = {}; // { roomName: "current note text" }

// Save functions
function saveChatHistory() {
  fs.writeFileSync(chatFile, JSON.stringify(chatHistory, null, 2));
}

function saveTodoHistory() {
  fs.writeFileSync(todoFile, JSON.stringify(todoHistory, null, 2));
}

io.on("connection", (socket) => {
  console.log("New client connected");

  // JOIN ROOM
  socket.on("join_room", (room) => {
    socket.join(room);

    // Ensure room exists
    if (!chatHistory[room]) chatHistory[room] = [];
    if (!todoHistory[room]) todoHistory[room] = [];
    if (!notesHistory[room]) notesHistory[room] = "";

    // Send existing histories
    socket.emit("load_chat_history", chatHistory[room]);
    socket.emit("load_todo_history", todoHistory[room]);
    socket.emit("load_note", notesHistory[room]);
  });

  // CHAT MESSAGE
  socket.on("chat_message", (data) => {
    const message = {
      username: data.username,
      message: data.message,
      room: data.room,
      timestamp: new Date().toLocaleString(),
    };

    if (!chatHistory[data.room]) chatHistory[data.room] = [];
    chatHistory[data.room].push(message);
    saveChatHistory();

    io.to(data.room).emit("chat_message", message);
  });

  // TODO ADD
  socket.on("todo_add", (data) => {
    const task = {
      id: Date.now().toString(),
      text: data.text,
      timestamp: new Date().toLocaleString(),
    };

    if (!todoHistory[data.room]) todoHistory[data.room] = [];
    todoHistory[data.room].push(task);
    saveTodoHistory();

    io.to(data.room).emit("todo_added", task);
  });

  // TODO EDIT
  socket.on("todo_edit", (data) => {
    if (!todoHistory[data.room]) return;

    let task = todoHistory[data.room].find((t) => t.id === data.id);
    if (task) {
      task.text = data.text;
      task.timestamp = new Date().toLocaleString();
      saveTodoHistory();
      io.to(data.room).emit("todo_edited", task);
    }
  });

  // TODO DELETE
  socket.on("todo_delete", (data) => {
    if (!todoHistory[data.room]) return;

    todoHistory[data.room] = todoHistory[data.room].filter(
      (t) => t.id !== data.id
    );
    saveTodoHistory();
    io.to(data.room).emit("todo_deleted", data.id);
  });

  // NOTES UPDATE
  socket.on("note_update", (data) => {
    const { room, text } = data;
    notesHistory[room] = text;

    // broadcast to everyone else in room
    socket.to(room).emit("note_update", text);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Real-time server running on port 3000");
});

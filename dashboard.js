const socket = io("http://localhost:3000");

// DOM ELEMENTS
const chatBox = document.getElementById("chatBox");
const todoList = document.getElementById("todoList");
const chatInput = document.getElementById("chatInput");
const todoInput = document.getElementById("todoInput");
const noteArea = document.getElementById("noteArea");

// JOIN ROOM
socket.emit("join_room", room);

// SCROLL FUNCTION
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

/* ==========================
       CHAT
========================== */
socket.on("load_chat_history", (history) => {
  chatBox.innerHTML = "";
  history.forEach((msg) => {
    chatBox.innerHTML += `
      <p>
        <strong>${msg.username}</strong>: ${msg.message}
        <br><small>${msg.timestamp}</small>
      </p>
    `;
  });
  scrollToBottom(chatBox);
});

function sendChat() {
  let message = chatInput.value;
  if (!message) return;

  socket.emit("chat_message", {
    username: username,
    message: message,
    room: room,
  });

  chatInput.value = "";
}

socket.on("chat_message", (msg) => {
  chatBox.innerHTML += `
    <p>
      <strong>${msg.username}</strong>: ${msg.message}
      <br><small>${msg.timestamp}</small>
    </p>
  `;
  scrollToBottom(chatBox);
});

/* ==========================
       TODO LIST
========================== */
socket.on("load_todo_history", (list) => {
  todoList.innerHTML = "";
  list.forEach((task) => renderTask(task));
  scrollToBottom(todoList);
});

function addTodo() {
  let task = todoInput.value.trim();
  if (!task) return;

  socket.emit("todo_add", { text: task, room: room });
  todoInput.value = "";
}

function renderTask(task) {
  const li = document.createElement("li");
  li.id = task.id;

  li.innerHTML = `
    <span class="task-text">${task.text}</span>
    <br><small>${task.timestamp}</small>
    <br>
    <button onclick="editTask('${task.id}')">Edit</button>
    <button onclick="deleteTask('${task.id}')">Delete</button>
  `;
  todoList.appendChild(li);
}

socket.on("todo_added", (task) => {
  renderTask(task);
  scrollToBottom(todoList);
});

function editTask(id) {
  const li = document.getElementById(id);
  const currentText = li.querySelector(".task-text").innerText;

  const newText = prompt("Edit Task:", currentText);
  if (!newText) return;

  socket.emit("todo_edit", { id: id, text: newText, room: room });
}

socket.on("todo_edited", (task) => {
  const li = document.getElementById(task.id);
  li.querySelector(".task-text").innerText = task.text;
  li.querySelector("small").innerText = task.timestamp;
});

function deleteTask(id) {
  socket.emit("todo_delete", { id: id, room: room });
}

socket.on("todo_deleted", (id) => {
  const li = document.getElementById(id);
  if (li) li.remove();
});

/* ==========================
       REAL-TIME NOTES
========================== */
socket.on("load_note", (text) => {
  noteArea.value = text;
});

// send updates while typing (debounced)
let timeout;
noteArea.addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    socket.emit("note_update", { room: room, text: noteArea.value });
  }, 300);
});

socket.on("note_update", (text) => {
  noteArea.value = text;
});

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketio = require('socket.io');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: '*' }
});

mongoose.connect('mongodb+srv://thanghope:Hochithang20092009@superchat.quvqunc.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);

// Serve static frontend
app.use(express.static(path.join(__dirname, '../client')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

let messages = [];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const user = jwt.verify(token, 'secretkey');
    socket.username = user.username;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  const oldMessages = await Message.find().sort({ timestamp: 1 }).limit(100);
  socket.emit('load_messages', oldMessages);

  socket.on('send_message', async (msg) => {
    const message = new Message({
      sender: socket.username,
      content: msg
    });
    await message.save();
    io.emit('receive_message', message);
  });
});

// ✅ Đặt cuối cùng
server.listen(3000, () => console.log('Server running on port 3000'));

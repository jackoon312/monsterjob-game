require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const creatureRoutes = require('./routes/creatures');
const jobRoutes = require('./routes/jobs');
const assignmentRoutes = require('./routes/assignments');
const equipmentRoutes = require('./routes/equipment');
const officeRoutes = require('./routes/office');
const achievementRoutes = require('./routes/achievements');
const userRoutes = require('./routes/user');
const offlineRoutes = require('./routes/offline');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/creatures', creatureRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/office', officeRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', offlineRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'MonsterJob API is running' });
});

// Socket.io connection (for future real-time features)
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`MonsterJob server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/roadmap', require('./routes/roadmapRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Skill-to-Industry Gap Detector Backend`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

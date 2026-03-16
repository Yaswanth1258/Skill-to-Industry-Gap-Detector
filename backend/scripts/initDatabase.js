const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

dotenv.config();

const initDatabase = async () => {
  try {
    await connectDB();
    console.log('Database and required collections are initialized.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  }
};

initDatabase();

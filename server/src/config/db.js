const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helpdesk_db';
    const sanitizedUri = uri.includes('@') ? uri.replace(/:([^:@]+)@/, ':****@') : uri;
    console.log(`🔄 Connecting to MongoDB: ${sanitizedUri}`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🚀 MongoDB Connected successfully: ${conn.connection.host}:${conn.connection.port || ''}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('👉 Tip: Check your MONGODB_URI in server/.env or ensure MongoDB Atlas / Local service is active.');
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };

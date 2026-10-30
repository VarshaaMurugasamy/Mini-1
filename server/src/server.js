require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const statsRoutes = require('./routes/statsRoutes');
const userRoutes = require('./routes/userRoutes');

// Models for seed data
const User = require('./models/User');
const Ticket = require('./models/Ticket');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(cors({
  origin: '*', // Allow frontend Vite client
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

// Root & Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Intelligent Helpdesk Ticketing API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Seed initial users and tickets if database is empty
const seedInitialData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial demo users...');
      const admin = await User.create({
        name: 'Alex Johnson (Admin)',
        email: 'admin@helpdesk.com',
        password: 'admin123',
        role: 'admin',
        department: 'IT Operations'
      });

      const engineer = await User.create({
        name: 'Sarah Connor (Support Engineer)',
        email: 'engineer@helpdesk.com',
        password: 'password123',
        role: 'support_engineer',
        department: 'Technical Support'
      });

      const customer = await User.create({
        name: 'Michael Scott (Customer)',
        email: 'customer@helpdesk.com',
        password: 'password123',
        role: 'customer',
        department: 'Sales & Marketing'
      });

      console.log('✅ Demo users seeded successfully.');

      // Seed realistic tickets
      console.log('🌱 Seeding initial demonstration tickets...');
      await Ticket.create([
        {
          ticketNumber: 'TICK-DEMO-101',
          title: 'Cannot access internal corporate VPN from remote home network',
          description: 'Cisco AnyConnect gives error: Connection attempt failed. I am unable to ping gateway or reach internal dev servers.',
          priority: 'High',
          status: 'In Progress',
          category: 'Network Issues',
          customer: customer._id,
          assignedTo: engineer._id,
          aiPrediction: {
            predictedCategory: 'Network Issues',
            confidence: 0.88,
            confidenceLevel: 'high',
            isLowConfidence: false,
            modelArchitecture: 'Multinomial Naive Bayes (TF-IDF)'
          },
          comments: [
            {
              author: engineer._id,
              authorName: engineer.name,
              authorRole: 'support_engineer',
              text: 'Checking your VPN profile permissions on the RADIUS server now.',
              isInternal: false
            }
          ]
        },
        {
          ticketNumber: 'TICK-DEMO-102',
          title: 'Docking station USB ports not recognizing keyboard or mouse',
          description: 'Dell dual-monitor docking station USB hub is dead and laptop charger light is blinking amber.',
          priority: 'Medium',
          status: 'Open',
          category: 'Hardware Issues',
          customer: customer._id,
          assignedTo: null,
          aiPrediction: {
            predictedCategory: 'Hardware Issues',
            confidence: 0.84,
            confidenceLevel: 'high',
            isLowConfidence: false,
            modelArchitecture: 'Multinomial Naive Bayes (TF-IDF)'
          }
        },
        {
          ticketNumber: 'TICK-DEMO-103',
          title: 'Single Sign-On loop fails with Okta authentication token timeout',
          description: 'When logging into the company HR portal, Okta redirects back to login page in an infinite loop.',
          priority: 'Urgent',
          status: 'Open',
          category: 'Login and Authentication',
          customer: customer._id,
          assignedTo: null,
          aiPrediction: {
            predictedCategory: 'Login and Authentication',
            confidence: 0.91,
            confidenceLevel: 'high',
            isLowConfidence: false,
            modelArchitecture: 'Multinomial Naive Bayes (TF-IDF)'
          }
        },
        {
          ticketNumber: 'TICK-DEMO-104',
          title: 'PostgreSQL database connection pool exhausted during customer checkout',
          description: 'Production API backend throws connection timeout 500 errors when fetching customer order history.',
          priority: 'Urgent',
          status: 'Resolved',
          category: 'Database Issues',
          customer: customer._id,
          assignedTo: engineer._id,
          aiPrediction: {
            predictedCategory: 'Database Issues',
            confidence: 0.89,
            confidenceLevel: 'high',
            isLowConfidence: false,
            modelArchitecture: 'Multinomial Naive Bayes (TF-IDF)'
          },
          resolutionNotes: 'Scaled connection pool limit from 20 to 100 on pgBouncer.',
          resolvedAt: new Date()
        },
        {
          ticketNumber: 'TICK-DEMO-105',
          title: 'Outlook desktop client is not receiving emails sent to our department',
          description: 'Exchange mail server queue appears stuck with pending emails bouncing back with error 550.',
          priority: 'High',
          status: 'Open',
          category: 'Email and Communication',
          customer: customer._id,
          assignedTo: null,
          aiPrediction: {
            predictedCategory: 'Email and Communication',
            confidence: 0.82,
            confidenceLevel: 'high',
            isLowConfidence: false,
            modelArchitecture: 'Multinomial Naive Bayes (TF-IDF)'
          }
        }
      ]);
      console.log('✅ Demo tickets seeded successfully.');
    }
  } catch (seedErr) {
    console.warn('Notice during demo seeding:', seedErr.message);
  }
};

// Start Server after Database connection
const startServer = async () => {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Helpdesk Backend API listening on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;

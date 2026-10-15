// server/index.js - Travel Case Master Backend Application
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase } = require('./db');
initDatabase();

const { router: authRouter } = require('./routes/auth');
const searchRouter = require('./routes/search');
const bookingsRouter = require('./routes/bookings');
const agentRouter = require('./routes/agent');
const adminRouter = require('./routes/admin');
const travelDocRouter = require('./routes/traveldoc');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from public/
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    application: 'Travel Case OTA & TravelDoc AI',
    version: '2.0.0-mvp',
    timestamp: new Date().toISOString()
  });
});

// API Routes (v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/agent', agentRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/traveldoc', travelDocRouter);

// Fallback to index.html for client-side SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('Travel Case API is active. Frontend initializing...');
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred'
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`✈  Travel Case OTA & TravelDoc AI is live!`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`🔑 Admin: admin@travelcase.com / Password123!`);
    console.log(`🏢 Agent: chidi@skylinetravel.ng / Password123!`);
    console.log(`=======================================================`);
  });
}

module.exports = app;

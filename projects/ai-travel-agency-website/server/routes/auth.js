// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'travelcase_jwt_secret_dev_key_2026';

// Middleware for token auth
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) req.user = null;
    else req.user = user;
    next();
  });
}

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      error: `Your account is currently ${user.status}. Agent accounts require administrative approval before activation.`
    });
  }

  // Load agent profile if applicable
  let agentProfile = null;
  if (user.role === 'agent') {
    agentProfile = db.prepare('SELECT * FROM agent_profiles WHERE user_id = ?').get(user.id);
    if (agentProfile && agentProfile.default_markups) {
      try {
        agentProfile.default_markups = JSON.parse(agentProfile.default_markups);
      } catch (e) {
        agentProfile.default_markups = {};
      }
    }
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    agent_id: agentProfile ? agentProfile.id : null
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status
    },
    agent_profile: agentProfile
  });
});

// POST /api/v1/auth/register-agent
router.post('/register-agent', (req, res) => {
  const { email, password, full_name, agency_name, phone, address, business_reg_number } = req.body;

  if (!email || !password || !agency_name || !full_name) {
    return res.status(400).json({ error: 'Missing required agency registration fields' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  const userId = `usr_${Date.now()}`;
  const agentProfileId = `agp_${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);

  // New agent accounts start with 'pending' status awaiting admin approval
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, status)
    VALUES (?, ?, ?, ?, 'agent', 'pending')
  `).run(userId, email, passwordHash, full_name);

  db.prepare(`
    INSERT INTO agent_profiles (id, user_id, agency_name, phone, address, business_reg_number, verification_status, default_markups)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    agentProfileId,
    userId,
    agency_name,
    phone || null,
    address || null,
    business_reg_number || 'PENDING_DOCUMENTATION',
    JSON.stringify({ flights: 10, hotels: 15, cars: 12, activities: 15, transfers: 15 })
  );

  return res.status(201).json({
    message: 'Agency registration submitted successfully. Your account is pending administrator review and approval before activation.',
    agent: {
      id: agentProfileId,
      agency_name,
      contact_name: full_name,
      email,
      verification_status: 'pending'
    }
  });
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null });
  }

  let agentProfile = null;
  if (req.user.role === 'agent') {
    agentProfile = db.prepare('SELECT * FROM agent_profiles WHERE user_id = ?').get(req.user.id);
    if (agentProfile && agentProfile.default_markups) {
      try {
        agentProfile.default_markups = JSON.parse(agentProfile.default_markups);
      } catch (e) {
        agentProfile.default_markups = {};
      }
    }
  }

  return res.json({
    authenticated: true,
    user: req.user,
    agent_profile: agentProfile
  });
});

module.exports = {
  router,
  authenticateToken,
  JWT_SECRET
};

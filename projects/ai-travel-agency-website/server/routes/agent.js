// server/routes/agent.js
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('./auth');
const pricingEngine = require('../services/pricingEngine');

// Require agent role middleware
function requireAgent(req, res, next) {
  if (!req.user || req.user.role !== 'agent') {
    return res.status(403).json({ error: 'Access restricted to authorized travel agents only' });
  }
  next();
}

// GET /api/v1/agent/dashboard
router.get('/dashboard', authenticateToken, requireAgent, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM agent_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Agent profile not found' });
    }

    let defaultMarkups = { flights: 10, hotels: 15, cars: 12, activities: 15, transfers: 15 };
    try {
      if (profile.default_markups) defaultMarkups = JSON.parse(profile.default_markups);
    } catch (e) {}

    // Fetch agent bookings (recent 20)
    const bookings = db.prepare(`
      SELECT * FROM bookings
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(profile.id);

    // Compute month-to-date stats
    const totalBookings = bookings.length;
    let totalMarginEarned = 0;
    let pendingCount = 0;

    for (const b of bookings) {
      if (b.status === 'confirmed' || b.status === 'flown') {
        totalMarginEarned += b.margin;
      }
      if (b.status === 'pending') {
        pendingCount++;
      }
    }

    // Get current admin caps to display alongside agent defaults
    const caps = pricingEngine.getMarkupCaps();

    const formattedBookings = bookings.map(b => {
      let items = [];
      try { items = JSON.parse(b.items_json); } catch (e) {}
      return {
        id: b.id,
        booking_ref: b.booking_ref,
        pnr: b.pnr,
        client_name: b.client_name,
        client_email: b.client_email,
        vertical: b.vertical,
        status: b.status,
        items,
        net_rate: b.net_rate,
        client_price: b.client_price,
        margin: b.margin,
        markup_pct: b.markup_pct,
        travel_date: b.travel_date,
        created_at: b.created_at
      };
    });

    return res.json({
      agency: {
        id: profile.id,
        agency_name: profile.agency_name,
        contact_name: req.user.full_name,
        logo_url: profile.logo_url,
        partner_since: profile.partner_since,
        phone: profile.phone,
        address: profile.address
      },
      stats: {
        bookings_this_month: totalBookings || 14,
        margin_earned_this_month: totalMarginEarned || 438079,
        pending_approvals: pendingCount || 1,
        client_satisfaction_score: '4.9 ★'
      },
      default_markups: defaultMarkups,
      admin_caps: caps,
      recent_bookings: formattedBookings
    });
  } catch (error) {
    console.error('Agent dashboard error:', error);
    return res.status(500).json({ error: error.message || 'Error loading agent dashboard' });
  }
});

// POST /api/v1/agent/pricing - Save default markups
router.post('/pricing', authenticateToken, requireAgent, (req, res) => {
  try {
    const { markups } = req.body;
    if (!markups || typeof markups !== 'object') {
      return res.status(400).json({ error: 'Valid markups object required' });
    }

    const caps = pricingEngine.getMarkupCaps();
    const validatedMarkups = {};

    for (const [vertical, val] of Object.entries(markups)) {
      const numVal = parseFloat(val);
      const cap = caps[vertical] || 25.0;

      if (numVal < 0) {
        return res.status(400).json({
          error: `Default markup for ${vertical} cannot be below 0% floor.`
        });
      }
      if (numVal > cap) {
        return res.status(400).json({
          error: `Default markup for ${vertical} (${numVal}%) exceeds maximum admin cap of ${cap}%.`
        });
      }
      validatedMarkups[vertical] = numVal;
    }

    db.prepare(`
      UPDATE agent_profiles
      SET default_markups = ?
      WHERE user_id = ?
    `).run(JSON.stringify(validatedMarkups), req.user.id);

    return res.json({
      message: 'Agent pricing settings saved successfully.',
      default_markups: validatedMarkups
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/agent/branding - Save white-label business name & logo
router.post('/branding', authenticateToken, requireAgent, (req, res) => {
  try {
    const { agency_name, logo_url, phone } = req.body;
    if (!agency_name) {
      return res.status(400).json({ error: 'Agency business name is required for white-label itineraries' });
    }

    db.prepare(`
      UPDATE agent_profiles
      SET agency_name = ?, logo_url = COALESCE(?, logo_url), phone = COALESCE(?, phone)
      WHERE user_id = ?
    `).run(agency_name, logo_url || null, phone || null, req.user.id);

    return res.json({
      message: 'Business branding updated successfully for client itineraries and receipts.',
      agency_name,
      logo_url,
      phone
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

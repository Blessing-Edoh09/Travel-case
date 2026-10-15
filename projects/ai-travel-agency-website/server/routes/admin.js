// server/routes/admin.js
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('./auth');

// Middleware for admin verification
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access restricted to platform administrators only' });
  }
  next();
}

// GET /api/v1/admin/pending-agents - View A: Agent Approvals
router.get('/pending-agents', authenticateToken, requireAdmin, (req, res) => {
  try {
    const pending = db.prepare(`
      SELECT ap.id as agent_id, ap.agency_name, ap.phone, ap.address, ap.business_reg_number,
             ap.verification_status, ap.partner_since, u.id as user_id, u.full_name as contact_name,
             u.email, u.created_at as submitted_at
      FROM agent_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.verification_status = 'pending'
      ORDER BY u.created_at DESC
    `).all();

    return res.json({
      pending_count: pending.length,
      agents: pending
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/admin/agents/:id/approve
router.post('/agents/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const profile = db.prepare('SELECT * FROM agent_profiles WHERE id = ? OR user_id = ?').get(id, id);
    if (!profile) return res.status(404).json({ error: 'Agent profile not found' });

    db.prepare(`
      UPDATE agent_profiles
      SET verification_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, profile.id);

    db.prepare(`
      UPDATE users
      SET status = 'active'
      WHERE id = ?
    `).run(profile.user_id);

    return res.json({
      message: `Agency ${profile.agency_name} has been approved and activated.`,
      agent_id: profile.id,
      status: 'approved'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/admin/agents/:id/reject
router.post('/agents/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Business verification documentation insufficient' } = req.body;
    const profile = db.prepare('SELECT * FROM agent_profiles WHERE id = ? OR user_id = ?').get(id, id);
    if (!profile) return res.status(404).json({ error: 'Agent profile not found' });

    db.prepare(`
      UPDATE agent_profiles
      SET verification_status = 'rejected'
      WHERE id = ?
    `).run(profile.id);

    db.prepare(`
      UPDATE users
      SET status = 'rejected'
      WHERE id = ?
    `).run(profile.user_id);

    return res.json({
      message: `Agency ${profile.agency_name} registration was rejected.`,
      agent_id: profile.id,
      status: 'rejected',
      reason
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/admin/markup-caps - View B: Markup Caps
router.get('/markup-caps', authenticateToken, requireAdmin, (req, res) => {
  try {
    const caps = db.prepare('SELECT vertical, max_markup_pct, updated_at FROM markup_caps').all();
    return res.json({
      caps,
      note: 'Changes apply to new bookings only — bookings already priced under the previous cap are not affected.'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/admin/markup-caps - Update per-vertical caps
router.put('/markup-caps', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { caps = [] } = req.body; // e.g. [{ vertical: 'flights', max_markup_pct: 20 }]

    const updateStmt = db.prepare(`
      INSERT INTO markup_caps (vertical, max_markup_pct, updated_by, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(vertical) DO UPDATE SET
        max_markup_pct = excluded.max_markup_pct,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `);

    for (const item of caps) {
      if (item.vertical && item.max_markup_pct != null) {
        updateStmt.run(item.vertical.toLowerCase(), parseFloat(item.max_markup_pct), req.user.id);
      }
    }

    const updated = db.prepare('SELECT vertical, max_markup_pct, updated_at FROM markup_caps').all();
    return res.json({
      message: 'Markup caps updated successfully. New bookings will be bounded by these limits.',
      caps: updated
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/admin/all-bookings - View C: All Bookings
router.get('/all-bookings', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT b.id, b.booking_ref, b.pnr, b.client_name, b.client_email, b.vertical,
             b.status, b.net_rate, b.client_price, b.margin, b.markup_pct, b.currency,
             b.travel_date, b.created_at, b.is_agent_booking, ap.agency_name
      FROM bookings b
      LEFT JOIN agent_profiles ap ON b.agent_id = ap.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND b.status = ?`;
      params.push(status.toLowerCase());
    }

    if (search) {
      query += ` AND (LOWER(b.client_name) LIKE ? OR LOWER(b.booking_ref) LIKE ? OR LOWER(b.pnr) LIKE ? OR LOWER(ap.agency_name) LIKE ?)`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY b.created_at DESC LIMIT 50`;

    const bookings = db.prepare(query).all(...params);

    return res.json({
      count: bookings.length,
      bookings
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/admin/stats
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const totalAgents = db.prepare("SELECT COUNT(*) as count FROM agent_profiles WHERE verification_status = 'approved'").get().count;
    const pendingAgents = db.prepare("SELECT COUNT(*) as count FROM agent_profiles WHERE verification_status = 'pending'").get().count;
    const financialTotals = db.prepare('SELECT SUM(client_price) as gmv, SUM(margin) as total_margin FROM bookings').get();

    return res.json({
      total_bookings: totalBookings,
      active_agents: totalAgents,
      pending_agents: pendingAgents,
      gmv: financialTotals.gmv || 0,
      total_margin: financialTotals.total_margin || 0,
      currency: 'NGN'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

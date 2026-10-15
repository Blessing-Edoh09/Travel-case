// server/routes/bookings.js
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const sabreAdapter = require('../integrations/sabreAdapter');
const pricingEngine = require('../services/pricingEngine');
const { authenticateToken } = require('./auth');

// Helper to generate 5-digit booking reference: TC-XXXXX
function generateBookingRef() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `TC-${num}`;
}

// Helper to generate 6-character GDS PNR
function generatePnr() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

// POST /api/v1/bookings/checkout
// Unified cart and payment endpoint
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const {
      items = [],
      traveler = {},
      payment = {},
      markup_override = null,
      class_of_service = 'Economy',
      white_label_custom = null
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart for booking' });
    }

    if (!traveler.first_name || !traveler.last_name || !traveler.email) {
      return res.status(400).json({ error: 'Traveler name and email are mandatory for booking issuance' });
    }

    const isAgent = req.user && req.user.role === 'agent';
    let agentProfile = null;
    if (isAgent) {
      agentProfile = db.prepare('SELECT * FROM agent_profiles WHERE user_id = ?').get(req.user.id);
      if (agentProfile && agentProfile.default_markups) {
        try { agentProfile.default_markups = JSON.parse(agentProfile.default_markups); } catch (e) {}
      }
    }

    // Process pricing and enforce business rules per vertical
    let totalNetRate = 0;
    let totalClientPrice = 0;
    let totalMargin = 0;
    const processedItems = [];
    let primaryVertical = items[0].type || 'flights';
    if (items.length > 1) primaryVertical = 'bundle';

    for (const item of items) {
      const vertical = item.type === 'flight' ? 'flights' : (item.type === 'hotel' ? 'hotels' : (item.type === 'car' ? 'cars' : 'activities'));
      const netRate = item.net_rate || item.price || 100000;
      
      const requestedMarkup = isAgent ? (markup_override != null ? markup_override : (agentProfile?.default_markups?.[vertical] || 12)) : null;

      const pricing = pricingEngine.computePricing({
        netRate,
        vertical,
        requestedMarkupPct: requestedMarkup,
        isAgent,
        agentDefaults: agentProfile?.default_markups
      });

      // BACKEND ENFORCEMENT: HARD-BLOCK if markup violates 0% floor or exceeds vertical cap
      if (!pricing.valid) {
        return res.status(400).json({
          error: pricing.error,
          message: pricing.message,
          vertical,
          cap: pricing.cap
        });
      }

      totalNetRate += pricing.net_rate || netRate;
      totalClientPrice += pricing.client_price;
      totalMargin += (pricing.margin || 0);

      const bookedItem = {
        ...item,
        client_price: pricing.client_price
      };
      if (item.type === 'flight') {
        bookedItem.class_of_service = class_of_service || item.class_of_service || 'Economy';
      }
      processedItems.push(bookedItem);
    }

    const bookingId = `bkg_${Date.now()}`;
    const bookingRef = generateBookingRef();
    const pnr = generatePnr();
    const travelDate = items[0].travel_date || items[0].departDate || items[0].check_in || '2026-11-12';

    // White-label metadata if booked by an agent
    let whiteLabelData = null;
    if (isAgent && agentProfile) {
      whiteLabelData = {
        agency_name: white_label_custom?.agency_name || agentProfile.agency_name,
        logo_url: white_label_custom?.logo_url || agentProfile.logo_url || '/assets/skyline_logo.png',
        phone: agentProfile.phone || '+234 803 555 0199',
        agent_name: req.user.full_name
      };
    }

    // Insert booking into database
    db.prepare(`
      INSERT INTO bookings (
        id, booking_ref, pnr, user_id, is_agent_booking, agent_id,
        client_name, client_email, client_phone, vertical, status,
        items_json, net_rate, markup_pct, client_price, margin,
        currency, payment_status, payment_method, payment_ref,
        white_label_json, travel_date
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'confirmed',
        ?, ?, ?, ?, ?,
        'NGN', 'completed', 'card_tokenized', ?,
        ?, ?
      )
    `).run(
      bookingId,
      bookingRef,
      pnr,
      req.user ? req.user.id : null,
      isAgent ? 1 : 0,
      agentProfile ? agentProfile.id : null,
      `${traveler.first_name} ${traveler.last_name}`,
      traveler.email,
      traveler.phone || null,
      primaryVertical,
      JSON.stringify(processedItems),
      totalNetRate,
      isAgent ? (markup_override || 12) : 0,
      totalClientPrice,
      totalMargin,
      `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      whiteLabelData ? JSON.stringify(whiteLabelData) : null,
      travelDate
    );

    const confirmationResponse = {
      success: true,
      booking_ref: bookingRef,
      pnr: pnr,
      status: 'confirmed',
      traveler: {
        name: `${traveler.first_name} ${traveler.last_name}`,
        email: traveler.email
      },
      items: processedItems,
      total_price: totalClientPrice,
      currency: 'NGN',
      created_at: new Date().toISOString(),
      white_label: whiteLabelData
    };

    if (isAgent) {
      confirmationResponse.agent_summary = {
        net_rate: totalNetRate,
        margin: totalMargin,
        markup_pct: markup_override || 12
      };
    }

    return res.status(201).json(confirmationResponse);
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error.message || 'Checkout processing failed' });
  }
});

// GET /api/v1/bookings/lookup - Manage My Booking (Airline-style lookup without account login)
router.get('/lookup', (req, res) => {
  const { reference, email, lastName } = req.query;

  if (!reference) {
    return res.status(400).json({ error: 'Booking reference or PNR is required' });
  }

  const cleanRef = reference.trim().toUpperCase();

  // Find booking by booking_ref or PNR
  const booking = db.prepare(`
    SELECT * FROM bookings
    WHERE UPPER(booking_ref) = ? OR UPPER(pnr) = ?
  `).get(cleanRef, cleanRef);

  if (!booking) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: "We couldn't find a booking with those details. Double-check your reference and try again."
    });
  }

  // Validate either email or last name if provided
  if (email) {
    if (booking.client_email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(404).json({
        error: 'MISMATCH',
        message: "The email address does not match this booking record."
      });
    }
  } else if (lastName) {
    const parts = booking.client_name.toLowerCase().split(' ');
    if (!parts.includes(lastName.trim().toLowerCase())) {
      return res.status(404).json({
        error: 'MISMATCH',
        message: "The last name does not match this booking record."
      });
    }
  }

  let items = [];
  try {
    items = JSON.parse(booking.items_json);
  } catch (e) {
    items = [];
  }

  // Strictly sanitize client output: NET RATE IS NEVER EXPOSED TO CLIENT
  const clientView = {
    id: booking.id,
    booking_ref: booking.booking_ref,
    pnr: booking.pnr,
    client_name: booking.client_name,
    client_email: booking.client_email,
    vertical: booking.vertical,
    status: booking.status,
    travel_date: booking.travel_date,
    items: items.map(item => {
      const cleanItem = { ...item };
      delete cleanItem.net_rate;
      delete cleanItem.margin;
      return cleanItem;
    }),
    total_price: booking.client_price,
    currency: booking.currency,
    created_at: booking.created_at,
    white_label: booking.white_label_json ? JSON.parse(booking.white_label_json) : null
  };

  return res.json({ booking: clientView });
});

// POST /api/v1/bookings/:id/cancel - Request cancellation
router.post('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? OR booking_ref = ?').get(id, id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status === 'flown') {
    return res.status(400).json({ error: 'Completed or flown travel cannot be cancelled.' });
  }

  // Transition status to refund_pending
  db.prepare(`
    UPDATE bookings
    SET status = 'refund_pending', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(booking.id);

  return res.json({
    message: 'Cancellation request submitted successfully. Refund processing has been initiated.',
    booking_ref: booking.booking_ref,
    status: 'refund_pending',
    timeline: [
      { step: 'Cancellation requested', completed: true, timestamp: new Date().toISOString() },
      { step: 'Supplier refund processing', completed: false, current: true },
      { step: 'Refund credited to original payment method', completed: false }
    ]
  });
});

// POST /api/v1/bookings/:id/send-itinerary - Agent send white-label itinerary email to client
router.post('/:id/send-itinerary', authenticateToken, (req, res) => {
  const { id } = req.params;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? OR booking_ref = ?').get(id, id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const whiteLabel = booking.white_label_json ? JSON.parse(booking.white_label_json) : {
    agency_name: 'Skyline Travel Agency',
    agent_name: req.user ? req.user.full_name : 'Agent'
  };

  // Simulates dispatching white-label itinerary with PNR and client-facing price
  return res.json({
    success: true,
    message: `White-labeled itinerary for booking ${booking.booking_ref} (PNR: ${booking.pnr}) sent successfully to ${booking.client_email}.`,
    sender_brand: whiteLabel.agency_name,
    client_recipient: booking.client_email,
    pnr: booking.pnr,
    client_price_shown: booking.client_price,
    net_rate_protected: true
  });
});

module.exports = router;

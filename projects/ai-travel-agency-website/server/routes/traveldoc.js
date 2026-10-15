// server/routes/traveldoc.js
const express = require('express');
const router = express.Router();
const travelDocEngine = require('../services/travelDocEngine');
const { db } = require('../db');
const { authenticateToken } = require('./auth');

// POST /api/v1/traveldoc/check - Embedded Visa & Travel Document Checker
router.post('/check', (req, res) => {
  try {
    const {
      passport_country = 'Nigeria',
      nationality = 'Nigerian',
      residence_country = 'Nigeria',
      destination_country = 'France',
      travel_purpose = 'tourism',
      duration_days = 10,
      transit_country = null,
      notes = ''
    } = req.body;

    // 1. Prohibited Sensitive Data Redaction & Validation
    const sanitized = travelDocEngine.sanitizeInput(notes);

    // 2. Deterministic Rules Engine Execution
    const evaluation = travelDocEngine.evaluateRequirements({
      passportCountry: passport_country,
      nationality: nationality || passport_country,
      residenceCountry: residence_country,
      destinationCountry: destination_country,
      travelPurpose: travel_purpose,
      durationDays: parseInt(duration_days) || 10,
      transitCountry: transit_country
    });

    // 3. Grounded Explanation Generation
    const explanation = travelDocEngine.generateExplanation({
      evaluationResult: evaluation,
      userNotes: sanitized.cleanText
    });

    // Log query in audit trail
    db.prepare(`
      INSERT INTO traveldoc_query_logs (id, passport_country, destination_country, purpose, redacted_input, rule_id, outcome, ai_grounded)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      `qry_${Date.now()}`,
      passport_country,
      destination_country,
      travel_purpose,
      sanitized.cleanText || null,
      evaluation.rule_id || null,
      evaluation.permission_outcome
    );

    return res.json({
      evaluation,
      explanation,
      security: {
        prohibited_detected: sanitized.detectedProhibited,
        warnings: sanitized.warnings
      },
      notice: 'DEMO DATA, NOT FOR REAL TRAVEL DECISIONS',
      disclaimer: 'Official immigration rules may change without notice. Entry to any foreign territory is at the sole discretion of the border immigration authority. Approval is not guaranteed.'
    });
  } catch (error) {
    console.error('TravelDoc check error:', error);
    return res.status(500).json({ error: error.message || 'Error processing travel document check' });
  }
});

// GET /api/v1/traveldoc/manifest - Dynamically generated coverage manifest from stored rules
router.get('/manifest', (req, res) => {
  try {
    const manifest = travelDocEngine.getCoverageManifest();
    return res.json(manifest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/traveldoc/sources - List authoritative sources and freshness status
router.get('/sources', (req, res) => {
  try {
    const sources = db.prepare(`
      SELECT s.*, u1.full_name as curator_name, u2.full_name as verifier_name
      FROM traveldoc_sources s
      LEFT JOIN users u1 ON s.curator_id = u1.id
      LEFT JOIN users u2 ON s.verifier_id = u2.id
      ORDER BY s.last_verified_at DESC
    `).all();

    const enriched = sources.map(s => {
      const lastVerified = new Date(s.last_verified_at);
      const now = new Date();
      const ageDays = Math.floor((now - lastVerified) / (1000 * 60 * 60 * 24));
      return {
        ...s,
        age_days: ageDays,
        is_fresh: ageDays <= s.freshness_days
      };
    });

    return res.json({ sources: enriched });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/traveldoc/curator/rule - Submit rule for second-person review
router.post('/curator/rule', authenticateToken, (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'curator' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Curator or admin role required' });
    }

    const result = travelDocEngine.createRule({
      ruleData: req.body,
      curatorId: req.user.id
    });

    return res.status(201).json({
      message: 'Rule created and queued for independent second-person verification before activation.',
      result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/traveldoc/curator/verify - Independent second-person verification
router.post('/curator/verify', authenticateToken, (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'curator' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Curator or admin role required' });
    }

    const { rule_id } = req.body;
    if (!rule_id) return res.status(400).json({ error: 'rule_id is required' });

    const result = travelDocEngine.verifyRule({
      ruleId: rule_id,
      verifierId: req.user.id
    });

    return res.json({
      message: 'Independent second-person verification successful. Rule is now active in verified status.',
      result
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;

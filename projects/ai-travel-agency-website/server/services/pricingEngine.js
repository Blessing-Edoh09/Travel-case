// server/services/pricingEngine.js
// B2B Wholesale / Reseller Pricing Engine with 0% Floor & Per-Vertical Cap Enforcement

const { db } = require('../db');

class PricingEngine {
  // Fetch current admin-configured markup caps for all verticals
  getMarkupCaps() {
    const rows = db.prepare('SELECT vertical, max_markup_pct FROM markup_caps').all();
    const caps = {};
    for (const r of rows) {
      caps[r.vertical] = r.max_markup_pct;
    }
    return caps;
  }

  // Get cap for a specific vertical (defaults to 20% if not found)
  getCapForVertical(vertical) {
    const v = (vertical || 'flights').toLowerCase();
    const row = db.prepare('SELECT max_markup_pct FROM markup_caps WHERE vertical = ?').get(v);
    return row ? row.max_markup_pct : 20.0;
  }

  // Calculate pricing for an item or cart
  // For B2C: shows published/retail price. Net rate and margins are strictly deleted.
  // For B2B Agent: shows net rate, default/applied markup %, client price, and margin.
  computePricing({ netRate, vertical, requestedMarkupPct, isAgent = false, agentDefaults = {} }) {
    if (netRate == null || netRate <= 0) {
      throw new Error('Valid net rate is required for pricing computation');
    }

    const cap = this.getCapForVertical(vertical);
    let markupPct = 0;

    if (isAgent) {
      if (requestedMarkupPct != null && requestedMarkupPct !== '') {
        markupPct = parseFloat(requestedMarkupPct);
      } else if (agentDefaults && agentDefaults[vertical] != null) {
        markupPct = parseFloat(agentDefaults[vertical]);
      } else {
        markupPct = 10.0; // standard agent baseline default
      }

      // Backend validation: 0% Floor
      if (markupPct < 0) {
        return {
          valid: false,
          error: 'INVALID_MARKUP_FLOOR',
          message: 'Markup cannot be less than 0%. Client price must not fall below wholesale net rate.',
          net_rate: netRate,
          cap
        };
      }

      // Backend validation: Per-vertical Cap
      if (markupPct > cap) {
        return {
          valid: false,
          error: 'MARKUP_EXCEEDS_CAP',
          message: `Proposed markup (${markupPct}%) exceeds the maximum configured cap of ${cap}% for ${vertical}.`,
          net_rate: netRate,
          cap
        };
      }
    } else {
      // For B2C consumer, standard suggested retail margin (e.g., 12%)
      markupPct = 12.0;
    }

    const margin = Math.round(netRate * (markupPct / 100));
    const clientPrice = netRate + margin;

    if (isAgent) {
      return {
        valid: true,
        vertical,
        net_rate: netRate,
        markup_pct: markupPct,
        client_price: clientPrice,
        margin: margin,
        cap: cap,
        is_agent: true
      };
    }

    // B2C: Strictly omit net rate, internal costs, and margin
    return {
      valid: true,
      vertical,
      client_price: clientPrice,
      is_agent: false
    };
  }

  // Sanitize booking or search response to guarantee client isolation
  // Never expose net_rate or margin to a client-facing session
  sanitizeForClient(data) {
    if (!data) return data;
    const clean = JSON.parse(JSON.stringify(data));

    const removeInternalFinancials = (obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      delete obj.net_rate;
      delete obj.net_rate_total;
      delete obj.net_rate_per_night;
      delete obj.net_rate_per_day;
      delete obj.margin;
      delete obj.markup_pct;
      delete obj.agent_id;
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          removeInternalFinancials(obj[key]);
        }
      }
    };

    removeInternalFinancials(clean);
    return clean;
  }
}

module.exports = new PricingEngine();

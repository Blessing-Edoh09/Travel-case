// server/db.js - SQLite Database initialization and schema migrations
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'travelcase.db');
const SEED_DB_PATH = path.join(__dirname, '..', 'data', 'travelcase.db');

if (isVercel) {
  // In Vercel serverless, copy pre-seeded database to /tmp if it doesn't already exist
  if (!fs.existsSync(DB_PATH) && fs.existsSync(SEED_DB_PATH)) {
    try {
      fs.copyFileSync(SEED_DB_PATH, DB_PATH);
    } catch (e) {
      console.warn('Could not copy seed database to /tmp:', e.message);
    }
  }
} else if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- Users table (Customers, Agents, Admins, Curators)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'agent', 'admin', 'curator')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending', 'active', 'rejected', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Agent profiles for B2B wholesale system
    CREATE TABLE IF NOT EXISTS agent_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      agency_name TEXT NOT NULL,
      logo_url TEXT,
      phone TEXT,
      address TEXT,
      business_reg_number TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
      approved_by TEXT,
      approved_at DATETIME,
      default_markups TEXT NOT NULL DEFAULT '{"flights":10,"hotels":15,"cars":12,"activities":15,"transfers":15}',
      partner_since DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Platform-wide Admin Markup Caps (bounds agent markup percentages per vertical)
    CREATE TABLE IF NOT EXISTS markup_caps (
      vertical TEXT PRIMARY KEY,
      max_markup_pct REAL NOT NULL,
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Bookings across all verticals (Flights, Hotels, Cars, Activities, Transfers, Bundles)
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_ref TEXT UNIQUE NOT NULL,
      pnr TEXT NOT NULL,
      user_id TEXT,
      is_agent_booking INTEGER NOT NULL DEFAULT 0,
      agent_id TEXT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      vertical TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('pending', 'confirmed', 'flown', 'cancelled', 'refund_pending')),
      items_json TEXT NOT NULL,
      net_rate REAL NOT NULL,
      markup_pct REAL NOT NULL DEFAULT 0,
      client_price REAL NOT NULL,
      margin REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'NGN',
      payment_status TEXT NOT NULL DEFAULT 'completed',
      payment_method TEXT NOT NULL DEFAULT 'card_tokenized',
      payment_ref TEXT,
      white_label_json TEXT,
      travel_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agent_profiles(id)
    );

    -- TravelDoc AI: Authoritative Sources Registry
    CREATE TABLE IF NOT EXISTS traveldoc_sources (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      authority_level TEXT NOT NULL CHECK(authority_level IN ('official_government', 'embassy', 'consulate', 'iata_timatic_reference', 'internal_approved_curator')),
      url TEXT,
      jurisdiction TEXT NOT NULL,
      last_verified_at DATETIME NOT NULL,
      freshness_days INTEGER NOT NULL DEFAULT 90,
      curator_id TEXT NOT NULL,
      verifier_id TEXT,
      status TEXT NOT NULL DEFAULT 'verified' CHECK(status IN ('draft', 'pending_second_review', 'verified', 'stale', 'deprecated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TravelDoc AI: Deterministic Travel Rules
    CREATE TABLE IF NOT EXISTS traveldoc_rules (
      id TEXT PRIMARY KEY,
      rule_code TEXT UNIQUE NOT NULL,
      passport_country TEXT NOT NULL,
      nationality TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      transit_country TEXT,
      travel_purpose TEXT NOT NULL CHECK(travel_purpose IN ('tourism', 'business', 'transit', 'study', 'work')),
      max_stay_days INTEGER,
      permission_outcome TEXT NOT NULL CHECK(permission_outcome IN ('visa_required', 'visa_free', 'evisa_eta', 'transit_visa_required', 'transit_visa_free', 'escalation_required', 'no_verified_coverage')),
      requirements_json TEXT NOT NULL,
      source_id TEXT NOT NULL,
      curator_id TEXT NOT NULL,
      verified_by TEXT,
      verified_at DATETIME,
      status TEXT NOT NULL DEFAULT 'verified' CHECK(status IN ('draft', 'pending_second_review', 'verified', 'stale', 'archived')),
      is_demo INTEGER NOT NULL DEFAULT 1,
      effective_date DATE NOT NULL,
      expiry_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_id) REFERENCES traveldoc_sources(id)
    );

    -- TravelDoc AI: Curator Audit Trail & Second-person Verification Logs
    CREATE TABLE IF NOT EXISTS traveldoc_audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      details_json TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TravelDoc AI: Verification Queries & Redacted Query Logs
    CREATE TABLE IF NOT EXISTS traveldoc_query_logs (
      id TEXT PRIMARY KEY,
      passport_country TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      purpose TEXT NOT NULL,
      redacted_input TEXT,
      rule_id TEXT,
      outcome TEXT NOT NULL,
      ai_grounded INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default markup caps if not present
  const capCount = db.prepare('SELECT COUNT(*) as count FROM markup_caps').get().count;
  if (capCount === 0) {
    const insertCap = db.prepare('INSERT INTO markup_caps (vertical, max_markup_pct, updated_by) VALUES (?, ?, ?)');
    insertCap.run('flights', 18.0, 'system');
    insertCap.run('hotels', 25.0, 'system');
    insertCap.run('cars', 20.0, 'system');
    insertCap.run('activities', 30.0, 'system');
    insertCap.run('transfers', 25.0, 'system');
  }

  // Seed initial users if not present
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync('Password123!', 10);

    // 1. Admin
    const adminId = 'usr_admin_01';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run(adminId, 'admin@travelcase.com', passwordHash, 'Travel Case Super Admin');

    // 2. Verified B2B Agent (Chidi - Skyline Travel Agency from PRD/Prompts)
    const agentUserId = 'usr_agent_chidi';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'agent', 'active')
    `).run(agentUserId, 'chidi@skylinetravel.ng', passwordHash, 'Chidi Okonkwo');

    const agentProfileId = 'agp_skyline_01';
    db.prepare(`
      INSERT INTO agent_profiles (id, user_id, agency_name, logo_url, phone, address, business_reg_number, verification_status, approved_by, approved_at, default_markups, partner_since)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, CURRENT_TIMESTAMP, ?, '2026-01-15')
    `).run(
      agentProfileId,
      agentUserId,
      'Skyline Travel Agency',
      '/assets/skyline_logo.png',
      '+234 803 555 0199',
      '14 Marina Street, Lagos Island, Lagos',
      'RC-849201',
      adminId,
      JSON.stringify({ flights: 12, hotels: 18, cars: 15, activities: 20, transfers: 15 })
    );

    // 3. Pending Agent (for Admin Approvals demonstration)
    const pendingAgentUserId = 'usr_agent_pending';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'agent', 'pending')
    `).run(pendingAgentUserId, 'tunde@horizonexpeditions.ng', passwordHash, 'Babatunde Adeleke');

    db.prepare(`
      INSERT INTO agent_profiles (id, user_id, agency_name, phone, address, business_reg_number, verification_status, default_markups)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      'agp_horizon_02',
      pendingAgentUserId,
      'Horizon Expeditions Ltd',
      '+234 802 111 8822',
      '42 Allen Avenue, Ikeja, Lagos',
      'RC-992831',
      JSON.stringify({ flights: 10, hotels: 15, cars: 12, activities: 15, transfers: 15 })
    );

    // 4. TravelDoc Curator & Verifier
    const curatorId = 'usr_curator_01';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'curator', 'active')
    `).run(curatorId, 'curator@travelcase.com', passwordHash, 'Amara Visa Curator');

    const verifierId = 'usr_verifier_02';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, 'curator', 'active')
    `).run(verifierId, 'verifier@travelcase.com', passwordHash, 'David Immigration Verifier');

    // 5. Seed TravelDoc Sources
    const sourceFr = 'src_france_gouv';
    db.prepare(`
      INSERT INTO traveldoc_sources (id, source_name, authority_level, url, jurisdiction, last_verified_at, freshness_days, curator_id, verifier_id, status)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 90, ?, ?, 'verified')
    `).run(sourceFr, 'France-Visas (Official Portal for Visa Application to France)', 'official_government', 'https://france-visas.gouv.fr', 'France / Schengen', curatorId, verifierId);

    const sourceUae = 'src_uae_gdrfa';
    db.prepare(`
      INSERT INTO traveldoc_sources (id, source_name, authority_level, url, jurisdiction, last_verified_at, freshness_days, curator_id, verifier_id, status)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 60, ?, ?, 'verified')
    `).run(sourceUae, 'General Directorate of Residency and Foreigners Affairs (GDRFA Dubai)', 'official_government', 'https://gdrfad.gov.ae', 'United Arab Emirates', curatorId, verifierId);

    const sourceUk = 'src_uk_visas';
    db.prepare(`
      INSERT INTO traveldoc_sources (id, source_name, authority_level, url, jurisdiction, last_verified_at, freshness_days, curator_id, verifier_id, status)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 90, ?, ?, 'verified')
    `).run(sourceUk, 'UK Visas and Immigration (GOV.UK)', 'official_government', 'https://www.gov.uk/browse/visas-immigration', 'United Kingdom', curatorId, verifierId);

    const sourceKenya = 'src_kenya_eta';
    db.prepare(`
      INSERT INTO traveldoc_sources (id, source_name, authority_level, url, jurisdiction, last_verified_at, freshness_days, curator_id, verifier_id, status)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 90, ?, ?, 'verified')
    `).run(sourceKenya, 'Kenya Electronic Travel Authorisation (eTA Kenya)', 'official_government', 'https://www.etakenya.go.ke', 'Kenya', curatorId, verifierId);

    // 6. Seed Deterministic TravelDoc Rules with Second-Person Verification
    const rulesToInsert = [
      {
        id: 'rul_ng_fr_tourism',
        rule_code: 'NG-FR-TOURISM-01',
        passport_country: 'Nigeria',
        nationality: 'Nigerian',
        destination_country: 'France',
        travel_purpose: 'tourism',
        max_stay_days: 90,
        permission_outcome: 'visa_required',
        requirements: [
          { id: 'REQ-FR-01', title: 'Valid Passport', category: 'Required', description: 'Issued less than 10 years ago, valid for at least 3 months after intended departure from the Schengen area, with at least 2 blank pages.' },
          { id: 'REQ-FR-02', title: 'Schengen Short-Stay Visa (Type C)', category: 'Required', description: 'Official Schengen visa obtained via authorized French visa application center (VFS Global/Capago) prior to travel.' },
          { id: 'REQ-FR-03', title: 'Travel Medical Insurance', category: 'Required', description: 'Minimum coverage of €30,000 for emergency medical and repatriation, valid across the entire Schengen zone.' },
          { id: 'REQ-FR-04', title: 'Proof of Accommodation', category: 'Required', description: 'Confirmed hotel reservation, rental contract, or Attestation d’accueil issued by local French town hall if staying with a host.' },
          { id: 'REQ-FR-05', title: 'Round-Trip Flight Reservation', category: 'Required', description: 'Round-trip flight booking or itinerary with verified PNR showing dates of entry and departure.' },
          { id: 'REQ-FR-06', title: 'Proof of Financial Means', category: 'Required', description: 'Bank statements for the last 3-6 months showing at least €65/day if hotel booked or €120/day without pre-booked hotel.' },
          { id: 'REQ-FR-07', title: 'Proof of Socio-Professional Ties', category: 'Conditional', description: 'Letter from employer stating approved leave, business registration certificate for self-employed, or student enrollment letter.' },
          { id: 'REQ-FR-08', title: 'Minor Travel Authorization', category: 'Conditional', description: 'Required only if traveling with or as a minor: certified parental consent and birth certificate.' }
        ],
        source_id: sourceFr
      },
      {
        id: 'rul_ng_ae_tourism',
        rule_code: 'NG-AE-TOURISM-01',
        passport_country: 'Nigeria',
        nationality: 'Nigerian',
        destination_country: 'United Arab Emirates',
        travel_purpose: 'tourism',
        max_stay_days: 30,
        permission_outcome: 'visa_required',
        requirements: [
          { id: 'REQ-AE-01', title: 'Valid Passport', category: 'Required', description: 'Standard passport valid for a minimum of 6 months from the date of arrival in the UAE.' },
          { id: 'REQ-AE-02', title: 'UAE Tourist Visa (30/60 Days)', category: 'Required', description: 'Pre-arranged electronic visa issued via airline, travel agency or GDRFA/ICP portal.' },
          { id: 'REQ-AE-03', title: 'Confirmed Return Flight Ticket', category: 'Required', description: 'Proof of confirmed return or onward flight booking with operating carrier.' },
          { id: 'REQ-AE-04', title: 'Confirmed Hotel Booking', category: 'Required', description: 'Valid hotel voucher covering duration of stay in UAE.' },
          { id: 'REQ-AE-05', title: 'Bank Account Balance Verification', category: 'Verify', description: 'Immigration regulations require sufficient funds (minimum equivalent of USD $1,000 or credit card equivalent) to be demonstrated upon request.' }
        ],
        source_id: sourceUae
      },
      {
        id: 'rul_ng_gb_tourism',
        rule_code: 'NG-GB-TOURISM-01',
        passport_country: 'Nigeria',
        nationality: 'Nigerian',
        destination_country: 'United Kingdom',
        travel_purpose: 'tourism',
        max_stay_days: 180,
        permission_outcome: 'visa_required',
        requirements: [
          { id: 'REQ-GB-01', title: 'Valid Passport', category: 'Required', description: 'Passport valid for the entire duration of your stay in the UK with at least one blank page.' },
          { id: 'REQ-GB-02', title: 'Standard Visitor Visa', category: 'Required', description: 'UK Standard Visitor visa applied for online up to 3 months before travel, followed by biometric appointment at TLScontact.' },
          { id: 'REQ-GB-03', title: 'Financial Evidence', category: 'Required', description: 'Bank statements showing ability to support yourself and fund the trip without working or accessing public funds.' },
          { id: 'REQ-GB-04', title: 'Proof of Accommodation & Itinerary', category: 'Recommended', description: 'Details of where you intend to stay and planned tourism activities (do not pay for non-refundable tickets prior to visa decision).' },
          { id: 'REQ-GB-05', title: 'Ties to Home Country', category: 'Required', description: 'Evidence of employment, studies, property or family commitments in Nigeria confirming intention to return.' }
        ],
        source_id: sourceUk
      },
      {
        id: 'rul_ng_ke_tourism',
        rule_code: 'NG-KE-TOURISM-01',
        passport_country: 'Nigeria',
        nationality: 'Nigerian',
        destination_country: 'Kenya',
        travel_purpose: 'tourism',
        max_stay_days: 90,
        permission_outcome: 'evisa_eta',
        requirements: [
          { id: 'REQ-KE-01', title: 'Valid Passport', category: 'Required', description: 'Passport valid for at least 6 months with at least one blank page.' },
          { id: 'REQ-KE-02', title: 'Kenya Electronic Travel Authorisation (eTA)', category: 'Required', description: 'All international travelers (including Nigerian citizens) must obtain an approved eTA online before travel via etakenya.go.ke.' },
          { id: 'REQ-KE-03', title: 'Passport Photo', category: 'Required', description: 'Recent passport-style photograph matching ICAO standards.' },
          { id: 'REQ-KE-04', title: 'Yellow Fever Vaccination Certificate', category: 'Required', description: 'Mandatory for travelers coming from Nigeria and other endemic areas, valid 10 days after administration.' },
          { id: 'REQ-KE-05', title: 'Confirmed Return/Onward Flight Booking', category: 'Required', description: 'Air ticket reservation showing scheduled exit from Kenya.' },
          { id: 'REQ-KE-06', title: 'Confirmed Hotel Booking', category: 'Required', description: 'Confirmed lodging reservation or host invitation letter.' }
        ],
        source_id: sourceKenya
      }
    ];

    const insertRule = db.prepare(`
      INSERT INTO traveldoc_rules (
        id, rule_code, passport_country, nationality, destination_country, travel_purpose,
        max_stay_days, permission_outcome, requirements_json, source_id, curator_id,
        verified_by, verified_at, status, is_demo, effective_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'verified', 1, '2026-01-01', 'Verified test rule')
    `);

    for (const r of rulesToInsert) {
      insertRule.run(
        r.id,
        r.rule_code,
        r.passport_country,
        r.nationality,
        r.destination_country,
        r.travel_purpose,
        r.max_stay_days,
        r.permission_outcome,
        JSON.stringify(r.requirements),
        r.source_id,
        curatorId,
        verifierId
      );
    }

    // 7. Seed Sample Bookings (Covering Confirmed, Pending, Flown, Cancelled across B2C & B2B)
    const sampleBookings = [
      {
        id: 'bkg_001',
        booking_ref: 'TC-48291',
        pnr: 'XR7QP2',
        user_id: null,
        is_agent_booking: 0,
        agent_id: null,
        client_name: 'Adeola Adeleke',
        client_email: 'adeola.adeleke@example.com',
        client_phone: '+234 802 345 6789',
        vertical: 'flights',
        status: 'confirmed',
        items: [
          {
            type: 'flight',
            airline: 'Emirates',
            airline_code: 'EK',
            flight_number: 'EK 784',
            origin: 'LOS',
            origin_name: 'Murtala Muhammed Intl, Lagos',
            destination: 'DXB',
            destination_name: 'Dubai International',
            departure_time: '18:10',
            arrival_time: '04:15 +1',
            duration: '7h 05m',
            stops: 'Direct',
            class_of_service: 'Economy (Fare class Y)',
            travel_date: '2026-11-12',
            return_date: '2026-11-20',
            price: 512000
          }
        ],
        net_rate: 457142,
        markup_pct: 12.0,
        client_price: 512000,
        margin: 54858,
        currency: 'NGN',
        white_label: null,
        travel_date: '2026-11-12'
      },
      {
        id: 'bkg_002',
        booking_ref: 'TC-92841',
        pnr: 'KL48P9',
        user_id: agentUserId,
        is_agent_booking: 1,
        agent_id: agentProfileId,
        client_name: 'Femi K.',
        client_email: 'femi.k@clientcorp.ng',
        client_phone: '+234 805 111 2233',
        vertical: 'bundle',
        status: 'confirmed',
        items: [
          {
            type: 'flight',
            airline: 'Air France',
            airline_code: 'AF',
            flight_number: 'AF 854',
            origin: 'LOS',
            origin_name: 'Lagos',
            destination: 'CDG',
            destination_name: 'Paris Charles de Gaulle',
            departure_time: '23:30',
            arrival_time: '06:15 +1',
            duration: '6h 45m',
            stops: 'Direct',
            class_of_service: 'Premium Economy',
            travel_date: '2026-10-28',
            price: 780000
          },
          {
            type: 'hotel',
            property_name: 'Pullman Paris Tour Eiffel',
            location: 'Paris, France',
            check_in: '2026-10-29',
            check_out: '2026-11-04',
            room_type: 'Classic King Room',
            nights: 6,
            price: 1140000
          }
        ],
        net_rate: 1714285,
        markup_pct: 12.0,
        client_price: 1920000,
        margin: 205715,
        currency: 'NGN',
        white_label: {
          agency_name: 'Skyline Travel Agency',
          logo_url: '/assets/skyline_logo.png',
          phone: '+234 803 555 0199',
          agent_name: 'Chidi Okonkwo'
        },
        travel_date: '2026-10-28'
      },
      {
        id: 'bkg_003',
        booking_ref: 'TC-33821',
        pnr: 'KQ99M1',
        user_id: agentUserId,
        is_agent_booking: 1,
        agent_id: agentProfileId,
        client_name: 'Dr. Ngozi Eze',
        client_email: 'ngozi.eze@healthng.org',
        vertical: 'flights',
        status: 'flown',
        items: [
          {
            type: 'flight',
            airline: 'Kenya Airways',
            airline_code: 'KQ',
            flight_number: 'KQ 533',
            origin: 'LOS',
            origin_name: 'Lagos',
            destination: 'NBO',
            destination_name: 'Nairobi Jomo Kenyatta',
            departure_time: '12:45',
            arrival_time: '19:50',
            duration: '5h 05m',
            stops: 'Direct',
            class_of_service: 'Business Class',
            travel_date: '2026-08-10',
            price: 840000
          }
        ],
        net_rate: 730434,
        markup_pct: 15.0,
        client_price: 840000,
        margin: 109566,
        currency: 'NGN',
        white_label: {
          agency_name: 'Skyline Travel Agency',
          agent_name: 'Chidi Okonkwo'
        },
        travel_date: '2026-08-10'
      },
      {
        id: 'bkg_004',
        booking_ref: 'TC-77124',
        pnr: 'BA182X',
        user_id: agentUserId,
        is_agent_booking: 1,
        agent_id: agentProfileId,
        client_name: 'Olumide Jacobs',
        client_email: 'olumide@jacobsgroup.com',
        vertical: 'flights',
        status: 'cancelled',
        items: [
          {
            type: 'flight',
            airline: 'British Airways',
            airline_code: 'BA',
            flight_number: 'BA 074',
            origin: 'LOS',
            origin_name: 'Lagos',
            destination: 'LHR',
            destination_name: 'London Heathrow',
            departure_time: '22:15',
            arrival_time: '05:30 +1',
            duration: '6h 15m',
            stops: 'Direct',
            class_of_service: 'Economy',
            travel_date: '2026-09-14',
            price: 640000
          }
        ],
        net_rate: 581818,
        markup_pct: 10.0,
        client_price: 640000,
        margin: 58182,
        currency: 'NGN',
        white_label: {
          agency_name: 'Skyline Travel Agency',
          agent_name: 'Chidi Okonkwo'
        },
        travel_date: '2026-09-14'
      },
      {
        id: 'bkg_005',
        booking_ref: 'TC-11094',
        pnr: 'ET721K',
        user_id: agentUserId,
        is_agent_booking: 1,
        agent_id: agentProfileId,
        client_name: 'Alhaji Sanusi Dantata',
        client_email: 'sanusi@dantataglobal.ng',
        vertical: 'hotel',
        status: 'pending',
        items: [
          {
            type: 'hotel',
            property_name: 'Address Downtown Luxury Hotel',
            location: 'Downtown Dubai, UAE',
            check_in: '2026-11-20',
            check_out: '2026-11-27',
            room_type: 'Executive Suite',
            nights: 7,
            price: 1295000
          }
        ],
        net_rate: 1126086,
        markup_pct: 15.0,
        client_price: 1295000,
        margin: 168914,
        currency: 'NGN',
        white_label: {
          agency_name: 'Skyline Travel Agency',
          agent_name: 'Chidi Okonkwo'
        },
        travel_date: '2026-11-20'
      }
    ];

    const insertBkg = db.prepare(`
      INSERT INTO bookings (
        id, booking_ref, pnr, user_id, is_agent_booking, agent_id,
        client_name, client_email, client_phone, vertical, status, items_json,
        net_rate, markup_pct, client_price, margin, currency, payment_status,
        white_label_json, travel_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
    `);

    for (const b of sampleBookings) {
      insertBkg.run(
        b.id,
        b.booking_ref,
        b.pnr,
        b.user_id,
        b.is_agent_booking,
        b.agent_id,
        b.client_name,
        b.client_email,
        b.client_phone || null,
        b.vertical,
        b.status,
        JSON.stringify(b.items),
        b.net_rate,
        b.markup_pct,
        b.client_price,
        b.margin,
        b.currency,
        b.white_label ? JSON.stringify(b.white_label) : null,
        b.travel_date
      );
    }
  }
}

initDatabase();

module.exports = {
  db,
  initDatabase
};

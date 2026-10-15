// scripts/turso_sync.js - Push local SQLite schema and seed data to Turso Cloud
require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const localDbPath = path.join(__dirname, '..', 'data', 'travelcase.db');

if (!fs.existsSync(localDbPath)) {
  console.error('❌ Local database not found at:', localDbPath);
  process.exit(1);
}

if (!tursoUrl || !tursoToken || tursoToken === 'PASTE_YOUR_TURSO_TOKEN_HERE') {
  console.log(`
======================================================================
☁️  TURSO CLOUD SQLITE SETUP
======================================================================
Your database URL is set:
${tursoUrl || 'Not set'}

👉 Almost there! Please paste your Turso Auth Token in .env:
   Open the .env file and replace PASTE_YOUR_TURSO_TOKEN_HERE with your token.

   (If using the Turso CLI to generate a token, run:
    turso db tokens create travelcase-db)
   (Or generate it from the Turso web dashboard at https://turso.tech)

Then run:
   npm run db:push
======================================================================
`);
  process.exit(0);
}

async function syncToTurso() {
  console.log(`📡 Connecting to Turso database at ${tursoUrl}...`);
  try {
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: tursoUrl,
      authToken: tursoToken
    });

    const localDb = new Database(localDbPath, { readonly: true });

    // 1. Get all table creation DDL
    const tables = localDb.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    console.log(`📋 Found ${tables.length} tables in local SQLite.`);

    for (const table of tables) {
      console.log(`Creating table '${table.name}' on Turso...`);
      await client.execute(table.sql);
    }

    // 2. Sync rows for each table
    for (const table of tables) {
      const rows = localDb.prepare(`SELECT * FROM ${table.name}`).all();
      if (rows.length === 0) continue;

      console.log(`Syncing ${rows.length} rows for table '${table.name}'...`);
      for (const row of rows) {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(row);
        const sql = `INSERT OR REPLACE INTO ${table.name} (${keys.join(', ')}) VALUES (${placeholders})`;
        await client.execute({ sql, args: values });
      }
    }

    console.log(`✅ Successfully synced all tables and records to Turso cloud database!`);
  } catch (err) {
    console.error('❌ Turso sync error:', err.message);
    process.exit(1);
  }
}

syncToTurso();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Replace with your actual Render DATABASE_URL
const DATABASE_URL = process.argv[2];

if (!DATABASE_URL) {
    console.error("Usage: node init-prod-db.js <DATABASE_URL>");
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');

pool.query(sql).then(() => {
    console.log("✅ Database schema applied successfully!");
}).catch(err => {
    console.error("❌ Error:", err.message);
}).finally(() => {
    pool.end();
});

const pool = require('../db');

// Ensure the activity_logs table exists (runs once at startup)
let tableReady = false;
const ensureTable = async () => {
    if (tableReady) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(50) NOT NULL,
                entite VARCHAR(50),
                entite_id INTEGER,
                description TEXT NOT NULL,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action)`);
        tableReady = true;
    } catch (err) {
        console.error('[ActivityLog] Table creation error:', err.message);
    }
};

/**
 * Log an activity event
 * @param {number|null} userId - The user who performed the action
 * @param {string} action - Action type: 'create', 'update', 'delete', 'login', 'logout', 'validate', 'status_change', 'export'
 * @param {string} entite - Entity type: 'irrigation', 'champ', 'pompe', 'enrouleur', 'compensation', 'user', 'auth'
 * @param {string} description - Human-readable description in French
 * @param {number|null} entiteId - ID of the related entity
 * @param {object|null} metadata - Extra data (JSON)
 */
const logActivity = async (userId, action, entite, description, entiteId = null, metadata = null) => {
    try {
        await ensureTable();
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entite, entite_id, description, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, action, entite, entiteId, description, metadata ? JSON.stringify(metadata) : null]
        );
    } catch (err) {
        // Never let logging break the main flow
        console.error('[ActivityLog] Insert error:', err.message);
    }
};

module.exports = logActivity;

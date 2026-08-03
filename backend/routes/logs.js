const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /logs — Paginated activity logs (admin only)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action, entite, user_id, dateDebut, dateFin } = req.query;
        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (action) {
            conditions.push(`l.action = $${paramIndex++}`);
            params.push(action);
        }
        if (entite) {
            conditions.push(`l.entite = $${paramIndex++}`);
            params.push(entite);
        }
        if (user_id) {
            conditions.push(`l.user_id = $${paramIndex++}`);
            params.push(parseInt(user_id));
        }
        if (dateDebut) {
            conditions.push(`l.created_at >= $${paramIndex++}`);
            params.push(dateDebut);
        }
        if (dateFin) {
            conditions.push(`l.created_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            params.push(dateFin);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Count
        const countRes = await pool.query(
            `SELECT COUNT(*) FROM activity_logs l ${whereClause}`,
            params
        );
        const total = parseInt(countRes.rows[0].count);

        // Fetch
        const dataQuery = `
            SELECT l.*, u.nom as user_nom, u.role as user_role
            FROM activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            ${whereClause}
            ORDER BY l.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        params.push(parseInt(limit), offset);

        const result = await pool.query(dataQuery, params);

        res.json({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET /logs/stats — Quick stats for the logs page header
router.get('/stats', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
                COUNT(DISTINCT user_id) as users_actifs,
                COUNT(*) FILTER (WHERE action = 'create' AND entite = 'irrigation' AND created_at >= CURRENT_DATE) as irrigations_today
            FROM activity_logs
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;

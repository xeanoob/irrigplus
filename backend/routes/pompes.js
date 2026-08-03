const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const logActivity = require('../helpers/logActivity');

// GET all pompes for the current user (or all if admin wants, but usually scoped to user)
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = `
            SELECT p.*, u.nom as user_nom
            FROM pompes p
            JOIN users u ON p.user_id = u.id
            WHERE p.actif = TRUE
        `;
        let params = [];
        
        if (req.user.role === 'agriculteur') {
            query += ` AND p.user_id = $1`;
            params.push(req.user.id);
        }
        
        query += ` ORDER BY p.nom ASC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET single pompe
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM pompes WHERE id = $1 AND actif = TRUE',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pompe non trouvée.' });
        if (req.user.role === 'agriculteur' && result.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST create pompe
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nom, debit_m3_h } = req.body;
        if (!nom || !debit_m3_h) return res.status(400).json({ error: 'Le nom et le débit sont requis.' });
        if (parseFloat(debit_m3_h) <= 0) return res.status(400).json({ error: 'Le débit doit être supérieur à 0.' });

        const result = await pool.query(
            `INSERT INTO pompes (nom, debit_m3_h, user_id) VALUES ($1, $2, $3) RETURNING *`,
            [nom, debit_m3_h, req.user.id]
        );
        logActivity(req.user.id, 'create', 'pompe', `A ajouté la pompe « ${nom} » (${debit_m3_h} m³/h)`, result.rows[0].id);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT update pompe
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { nom, debit_m3_h } = req.body;
        if (!nom || !debit_m3_h) return res.status(400).json({ error: 'Le nom et le débit sont requis.' });
        if (parseFloat(debit_m3_h) <= 0) return res.status(400).json({ error: 'Le débit doit être supérieur à 0.' });

        // Check ownership
        const check = await pool.query('SELECT user_id FROM pompes WHERE id = $1 AND actif = TRUE', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Pompe non trouvée.' });
        if (req.user.role === 'agriculteur' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });

        const result = await pool.query(
            `UPDATE pompes SET nom = $1, debit_m3_h = $2 WHERE id = $3 RETURNING *`,
            [nom, debit_m3_h, req.params.id]
        );
        logActivity(req.user.id, 'update', 'pompe', `A modifié la pompe « ${nom} » (${debit_m3_h} m³/h)`, parseInt(req.params.id));
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE (soft delete) pompe
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const check = await pool.query('SELECT user_id FROM pompes WHERE id = $1 AND actif = TRUE', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Pompe non trouvée.' });
        if (req.user.role === 'agriculteur' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });

        await pool.query('UPDATE pompes SET actif = FALSE WHERE id = $1', [req.params.id]);
        logActivity(req.user.id, 'delete', 'pompe', `A supprimé une pompe`, parseInt(req.params.id));
        res.json({ message: 'Pompe supprimée.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;

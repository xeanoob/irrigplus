const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET all champs
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = `
            SELECT c.*, u.nom as user_nom
            FROM champs c
            JOIN users u ON c.user_id = u.id
            WHERE c.actif = TRUE
        `;
        let params = [];
        
        if (req.user.role === 'agriculteur') {
            query += ` AND c.user_id = $1`;
            params.push(req.user.id);
        }
        
        query += ` ORDER BY c.nom_champ ASC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET single champ
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM champs WHERE id = $1 AND actif = TRUE',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Champ non trouvé.' });
        if (req.user.role === 'agriculteur' && result.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST create champ
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nom_champ, surface_m2 } = req.body;
        if (!nom_champ || !surface_m2) return res.status(400).json({ error: 'Le nom et la surface sont requis.' });
        if (parseFloat(surface_m2) <= 0) return res.status(400).json({ error: 'La surface doit être supérieure à 0.' });

        const result = await pool.query(
            `INSERT INTO champs (nom_champ, surface_m2, user_id) VALUES ($1, $2, $3) RETURNING *`,
            [nom_champ, surface_m2, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT update champ
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { nom_champ, surface_m2 } = req.body;
        if (!nom_champ || !surface_m2) return res.status(400).json({ error: 'Le nom et la surface sont requis.' });

        const check = await pool.query('SELECT user_id FROM champs WHERE id = $1 AND actif = TRUE', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Champ non trouvé.' });
        if (req.user.role === 'agriculteur' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });

        const result = await pool.query(
            `UPDATE champs SET nom_champ = $1, surface_m2 = $2 WHERE id = $3 RETURNING *`,
            [nom_champ, surface_m2, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE champ
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const check = await pool.query('SELECT user_id FROM champs WHERE id = $1 AND actif = TRUE', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Champ non trouvé.' });
        if (req.user.role === 'agriculteur' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });

        await pool.query('UPDATE champs SET actif = FALSE WHERE id = $1', [req.params.id]);
        res.json({ message: 'Champ supprimé.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;

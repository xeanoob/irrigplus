const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const logActivity = require('../helpers/logActivity');

// GET all enrouleurs
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = `
            SELECT e.*, u.nom as user_nom
            FROM enrouleurs e
            JOIN users u ON e.user_id = u.id
            WHERE e.actif = TRUE
        `;
        let params = [];
        
        if (req.user.role === 'agriculteur') {
            query += ` AND e.user_id = $1`;
            params.push(req.user.id);
        }
        
        query += ` ORDER BY e.nom ASC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET single enrouleur
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM enrouleurs WHERE id = $1 AND actif = TRUE',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Enrouleur non trouvé.' });
        if (req.user.role === 'agriculteur' && result.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST create enrouleur
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nom, surface_travail, taille_buse } = req.body;
        if (!nom || !taille_buse) return res.status(400).json({ error: 'Le nom et la taille de la buse sont requis.' });

        const result = await pool.query(
            `INSERT INTO enrouleurs (nom, surface_travail, taille_buse, user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
            [nom, surface_travail || null, taille_buse, req.user.id]
        );
        logActivity(req.user.id, 'create', 'enrouleur', `A ajouté l'enrouleur « ${nom} » (buse ${taille_buse})`, result.rows[0].id);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT update enrouleur
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { nom, surface_travail, taille_buse } = req.body;
        if (!nom || !taille_buse) return res.status(400).json({ error: 'Le nom et la taille de la buse sont requis.' });

        const check = await pool.query('SELECT user_id FROM enrouleurs WHERE id = $1 AND actif = TRUE', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Enrouleur non trouvé.' });
        if (req.user.role === 'agriculteur' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });

        const result = await pool.query(
            `UPDATE enrouleurs SET nom = $1, surface_travail = $2, taille_buse = $3 WHERE id = $4 RETURNING *`,
            [nom, surface_travail || null, taille_buse, req.params.id]
        );
        logActivity(req.user.id, 'update', 'enrouleur', `A modifié l'enrouleur « ${nom} » (buse ${taille_buse})`, parseInt(req.params.id));
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE enrouleur
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const check = await pool.query('SELECT user_id FROM enrouleurs WHERE id = $1 AND actif = TRUE', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Enrouleur non trouvé.' });
        if (req.user.role === 'agriculteur' && check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });

        await pool.query('UPDATE enrouleurs SET actif = FALSE WHERE id = $1', [req.params.id]);
        logActivity(req.user.id, 'delete', 'enrouleur', `A supprimé un enrouleur`, parseInt(req.params.id));
        res.json({ message: 'Enrouleur supprimé.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;

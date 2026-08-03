const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');
const logActivity = require('../helpers/logActivity');

// GET all users (admin only)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nom, email, role, actif, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST create user (admin only)
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { nom, email, mot_de_passe, role } = req.body;
        if (!nom || !email || !mot_de_passe) {
            return res.status(400).json({ error: 'Nom, email et mot de passe requis.' });
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(mot_de_passe, salt);

        const result = await pool.query(
            'INSERT INTO users (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role, actif, created_at',
            [nom, email, hash, role || 'agriculteur']
        );

        res.status(201).json(result.rows[0]);
        logActivity(req.user.id, 'create', 'user', `A créé le compte « ${nom} » (${role || 'agriculteur'})`, result.rows[0].id);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT update role (admin only)
router.put('/:id/role', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['agriculteur', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide.' });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, nom, email, role, actif',
            [role, req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        logActivity(req.user.id, 'update', 'user', `A changé le rôle de « ${result.rows[0].nom} » en ${role}`, parseInt(req.params.id));
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT toggle actif (admin only)
router.put('/:id/toggle', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE users SET actif = NOT actif WHERE id = $1 RETURNING id, nom, email, role, actif',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        const u = result.rows[0];
        logActivity(req.user.id, 'update', 'user', `A ${u.actif ? 'activé' : 'désactivé'} le compte « ${u.nom} »`, parseInt(req.params.id));
        res.json(u);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE user (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même.' });
        }
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, nom', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        logActivity(req.user.id, 'delete', 'user', `A supprimé le compte « ${result.rows[0].nom} »`, parseInt(id));
        res.json({ message: 'Utilisateur supprimé.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');


const registerSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Format d'email invalide"),
    mot_de_passe: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    role: z.enum(['agriculteur', 'admin']).optional()
});

const loginSchema = z.object({
    email: z.string().email("Format d'email invalide"),
    mot_de_passe: z.string().min(1, "Mot de passe requis")
});


router.post('/register', async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const { nom, email, mot_de_passe, role } = validatedData;
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(mot_de_passe, salt);
        const result = await pool.query(
            'INSERT INTO users (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role',
            [nom, email, hash, role || 'agriculteur']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});


router.post('/login', async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        let { email, mot_de_passe } = validatedData;

        
        email = email.trim().toLowerCase();

        console.log(`Login attempt for: [${email}]`);

        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 AND actif = TRUE', [email]);

        if (result.rows.length === 0) {
            console.log(`Login failed: User not found or inactive for [${email}]`);
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!isMatch) {
            console.log(`Login failed: Password mismatch for [${email}]`);
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }
        const token = jwt.sign(
            { id: user.id, nom: user.nom, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});


router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nom, email, role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const logActivity = require('../helpers/logActivity');

// GET all irrigations (with server-side filtering & pagination)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { champ_id, dateDebut, dateFin, page = 1, limit = 50 } = req.query;
        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        
        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (req.user.role === 'agriculteur') {
            conditions.push(`i.user_id = $${paramIndex++}`);
            params.push(req.user.id);
        }
        if (champ_id) {
            conditions.push(`i.champ_id = $${paramIndex++}`);
            params.push(champ_id);
        }
        if (dateDebut) {
            conditions.push(`i.date_debut >= $${paramIndex++}`);
            params.push(dateDebut);
        }
        if (dateFin) {
            conditions.push(`i.date_debut <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            params.push(dateFin);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Count total for pagination
        const countQuery = `
            SELECT COUNT(*) FROM irrigations i ${whereClause}
        `;
        const countRes = await pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count);

        // Fetch paginated data
        const dataQuery = `
            SELECT i.*, 
                   c.nom_champ as champ_nom, 
                   p.nom as pompe_nom, 
                   p.debit_m3_h as pompe_debit,
                   e.nom as enrouleur_nom,
                   u.nom as user_nom
            FROM irrigations i
            JOIN champs c ON i.champ_id = c.id
            JOIN pompes p ON i.pompe_id = p.id
            JOIN enrouleurs e ON i.enrouleur_id = e.id
            JOIN users u ON i.user_id = u.id
            ${whereClause}
            ORDER BY i.date_debut DESC
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

// GET active irrigations (statut = 'lance' or 'programme')
router.get('/actives', verifyToken, async (req, res) => {
    try {
        let conditions = ["i.statut IN ('lance', 'programme')"];
        let params = [];

        if (req.user.role === 'agriculteur') {
            conditions.push('i.user_id = $1');
            params.push(req.user.id);
        }

        const query = `
            SELECT i.*, 
                   c.nom_champ as champ_nom, 
                   c.surface_m2 as champ_surface_m2,
                   p.nom as pompe_nom, 
                   p.debit_m3_h as pompe_debit,
                   e.nom as enrouleur_nom,
                   e.surface_travail as enrouleur_largeur,
                   u.nom as user_nom
            FROM irrigations i
            JOIN champs c ON i.champ_id = c.id
            JOIN pompes p ON i.pompe_id = p.id
            JOIN enrouleurs e ON i.enrouleur_id = e.id
            JOIN users u ON i.user_id = u.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY i.date_debut ASC
        `;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST create irrigation session
router.post('/', verifyToken, async (req, res) => {
    try {
        const { champ_id, pompe_id, enrouleur_id, type_culture, distance_deroulee, taille_buse_session, largeur_travail, dose_mm, duree_h, methode_calcul, statut, date_debut, date_fin } = req.body;
        
        let volume_total_m3 = 0;
        let final_duree_h = duree_h ? parseFloat(duree_h) : null;

        const pompeRes = await pool.query('SELECT debit_m3_h FROM pompes WHERE id = $1', [pompe_id]);
        const debitPompe = pompeRes.rows.length > 0 ? parseFloat(pompeRes.rows[0].debit_m3_h) : 0;

        if (methode_calcul === 'dose') {
            // Formule: Volume = (distance_deroulee × largeur_travail × dose) / 1000
            let largeur_m = parseFloat(largeur_travail || 0);
            if (!largeur_m) {
                const enrouleurRes = await pool.query('SELECT surface_travail FROM enrouleurs WHERE id = $1', [enrouleur_id]);
                if (enrouleurRes.rows.length > 0 && enrouleurRes.rows[0].surface_travail) {
                    largeur_m = parseFloat(enrouleurRes.rows[0].surface_travail);
                }
            }
            const distance = parseFloat(distance_deroulee || 0);
            const dose = parseFloat(dose_mm || 0);
            volume_total_m3 = (distance * largeur_m * dose) / 1000;

            // Auto-compute duration if not provided
            if (!final_duree_h && debitPompe > 0 && volume_total_m3 > 0) {
                final_duree_h = parseFloat((volume_total_m3 / debitPompe).toFixed(2));
            }
        } else if (methode_calcul === 'temps') {
            const duree = parseFloat(duree_h || 0);
            volume_total_m3 = debitPompe * duree;
            final_duree_h = duree;
        }

        const query = `
            INSERT INTO irrigations 
            (user_id, champ_id, pompe_id, enrouleur_id, type_culture, distance_deroulee, taille_buse_session, largeur_travail, dose_mm, duree_h, methode_calcul, volume_total_m3, date_debut, date_fin, statut) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING *
        `;
        const values = [
            req.user.id, 
            champ_id, 
            pompe_id, 
            enrouleur_id, 
            type_culture, 
            distance_deroulee || null,
            taille_buse_session || null,
            largeur_travail || null,
            dose_mm || null, 
            final_duree_h, 
            methode_calcul, 
            volume_total_m3,
            date_debut || new Date(), 
            date_fin || (statut === 'fini' ? new Date() : null), 
            statut || 'fini'
        ];
        
        const result = await pool.query(query, values);

        // Log activity
        const champRes2 = await pool.query('SELECT nom_champ FROM champs WHERE id = $1', [champ_id]);
        const champNom = champRes2.rows[0]?.nom_champ || 'Inconnu';
        const actionStatus = statut === 'lance' ? 'A démarré un tour d\'eau sur' : 'A enregistré une irrigation sur';
        logActivity(
            req.user.id, 'create', 'irrigation',
            `${actionStatus} « ${champNom} » — ${parseFloat(volume_total_m3).toLocaleString('fr-FR')} m³ (${type_culture})`,
            result.rows[0].id,
            { champ_id, volume_total_m3, methode_calcul, type_culture, statut }
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PATCH update irrigation status (programme -> lance -> fini)
router.patch('/:id/statut', verifyToken, async (req, res) => {
    try {
        const { statut } = req.body;
        if (!['programme', 'lance', 'fini'].includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide.' });
        }

        // Check ownership for agriculteur
        const check = await pool.query('SELECT user_id, statut FROM irrigations WHERE id = $1', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Session introuvable.' });
        if (req.user.role === 'agriculteur' && check.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        const updates = { statut };
        let query = 'UPDATE irrigations SET statut = $1';
        let params = [statut];
        let paramIndex = 2;

        // Auto-set date_fin when marking as fini
        if (statut === 'fini') {
            query += `, date_fin = $${paramIndex++}`;
            params.push(new Date());
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        params.push(req.params.id);

        const result = await pool.query(query, params);

        // Log activity
        const irrigInfo = await pool.query(
            `SELECT c.nom_champ, i.volume_total_m3 FROM irrigations i JOIN champs c ON i.champ_id = c.id WHERE i.id = $1`,
            [req.params.id]
        );
        const info = irrigInfo.rows[0];
        const actionLabel = statut === 'lance' ? 'A démarré' : 'A terminé';
        logActivity(
            req.user.id, 'status_change', 'irrigation',
            `${actionLabel} l'irrigation sur « ${info?.nom_champ || '?'} » (${parseFloat(info?.volume_total_m3 || 0).toLocaleString('fr-FR')} m³)`,
            parseInt(req.params.id),
            { statut, volume_total_m3: info?.volume_total_m3 }
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { jsPDF } = require('jspdf');
const { applyPlugin } = require('jspdf-autotable');
applyPlugin(jsPDF);

// GET compensations (admin only)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.nom as admin_nom
            FROM compensations c
            LEFT JOIN users u ON c.valide_par_admin_id = u.id
            ORDER BY c.date_jour DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET calcul journalier (admin only)
// Calcule la somme des m3 pompés pour la journée sélectionnée
router.get('/calcul/:date', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { date } = req.params;
        const result = await pool.query(`
            SELECT COALESCE(SUM(volume_total_m3), 0) as total_m3
            FROM irrigations
            WHERE DATE(date_debut) = $1
        `, [date]);
        
        res.json({ date, total_m3: result.rows[0].total_m3 });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST save compensation
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { date_jour, volume_total_pompe_m3, volume_restitue_m3 } = req.body;
        
        // Upsert
        const result = await pool.query(`
            INSERT INTO compensations (date_jour, volume_total_pompe_m3, volume_restitue_m3, valide_par_admin_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (date_jour) 
            DO UPDATE SET 
                volume_total_pompe_m3 = EXCLUDED.volume_total_pompe_m3,
                volume_restitue_m3 = EXCLUDED.volume_restitue_m3,
                valide_par_admin_id = EXCLUDED.valide_par_admin_id
            RETURNING *
        `, [date_jour, volume_total_pompe_m3, volume_restitue_m3, req.user.id]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET trend data for chart (admin only)
router.get('/trend', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.date_jour, c.volume_total_pompe_m3, c.volume_restitue_m3
            FROM compensations c
            ORDER BY c.date_jour ASC
            LIMIT 90
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET per-farmer breakdown for a given date (admin only)
router.get('/par-agriculteur/:date', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { date } = req.params;
        const result = await pool.query(`
            SELECT u.id, u.nom, COUNT(i.id) as sessions, COALESCE(SUM(i.volume_total_m3), 0) as volume_m3
            FROM users u
            LEFT JOIN irrigations i ON u.id = i.user_id AND DATE(i.date_debut) = $1
            WHERE u.role = 'agriculteur' AND u.actif = TRUE
            GROUP BY u.id, u.nom
            ORDER BY volume_m3 DESC
        `, [date]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET export PDF DDT (admin only)
router.get('/export-pdf', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.date_jour, c.volume_total_pompe_m3, c.volume_restitue_m3, u.nom as admin_nom
            FROM compensations c
            LEFT JOIN users u ON c.valide_par_admin_id = u.id
            ORDER BY c.date_jour DESC
        `);

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text('Rapport de Restitution Rivière', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`iRRIG+ — Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
        doc.text('Destinataire : Direction Départementale des Territoires (DDT)', 14, 36);

        // Summary
        const totalPompe = result.rows.reduce((s, r) => s + parseFloat(r.volume_total_pompe_m3), 0);
        const totalRestitue = result.rows.reduce((s, r) => s + parseFloat(r.volume_restitue_m3), 0);
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`Total pompé : ${totalPompe.toLocaleString('fr-FR')} m³`, 14, 46);
        doc.text(`Total restitué : ${totalRestitue.toLocaleString('fr-FR')} m³`, 14, 52);
        doc.text(`Nombre de jours : ${result.rows.length}`, 14, 58);

        // Table
        doc.autoTable({
            startY: 66,
            head: [['Date', 'Volume Pompé (m³)', 'Volume Restitué (m³)', 'Validé par']],
            body: result.rows.map(r => [
                new Date(r.date_jour).toLocaleDateString('fr-FR'),
                parseFloat(r.volume_total_pompe_m3).toLocaleString('fr-FR'),
                parseFloat(r.volume_restitue_m3).toLocaleString('fr-FR'),
                r.admin_nom || '-'
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [31, 41, 55] },
        });

        const buffer = Buffer.from(doc.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=rapport_ddt_irrigplus.pdf');
        res.send(buffer);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur lors de la génération du PDF.' });
    }
});

module.exports = router;

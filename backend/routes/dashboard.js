const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, async (req, res) => {
    try {
        const { range = '7days' } = req.query;
        let dateFilter = '';
        
        switch (range) {
            case '7days': dateFilter = "AND i.date_debut >= NOW() - INTERVAL '7 days'"; break;
            case '30days': dateFilter = "AND i.date_debut >= NOW() - INTERVAL '30 days'"; break;
            case 'lastMonth': dateFilter = "AND DATE_TRUNC('month', i.date_debut) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')"; break;
            case '3months': dateFilter = "AND i.date_debut >= NOW() - INTERVAL '3 months'"; break;
            case 'thisYear': dateFilter = "AND DATE_TRUNC('year', i.date_debut) = DATE_TRUNC('year', NOW())"; break;
            case 'lastYear': dateFilter = "AND DATE_TRUNC('year', i.date_debut) = DATE_TRUNC('year', NOW() - INTERVAL '1 year')"; break;
            default: dateFilter = "AND i.date_debut >= NOW() - INTERVAL '7 days'";
        }

        let userFilter = '';
        let params = [];
        if (req.user.role === 'agriculteur') {
            userFilter = 'AND i.user_id = $1';
            params.push(req.user.id);
        }

        // Today's stats
        let todayParams = [...params];
        let todayQuery = `
            SELECT COUNT(*) as sessions, COALESCE(SUM(i.volume_total_m3), 0) as volume_m3
            FROM irrigations i
            WHERE DATE(i.date_debut) = CURRENT_DATE ${userFilter}
        `;
        const todayRes = await pool.query(todayQuery, todayParams);
        const todayVol = parseFloat(todayRes.rows[0].volume_m3);
        const today = { volume_m3: todayVol, volume: todayVol * 1000 };

        // Period stats
        let periodQuery = `
            SELECT COUNT(*) as total_sessions, 
                   COALESCE(SUM(i.volume_total_m3), 0) as total_volume_m3,
                   COUNT(DISTINCT i.champ_id) as champs_irrigues
            FROM irrigations i
            WHERE 1=1 ${dateFilter} ${userFilter}
        `;
        const periodRes = await pool.query(periodQuery, params);
        const periodVol = parseFloat(periodRes.rows[0].total_volume_m3);
        const period = {
            total_sessions: parseInt(periodRes.rows[0].total_sessions),
            total_volume_m3: periodVol,
            total_volume: periodVol * 1000,
            champs_irrigues: parseInt(periodRes.rows[0].champs_irrigues)
        };

        // Trend
        let trendQuery = `
            SELECT DATE(i.date_debut) as jour, COALESCE(SUM(i.volume_total_m3), 0) as volume_m3
            FROM irrigations i
            WHERE 1=1 ${dateFilter} ${userFilter}
            GROUP BY DATE(i.date_debut)
            ORDER BY jour ASC
        `;
        const trendRes = await pool.query(trendQuery, params);
        const trend = trendRes.rows.map(r => ({
            jour: r.jour,
            volume_m3: parseFloat(r.volume_m3),
            volume: parseFloat(r.volume_m3) * 1000
        }));

        // Counts
        let countsParams = [];
        let champsFilter = '';
        let pompesFilter = '';
        let enrouleursFilter = '';
        if (req.user.role === 'agriculteur') {
            champsFilter = 'AND user_id = $1';
            pompesFilter = 'AND user_id = $1';
            enrouleursFilter = 'AND user_id = $1';
            countsParams.push(req.user.id);
        }
        
        const champsCount = await pool.query(`SELECT COUNT(*) FROM champs WHERE actif = TRUE ${champsFilter}`, countsParams);
        const pompesCount = await pool.query(`SELECT COUNT(*) FROM pompes WHERE actif = TRUE ${pompesFilter}`, countsParams);
        const enrouleursCount = await pool.query(`SELECT COUNT(*) FROM enrouleurs WHERE actif = TRUE ${enrouleursFilter}`, countsParams);

        // Recent
        let recentQuery = `
            SELECT i.id, c.nom_champ as champ, p.nom as pompe, i.date_debut as date, i.volume_total_m3 as volume_m3, i.methode_calcul as methode
            FROM irrigations i
            JOIN champs c ON i.champ_id = c.id
            JOIN pompes p ON i.pompe_id = p.id
            WHERE 1=1 ${userFilter}
            ORDER BY i.date_debut DESC
            LIMIT 5
        `;
        const recentRes = await pool.query(recentQuery, params);
        const recent = recentRes.rows.map(r => ({
            ...r,
            volume: parseFloat(r.volume_m3) * 1000
        }));

        // Top champs
        let topQuery = `
            SELECT c.id, c.nom_champ as nom, c.surface_m2, c.user_id, COALESCE(SUM(i.volume_total_m3), 0) as total_volume_m3, COUNT(i.id) as nb_sessions
            FROM champs c
            LEFT JOIN irrigations i ON c.id = i.champ_id ${dateFilter}
            WHERE c.actif = TRUE
            ${req.user.role === 'agriculteur' ? 'AND c.user_id = $1' : ''}
            GROUP BY c.id, c.nom_champ, c.surface_m2, c.user_id
            ORDER BY total_volume_m3 DESC
            LIMIT 5
        `;
        const topRes = await pool.query(topQuery, params);
        const top_champs = topRes.rows.map(r => ({
            ...r,
            total_volume: parseFloat(r.total_volume_m3) * 1000
        }));

        // Per-farmer breakdown (admin only)
        let par_agriculteur = [];
        if (req.user.role === 'admin') {
            const farmersQuery = `
                SELECT u.id, u.nom, COUNT(i.id) as sessions, COALESCE(SUM(i.volume_total_m3), 0) as volume_m3
                FROM users u
                LEFT JOIN irrigations i ON u.id = i.user_id ${dateFilter.replace(/i\./g, 'i.')}
                WHERE u.role = 'agriculteur' AND u.actif = TRUE
                GROUP BY u.id, u.nom
                ORDER BY volume_m3 DESC
            `;
            const farmersRes = await pool.query(farmersQuery);
            par_agriculteur = farmersRes.rows.map(r => ({
                ...r,
                volume_m3: parseFloat(r.volume_m3),
                sessions: parseInt(r.sessions)
            }));
        }

        res.json({
            today,
            period,
            trend,
            counts: {
                champs: parseInt(champsCount.rows[0].count),
                pompes: parseInt(pompesCount.rows[0].count),
                enrouleurs: parseInt(enrouleursCount.rows[0].count)
            },
            recent,
            top_champs,
            par_agriculteur
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;

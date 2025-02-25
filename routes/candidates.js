const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const candidates = await pool.query(`
            SELECT id, username, description 
            FROM users 
            WHERE is_candidate = TRUE
            ORDER BY username ASC
        `);

        res.render('candidates', { candidates: candidates.rows });
    } catch (error) {
        console.error("❌ Eroare la încărcarea listei de candidați:", error);
        res.render('candidates', { candidates: [] });
    }
});

module.exports = router;
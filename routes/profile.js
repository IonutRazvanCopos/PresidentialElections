const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const result = await pool.query('SELECT id, username, description, is_candidate FROM users WHERE id = $1', [req.session.user.id]);
        if (result.rows.length === 0) {
            return res.redirect('/login');
        }
        const user = result.rows[0];
        res.render('profile', { user, errorMessage: null });
    } catch (error) {
        console.error("❌ Eroare la încărcarea profilului:", error);
        res.render('profile', { user: null, errorMessage: 'Eroare la încărcarea profilului' });
    }
});

router.get('/:id', async (req, res) => {
    const candidateId = req.params.id;
    try {
        const result = await pool.query('SELECT id, username, description, is_candidate FROM users WHERE id = $1 AND is_candidate = TRUE', [candidateId]);
        if (result.rows.length === 0) {
            return res.status(404).send("Profilul acestui utilizator este privat sau nu există.");
        }
        const candidate = result.rows[0];
        res.render('candidates', { candidate });
    } catch (error) {
        console.error("❌ Eroare la încărcarea profilului candidatului:", error);
        res.status(500).send("Eroare la încărcarea profilului candidatului.");
    }
});

module.exports = router;
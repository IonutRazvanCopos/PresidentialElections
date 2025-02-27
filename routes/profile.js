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
        res.status(500).send("Eroare la încărcarea profilului candidatului.");
    }
});

router.post('/update', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        const userId = req.session.user.id;
        const { description } = req.body;
        await pool.query(`UPDATE users SET description = $1 WHERE id = $2`, [description, userId]);
        req.session.user.description = description;
        return res.redirect('/profile?successMessage=Descriere actualizată cu succes!');
    } catch (error) {
        return res.redirect("/profile?errorMessage=Eroare la actualizarea descrierii.");
    }
});

module.exports = router;
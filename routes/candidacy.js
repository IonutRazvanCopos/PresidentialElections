const express = require('express');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        const userId = req.session.user.id;
        if (!userId) {
            return res.redirect('/profile?errorMessage=Eroare la depunerea candidaturii.');
        }
        const updateCandidate = await pool.query(
            `UPDATE users SET is_candidate = TRUE WHERE id = $1 RETURNING *`, 
            [userId]
        );
        if (updateCandidate.rowCount === 0) {
            return res.redirect('/profile?errorMessage=Eroare la depunerea candidaturii.');
        }
        req.session.user.is_candidate = true;
        return res.redirect('/profile?successMessage=Candidatura depusă cu succes!');
    } catch (error) {
        return res.redirect('/profile?errorMessage=Eroare la depunerea candidaturii.');
    }
});

module.exports = router;
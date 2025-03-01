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
            return res.redirect('/profile');
        }
        const updateCandidate = await pool.query(
            `UPDATE users SET is_candidate = TRUE WHERE id = $1 RETURNING *`, 
            [userId]
        );
        if (updateCandidate.rowCount === 0) {
            return res.redirect('/profile');
        }
        req.session.user.is_candidate = true;
        return res.redirect('/profile');
    } catch (error) {
        return res.redirect('/profile');
    }
});

module.exports = router;
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_candidate = TRUE WHERE id = $1', [req.user.id]);
        res.redirect('/profile');
    } catch (error) {
        res.redirect('/profile');
    }
});

module.exports = router;
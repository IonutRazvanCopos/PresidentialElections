const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('login', { errorMessage: null });
});

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('login', { errorMessage: 'Toate câmpurile sunt obligatorii!' });
    }
    try {
        const user = await pool.query('SELECT id, username, password FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.render('login', { errorMessage: 'Nume de utilizator incorect!' });
        }
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.render('login', { errorMessage: 'Parolă incorectă!' });
        }
        req.session.user = { id: user.rows[0].id, username: user.rows[0].username };
        res.redirect('/');
    } catch (error) {
        res.render('login', { errorMessage: 'Eroare de server. Încearcă din nou!' });
    }
});

module.exports = router;
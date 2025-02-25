const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('register', { errorMessage: null });
});

router.post('/', async (req, res) => {
    console.log("🔍 Date primite în /register:", req.body); 

    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('register', { errorMessage: 'Toate câmpurile sunt obligatorii!' });
    }

    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

        if (existingUser.rows.length > 0) {
            return res.render('register', { errorMessage: 'Acest nume de utilizator este deja folosit!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);

        res.redirect('/login');
    } catch (error) {
        console.error("❌ Eroare la înregistrare:", error);
        res.render('register', { errorMessage: 'Eroare de server. Încearcă din nou!' });
    }
});

module.exports = router;
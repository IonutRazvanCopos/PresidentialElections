const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('register', { errorMessage: null });
});

router.post('/', async (req, res) => { 
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('register', { errorMessage: 'All fields are required!' });
    }
    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.render('register', { errorMessage: 'This username is already taken!' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.redirect('/login');
    } catch (error) {
        console.error("Register Error", error);
        res.render('register', { errorMessage: 'Error Server. Try Again!' });
    }
});

module.exports = router;
const express = require('express');
const bcrypt = require('bcrypt');
const { getUserByUsername } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('login', { errorMessage: null });
});

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('login', { errorMessage: 'All fields are required!' });
    }

    try {
        const user = await getUserByUsername(username);
        if (!user) {
            return res.render('login', { errorMessage: 'Incorrect Username!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { errorMessage: 'Incorrect Password!' });
        }

        req.session.user = { id: user.id, username: user.username };
        res.redirect('/');
    } catch (error) {
        res.render('login', { errorMessage: 'Server Error' });
    }
});

module.exports = router;
const express = require('express');
const bcrypt = require('bcrypt');
const { getUserByUsername, createUser } = require('../db');

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
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.render('register', { errorMessage: 'This username is already taken!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(username, hashedPassword);
        res.redirect('/login');
    } catch (error) {
        console.error("Register Error", error);
        res.render('register', { errorMessage: 'Server Error. Try Again!' });
    }
});

module.exports = router;
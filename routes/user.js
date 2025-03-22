const express = require('express');
const bcrypt = require('bcrypt');
const { getUserByUsername, createUser, getUserById, updateUserDescription, createVotingRound } = require('../db');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', { errorMessage: null }); 
});

router.post('/login', async (req, res) => {
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

        req.session.user = { 
            id: user.id, 
            username: user.username,
            is_admin: user.is_admin 
        };

        res.redirect('/');
    } catch (error) {
        res.render('login', { errorMessage: 'Server Error' });
    }
});

router.get('/register', (req, res) => {
    res.render('register', { errorMessage: null });
});

router.post('/register', async (req, res) => {
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

router.get('/profile', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const user = await getUserById(req.session.user.id);
        if (!user) {
            return res.redirect('/login');
        }
        res.render('profile', { user, loggedInUser: req.session.user, errorMessage: null });
    } catch (error) {
        res.render('profile', { user: null, loggedInUser: req.session.user, errorMessage: 'Loading Error' });
    }
});

router.get('/profile/:id', async (req, res) => {
    const userId = req.params.id;
    const loggedInUser = req.session.user || null;

    try {
        const user = await getUserById(userId);

        if (!user) {
            return res.render('profile', { user: {}, loggedInUser, errorMessage: "Profile not found." });
        }

        if (!user.is_public && !user.is_candidate) {
            return res.render('profile', { user: {}, loggedInUser, errorMessage: "This profile is private." });
        }        

        res.render('profile', { user, loggedInUser, errorMessage: null });

    } catch (error) {
        console.error("Error loading profile:", error);
        res.render('profile', { user: {}, loggedInUser, errorMessage: "Error loading profile." });
    }
});

router.post('/update', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        const userId = req.session.user.id;
        const { description } = req.body;

        await updateUserDescription(userId, description);
        req.session.user.description = description;

        return res.redirect('/profile?successMessage=Description updated successfully.');
    } catch (error) {
        return res.redirect("/profile?errorMessage=Error updating description.");
    }
});

router.get('/admin', (req, res) => {
    if (!req.session.user || !req.session.user.is_admin) {
        return res.redirect('/');
    }
    res.render('admin', { errorMessage: null });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
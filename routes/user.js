const express = require('express');
const bcrypt = require('bcrypt');
const { getUserByUsername, createUser, getUserById, updateUserDescription } = require('../db');
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

        res.render('profile', {
            viewedUser: user,
            errorMessage: null
        });

    } catch (error) {
        console.error("Error loading profile:", error);
        res.render('profile', {
            viewedUser: null,
            errorMessage: 'Loading Error'
        });
    }
});

router.get('/profile/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const viewedUser = await getUserById(userId);
        if (!viewedUser) {
            return res.status(404).render('profile', {
                viewedUser: null,
                errorMessage: "Profile not found.",
            });
        }
        const isAccessible = viewedUser.is_public || viewedUser.is_candidate;
        if (!isAccessible) {
            return res.status(403).render('profile', {
                viewedUser: null,
                errorMessage: "This profile is private."
            });
        }
        if (req.session.user && req.session.user.id === viewedUser.id) {
            return res.redirect('/user/profile');
        }
        return res.render('profile', {
            viewedUser,
            errorMessage: null
        });
    } catch (error) {
        return res.status(500).render('profile', {
            viewedUser: null,
            errorMessage: "Server error while loading profile."
        });
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
        return res.status(403).send("Access denied");
    }
    res.render('admin', { errorMessage: null });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
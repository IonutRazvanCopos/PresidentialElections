const express = require('express');
const { getUserById, updateUserDescription } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
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

router.get('/:id', async (req, res) => {
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

module.exports = router;
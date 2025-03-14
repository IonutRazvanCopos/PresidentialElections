const express = require('express');
const { setUserAsCandidate } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        const userId = req.session.user.id;

        const updatedUser = await setUserAsCandidate(userId);

        if (!updatedUser) {
            return res.redirect('/profile');
        }

        req.session.user.is_candidate = true;
        req.session.user.is_public = true;

        return res.redirect('/profile');
    } catch (error) {
        console.error("Error in candidacy route:", error);
        return res.redirect('/profile');
    }
});

module.exports = router;
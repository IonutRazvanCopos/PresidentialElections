const express = require('express');
const { getUserById, getCandidateById, updateUserDescription } = require('../db');

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
        res.render('profile', { user, errorMessage: null });
    } catch (error) {
        res.render('profile', { user: null, errorMessage: 'Loading Error' });
    }
});

router.get('/:id', async (req, res) => {
    const candidateId = req.params.id;
    try {
        const candidate = await getCandidateById(candidateId);
        if (!candidate) {
            return res.status(404).send("Profile of candidate is private or does not exist.");
        }
        res.render('candidates', { candidate });
    } catch (error) {
        res.status(500).send("Error loading candidate profile.");
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
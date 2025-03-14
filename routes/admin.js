const express = require('express');
const { createVotingRound } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
    if (!req.session.user || !req.session.user.is_admin) {
        return res.redirect('/');
    }
    res.render('admin', { errorMessage: null });
});

router.post('/create-round', async (req, res) => {
    if (!req.session.user || !req.session.user.is_admin) {
        return res.redirect('/');
    }

    const { name, start_time, end_time } = req.body;
    if (!name || !start_time || !end_time) {
        return res.render('admin', { errorMessage: 'All fields are required!' });
    }

    try {
        await createVotingRound(name, start_time, end_time);
        res.redirect('/admin?successMessage=Voting round created successfully!');
    } catch (error) {
        res.render('admin', { errorMessage: 'Error creating voting round!' });
    }
});

module.exports = router;
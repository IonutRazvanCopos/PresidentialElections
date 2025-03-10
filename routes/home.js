const express = require('express');
const { hasUserVoted, getCandidatesWithVotes } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let userHasVoted = false;
        let user = req.session.user || null;
        if (user) {
            userHasVoted = await hasUserVoted(user.id);
        }
        const candidates = await getCandidatesWithVotes();
        res.render('home', { 
            user, 
            candidates,
            userHasVoted,
            errorMessage: req.query.errorMessage || null,
            successMessage: req.query.successMessage || null
        });
    } catch (error) {
        res.render('home', { 
            user: null, 
            candidates: [], 
            userHasVoted: false,
            errorMessage: 'Error loading candidates', 
        });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
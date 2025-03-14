const express = require('express');
const { getActiveVotingRounds, getCandidatesByRound, addCandidateToRound, hasUserVotedInRound, voteInRound } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let user = req.session.user || null;
        let activeRounds = await getActiveVotingRounds();
        let selectedRoundId = req.query.round || null;
        let candidates = [];
        let userHasVoted = false;

        if (selectedRoundId) {
            candidates = await getCandidatesByRound(selectedRoundId);
            if (user) {
                userHasVoted = await hasUserVotedInRound(user.id, selectedRoundId);
            }
        }

        res.render('home', { 
            user, 
            activeRounds, 
            selectedRoundId, 
            candidates,
            userHasVoted
        });
    } catch (error) {
        res.render('home', { 
            user: null, 
            activeRounds: [], 
            selectedRoundId: null, 
            candidates: [], 
            userHasVoted: false,
            errorMessage: "Error loading voting rounds."
        });
    }
});

router.post('/become-candidate', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { round_id } = req.body;

    try {
        await addCandidateToRound(req.session.user.id, round_id);
        res.redirect(`/?round=${round_id}`);
    } catch (error) {
        res.redirect(`/?errorMessage=Failed to become candidate.`);
    }
});

router.post('/vote', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { candidate_id, round_id } = req.body;

    try {
        await voteInRound(req.session.user.id, candidate_id, round_id);
        res.redirect(`/?round=${round_id}&successMessage=Vote registered successfully!`);
    } catch (error) {
        res.redirect(`/?errorMessage=Error registering vote.`);
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
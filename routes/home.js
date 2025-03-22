const express = require('express');
const { getActiveVotingRounds, getCandidatesByRound, hasUserVotedInRound } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const user = req.session.user || null;
        const selectedRoundId = req.query.round || null;
        const activeRounds = await getActiveVotingRounds();

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

module.exports = router;
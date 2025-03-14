const express = require('express');
const { getPastVotingRounds, getCandidatesByPastRound } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let pastRounds = await getPastVotingRounds();
        let selectedRoundId = req.query.round || null;
        let candidates = [];

        if (selectedRoundId) {
            candidates = await getCandidatesByPastRound(selectedRoundId);
        }

        res.render('history', { 
            pastRounds, 
            selectedRoundId, 
            candidates
        });
    } catch (error) {
        res.render('history', { 
            pastRounds: [], 
            selectedRoundId: null, 
            candidates: [], 
            errorMessage: 'Error loading past voting rounds.'
        });
    }
});

module.exports = router;
const express = require('express');
const {
    getPastVotingRounds,
    getCandidatesByPastRound,
    getCandidatesByRound,
    addCandidateToRound,
    hasUserVotedInRound,
    voteInRound,
    createVotingRound,
    setUserAsCandidate,
    updateUserVisibility
} = require('../db');

const router = express.Router();

router.get('/history', async (req, res) => {
    try {
        const pastRounds = await getPastVotingRounds();
        const selectedRoundId = req.query.round || null;
        let candidates = [];

        if (selectedRoundId) {
            candidates = await getCandidatesByPastRound(selectedRoundId);
        }

        res.render('history', { pastRounds, selectedRoundId, candidates });
    } catch (error) {
        res.render('history', {
            pastRounds: [],
            selectedRoundId: null,
            candidates: [],
            errorMessage: 'Error loading past voting rounds.'
        });
    }
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

router.get('/candidates/:roundId', async (req, res) => {
    const candidates = await getCandidatesByRound(req.params.roundId);
    res.json(candidates);
});

router.get('/has-voted/:userId/:roundId', async (req, res) => {
    const hasVoted = await hasUserVotedInRound(req.params.userId, req.params.roundId);
    res.json({ hasVoted });
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

router.post('/become-candidate', async (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { round_id } = req.body;

    try {
        const userId = req.session.user.id;
        await addCandidateToRound(req.session.user.id, round_id);
        await updateUserVisibility(userId, true);
        res.redirect(`/?round=${round_id}`);
    } catch (error) {
        res.redirect(`/?errorMessage=Failed to become candidate.`);
    }
});

router.post('/candidacy', async (req, res) => {
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
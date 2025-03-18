const express = require("express");
const { hasUserVotedInRound, voteInRound, getCandidatesByRound, setUserAsCandidate } = require("../db");

const router = express.Router();

router.get("/candidates/:roundId", async (req, res) => {
    const candidates = await getCandidatesByRound(req.params.roundId);
    res.json(candidates);
});

router.get("/has-voted/:userId/:roundId", async (req, res) => {
    const hasVoted = await hasUserVotedInRound(req.params.userId, req.params.roundId);
    res.json({ hasVoted });
});

router.post("/", async (req, res) => {
    const { voterId, candidateId, roundId } = req.body;
    const vote = await voteInRound(voterId, candidateId, roundId);

    if (!vote) return res.status(400).json({ error: "You already voted in this round" });
    res.json({ success: true, message: "Vote cast successfully" });
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

router.get('/candidates', async (req, res) => {
    try {
        const candidates = await getCandidates();
        res.render('candidates', { candidates });
    } catch (error) {
        res.render('candidates', { candidates: [] });
    }
});

module.exports = router;
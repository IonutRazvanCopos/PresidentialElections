const express = require('express');
const { hasUserVoted, castVote } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    const { candidate_id } = req.body;
    if (!candidate_id) {
        return res.redirect("/?errorMessage=Eroare: You must select a candidate to vote!");
    }

    try {
        const userId = req.session.user.id;
        
        if (await hasUserVoted(userId)) {
            return res.redirect('/?errorMessage=You Already voted, you can vote only once!');
        }

        await castVote(userId, candidate_id);
        return res.redirect('/?successMessage=Vote Successful!');
    } catch (error) {
        return res.redirect('/?errorMessage=Vote Error. Try Again!');
    }
});

module.exports = router;
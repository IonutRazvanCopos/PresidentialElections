const express = require('express');
const pool = require('../db');

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
        const checkVote = await pool.query('SELECT * FROM votes WHERE voter_id = $1', [req.session.user.id]);
        if (checkVote.rows.length > 0) {
            return res.redirect('/?errorMessage=You Already voted, you can vote only once!');
        }
        const insertVote = await pool.query(
            'INSERT INTO votes (voter_id, candidate_id) VALUES ($1, $2) RETURNING *',
            [req.session.user.id, candidate_id]
        );
        return res.redirect('/?successMessage=Vote Successful!');
    } catch (error) {
        return res.redirect('/?errorMessage=Vote Error. Try Again!');
    }
});

module.exports = router;
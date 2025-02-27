const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let userHasVoted = false;
        let user = req.session.user || null;

        if (user) {
            const checkVote = await pool.query('SELECT * FROM votes WHERE voter_id = $1', [user.id]);
            userHasVoted = checkVote.rows.length > 0;
        }

        const candidates = await pool.query(`
            SELECT users.id, users.username, COALESCE(COUNT(votes.id), 0) AS votes
            FROM users
            LEFT JOIN votes ON users.id = votes.candidate_id
            WHERE users.is_candidate = TRUE
            GROUP BY users.id, users.username
            ORDER BY votes DESC
        `);

        res.render('home', { 
            user, 
            candidates: candidates.rows,
            userHasVoted,
            errorMessage: req.query.errorMessage || null,
            successMessage: req.query.successMessage || null
        });
    } catch (error) {
        res.render('home', { 
            user: null, 
            candidates: [], 
            userHasVoted: false,
            errorMessage: 'Eroare la încărcarea candidaților.' 
        });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;